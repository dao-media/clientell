import { fail } from '@sveltejs/kit';
import { sendForgotPinForEmail } from '$lib/server/auth/forgot-pin';
import { authDebug, maskEmail } from '$lib/debug/auth-debug';
import { normalizeEmail } from '$lib/utils';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async () => ({});

const SUCCESS_MESSAGE =
	'If that email has portal access, we sent a new temporary PIN. Check your inbox, then sign in — you will choose your own PIN on first sign-in.';

export const actions: Actions = {
	default: async ({ request, locals, platform, url }) => {
		const data = await request.formData();
		const rawEmail = String(data.get('email') ?? '');
		const email = normalizeEmail(rawEmail);

		authDebug('forgot-pin-form-received', {
			path: url.pathname,
			email: maskEmail(email),
			rawEmail: maskEmail(rawEmail),
			userAgent: request.headers.get('user-agent') ?? null
		});

		if (!email) {
			authDebug('forgot-pin-validation-failed', { reason: 'empty-email' });
			return fail(400, { error: 'Enter the email address you use for portal sign-in.' });
		}

		const { sent } = await sendForgotPinForEmail(locals.db, platform, email);

		authDebug('forgot-pin-complete', { email: maskEmail(email), sent });

		return { success: true, message: SUCCESS_MESSAGE };
	}
};
