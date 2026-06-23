import { fail } from '@sveltejs/kit';
import { sendForgotPinForEmail } from '$lib/server/auth/forgot-pin';
import { normalizeEmail } from '$lib/utils';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async () => ({});

const SUCCESS_MESSAGE =
	'If that email has portal access, we sent a new temporary PIN. Check your inbox, then sign in — you will choose your own PIN on first sign-in.';

export const actions: Actions = {
	default: async ({ request, locals, platform }) => {
		const data = await request.formData();
		const email = normalizeEmail(String(data.get('email') ?? ''));

		if (!email) {
			return fail(400, { error: 'Enter the email address you use for portal sign-in.' });
		}

		await sendForgotPinForEmail(locals.db, platform, email);

		return { success: true, message: SUCCESS_MESSAGE };
	}
};
