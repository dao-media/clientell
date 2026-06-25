import { fail, redirect } from '@sveltejs/kit';
import { and, eq } from 'drizzle-orm';
import type { Cookies } from '@sveltejs/kit';
import { verifyPin } from '$lib/server/auth/pin';
import { setClientSession } from '$lib/server/auth/session';
import { loginDurationFromForm, type LoginDuration } from '$lib/server/auth/login-duration';
import type { Database } from '$lib/server/db';
import { assignments, clients } from '$lib/server/db/schema';
import { normalizeEmail } from '$lib/utils';
import { isValidPin, normalizePinInput } from '$lib/utils/pin';

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

	for (const row of matches) {
		const valid = await verifyPin(pin, row.assignment.pinHash, row.assignment.pinSalt);
		if (valid) {
			return {
				assignmentId: row.assignment.id,
				pinMustChange: row.assignment.pinMustChange
			};
		}
	}

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
	await setClientSession(
		cookies,
		url,
		assignmentId,
		pinMustChange ? 'today' : duration,
		request
	);

	if (pinMustChange) {
		redirect(303, '/portal/set-pin');
	}

	redirect(303, '/portal/brief');
}

export async function clientPortalLoginFromForm(
	db: Database,
	cookies: Cookies,
	url: URL,
	data: FormData,
	request?: Request
) {
	const email = normalizeEmail(String(data.get('email') ?? ''));
	const pin = normalizePinInput(String(data.get('pin') ?? ''));

	if (!email || !isValidPin(pin)) {
		return fail(400, { error: 'Enter a valid email and 6-digit PIN.' });
	}

	const auth = await authenticateClientPortalLogin(db, email, pin);
	if (!auth) {
		return fail(400, { error: 'Invalid email or PIN.' });
	}

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
		redirect(303, '/portal/set-pin');
	}
}
