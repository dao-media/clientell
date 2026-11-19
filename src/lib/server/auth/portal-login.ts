import { fail, redirect } from '@sveltejs/kit';
import { and, eq } from 'drizzle-orm';
import type { Cookies } from '@sveltejs/kit';
import {
	analyzePinValue,
	authDebug,
	debugEnabledFromUrl,
	maskEmail
} from '$lib/debug/auth-debug';
import { verifyPin } from '$lib/server/auth/pin';
import {
	clearPinFailures,
	findLockoutClientByEmail,
	lockoutMessage,
	lockoutState,
	registerFailedPin
} from '$lib/server/auth/pin-lockout';
import { setClientSession } from '$lib/server/auth/session';
import { loginDurationFromForm, type LoginDuration } from '$lib/server/auth/login-duration';
import type { Database } from '$lib/server/db';
import { assignments, clients } from '$lib/server/db/schema';
import { normalizeEmail } from '$lib/utils';
import { isValidPin, normalizePinInput } from '$lib/utils/pin';
import { base } from '$app/paths';

export async function authenticateClientPortalLogin(
	db: Database,
	email: string,
	pin: string
): Promise<{ assignmentId: string; pinMustChange: boolean } | null> {
	const matches = await db
		.select({
			assignment: assignments,
			client: clients
		})
		.from(assignments)
		.innerJoin(clients, eq(assignments.clientId, clients.id))
		.where(and(eq(clients.email, email), eq(assignments.isActive, true)));

	authDebug('authenticate-start', {
		email: maskEmail(email),
		pin: analyzePinValue(pin),
		activeAssignmentCount: matches.length
	});

	for (const row of matches) {
		const valid = await verifyPin(pin, row.assignment.pinHash, row.assignment.pinSalt);
		authDebug('authenticate-verify', {
			assignmentId: row.assignment.id,
			pinMustChange: row.assignment.pinMustChange,
			valid
		});
		if (valid) {
			return {
				assignmentId: row.assignment.id,
				pinMustChange: row.assignment.pinMustChange
			};
		}
	}

	authDebug('authenticate-failed', { email: maskEmail(email) });
	return null;
}

export async function completeClientPortalLogin(
	cookies: Cookies,
	url: URL,
	assignmentId: string,
	pinMustChange: boolean,
	duration: LoginDuration,
	request?: Request
): Promise<never> {
	authDebug('login-complete', {
		assignmentId,
		pinMustChange,
		duration,
		redirectTo: pinMustChange ? '/portal/set-pin' : '/portal/docs'
	});

	await setClientSession(
		cookies,
		url,
		assignmentId,
		pinMustChange ? 'today' : duration,
		request
	);

	if (pinMustChange) {
		redirect(303, `${base}/portal/set-pin`);
	}

	redirect(303, `${base}/portal/docs`);
}

export async function clientPortalLoginFromForm(
	db: Database,
	cookies: Cookies,
	url: URL,
	data: FormData,
	request?: Request
) {
	const rawEmail = String(data.get('email') ?? '');
	const rawPin = String(data.get('pin') ?? '');
	const email = normalizeEmail(rawEmail);
	const pin = normalizePinInput(rawPin, 'portal-login-form');

	authDebug('portal-login-form-received', {
		path: url.pathname,
		email: maskEmail(email),
		rawEmail: maskEmail(rawEmail),
		pin: analyzePinValue(rawPin),
		normalizedPin: analyzePinValue(pin),
		loginDuration: String(data.get('loginDuration') ?? ''),
		userAgent: request?.headers.get('user-agent') ?? null
	});

	if (!email || !isValidPin(pin)) {
		authDebug('portal-login-validation-failed', {
			email: maskEmail(email),
			pin: analyzePinValue(pin),
			emailPresent: Boolean(email),
			pinValid: isValidPin(pin)
		});
		return fail(400, {
			error: 'Enter a valid email and 6-digit PIN.',
			...(debugEnabledFromUrl(url)
				? {
						authDebug: {
							email: maskEmail(email),
							pin: analyzePinValue(rawPin)
						}
					}
				: {})
		});
	}

	const lockoutClient = await findLockoutClientByEmail(db, email);
	if (lockoutClient) {
		const blocked = lockoutMessage(lockoutState(lockoutClient));
		if (blocked) {
			authDebug('portal-login-blocked', { email: maskEmail(email) });
			return fail(423, {
				error: blocked,
				...(debugEnabledFromUrl(url)
					? { authDebug: { email: maskEmail(email), pin: analyzePinValue(rawPin) } }
					: {})
			});
		}
	}

	const auth = await authenticateClientPortalLogin(db, email, pin);
	if (!auth) {
		authDebug('portal-login-invalid-credentials', { email: maskEmail(email) });
		let error = 'Invalid email or PIN.';
		if (lockoutClient) {
			const next = await registerFailedPin(db, lockoutClient);
			error =
				lockoutMessage(next) ??
				(next.kind === 'open'
					? `Invalid email or PIN. ${next.attemptsLeft} attempt${next.attemptsLeft === 1 ? '' : 's'} left before ${next.onFinalStrike ? 'this account is locked' : 'a 30-minute lockout'}.`
					: error);
		}
		return fail(400, {
			error,
			...(debugEnabledFromUrl(url)
				? {
						authDebug: {
							email: maskEmail(email),
							pin: analyzePinValue(rawPin)
						}
					}
				: {})
		});
	}

	if (lockoutClient) await clearPinFailures(db, lockoutClient.id);

	await completeClientPortalLogin(
		cookies,
		url,
		auth.assignmentId,
		auth.pinMustChange,
		loginDurationFromForm(data),
		request
	);
}

export async function redirectClientIfPinChangeRequired(
	db: Database,
	assignmentId: string
): Promise<void> {
	const [assignment] = await db
		.select({ pinMustChange: assignments.pinMustChange })
		.from(assignments)
		.where(eq(assignments.id, assignmentId))
		.limit(1);

	if (assignment?.pinMustChange) {
		authDebug('redirect-set-pin-required', { assignmentId });
		redirect(303, `${base}/portal/set-pin`);
	}
}
