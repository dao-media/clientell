import { fail, redirect } from '@sveltejs/kit';
import { eq } from 'drizzle-orm';
import { requireClient } from '$lib/server/auth/guard';
import { hashPin } from '$lib/server/auth/pin';
import { loginDurationFromForm } from '$lib/server/auth/login-duration';
import { redirectClientIfPinChangeRequired } from '$lib/server/auth/portal-login';
import { setClientSession } from '$lib/server/auth/session';
import { assignments } from '$lib/server/db/schema';
import {
	analyzePinValue,
	authDebug,
	debugEnabledFromUrl
} from '$lib/debug/auth-debug';
import { isValidPin, normalizePinInput } from '$lib/utils/pin';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
	const session = requireClient(locals);

	const [assignment] = await locals.db
		.select({ pinMustChange: assignments.pinMustChange })
		.from(assignments)
		.where(eq(assignments.id, session.assignmentId))
		.limit(1);

	authDebug('set-pin-load', {
		assignmentId: session.assignmentId,
		pinMustChange: assignment?.pinMustChange ?? null
	});

	if (!assignment?.pinMustChange) {
		redirect(303, '/portal/brief');
	}
};

export const actions: Actions = {
	default: async ({ request, locals, cookies, url }) => {
		const session = requireClient(locals);
		const data = await request.formData();
		const rawPin = String(data.get('pin') ?? '');
		const rawConfirmPin = String(data.get('confirmPin') ?? '');
		const pin = normalizePinInput(rawPin, 'set-pin');
		const confirmPin = normalizePinInput(rawConfirmPin, 'set-pin-confirm');

		authDebug('set-pin-form-received', {
			assignmentId: session.assignmentId,
			pin: analyzePinValue(rawPin),
			confirmPin: analyzePinValue(rawConfirmPin),
			normalizedPin: analyzePinValue(pin),
			normalizedConfirmPin: analyzePinValue(confirmPin),
			userAgent: request.headers.get('user-agent') ?? null
		});

		if (!isValidPin(pin)) {
			authDebug('set-pin-validation-failed', { reason: 'invalid-pin' });
			return fail(400, {
				error: 'Choose a 6-digit PIN.',
				...(debugEnabledFromUrl(url)
					? { authDebug: { pin: analyzePinValue(rawPin) } }
					: {})
			});
		}

		if (pin !== confirmPin) {
			authDebug('set-pin-validation-failed', { reason: 'mismatch' });
			return fail(400, {
				error: 'PINs do not match.',
				...(debugEnabledFromUrl(url)
					? {
							authDebug: {
								pin: analyzePinValue(rawPin),
								confirmPin: analyzePinValue(rawConfirmPin)
							}
						}
					: {})
			});
		}

		const { hash, salt } = await hashPin(pin);

		await locals.db
			.update(assignments)
			.set({
				pinHash: hash,
				pinSalt: salt,
				pinMustChange: false
			})
			.where(eq(assignments.id, session.assignmentId));

		authDebug('set-pin-saved', { assignmentId: session.assignmentId });

		await setClientSession(cookies, url, session.assignmentId, loginDurationFromForm(data), request);
		redirect(303, '/portal/brief');
	}
};
