import { fail, redirect } from '@sveltejs/kit';
import { eq } from 'drizzle-orm';
import { requireClient } from '$lib/server/auth/guard';
import { hashPin } from '$lib/server/auth/pin';
import { loginDurationFromForm } from '$lib/server/auth/login-duration';
import { redirectClientIfPinChangeRequired } from '$lib/server/auth/portal-login';
import { setClientSession } from '$lib/server/auth/session';
import { assignments } from '$lib/server/db/schema';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
	const session = requireClient(locals);

	const [assignment] = await locals.db
		.select({ pinMustChange: assignments.pinMustChange })
		.from(assignments)
		.where(eq(assignments.id, session.assignmentId))
		.limit(1);

	if (!assignment?.pinMustChange) {
		redirect(303, '/portal/brief');
	}
};

export const actions: Actions = {
	default: async ({ request, locals, cookies, url }) => {
		const session = requireClient(locals);
		const data = await request.formData();
		const pin = String(data.get('pin') ?? '').trim();
		const confirmPin = String(data.get('confirmPin') ?? '').trim();

		if (!/^\d{6}$/.test(pin)) {
			return fail(400, { error: 'Choose a 6-digit PIN.' });
		}

		if (pin !== confirmPin) {
			return fail(400, { error: 'PINs do not match.' });
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

		await setClientSession(cookies, url, session.assignmentId, loginDurationFromForm(data), request);
		redirect(303, '/portal/brief');
	}
};
