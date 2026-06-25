import { fail, redirect } from '@sveltejs/kit';
import {
	clientPortalLoginFromForm
} from '$lib/server/auth/portal-login';
import { loginDurationFromForm } from '$lib/server/auth/login-duration';
import { redirectAdminAfterLogin, redirectAuthenticatedUser, redirectClientAfterLogin } from '$lib/server/auth/routing';
import { getAdminPassword, setAdminSession } from '$lib/server/auth/session';
import { normalizeEmail } from '$lib/utils';
import { isValidPin, normalizePinInput } from '$lib/utils/pin';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals, url }) => {
	await redirectAuthenticatedUser(locals, url.pathname);
	return {};
};

export const actions: Actions = {
	adminLogin: async ({ request, cookies, url, locals }) => {
		redirectAdminAfterLogin(locals);

		const data = await request.formData();
		const password = String(data.get('password') ?? '').trim();

		if (password !== getAdminPassword()) {
			return fail(400, { adminError: 'Incorrect password.' });
		}

		await setAdminSession(cookies, url, loginDurationFromForm(data), request);
		redirect(303, '/admin');
	},

	portalLogin: async ({ request, locals, cookies, url }) => {
		if (locals.client) {
			await redirectClientAfterLogin(locals);
		}

		const data = await request.formData();
		const email = normalizeEmail(String(data.get('email') ?? ''));
		const pin = normalizePinInput(String(data.get('pin') ?? ''));

		if (!email || !isValidPin(pin)) {
			return fail(400, { portalError: 'Enter a valid email and 6-digit PIN.' });
		}

		const result = await clientPortalLoginFromForm(locals.db, cookies, url, data, request);
		if (result) {
			const portalError =
				typeof result.data?.error === 'string' ? result.data.error : 'Invalid email or PIN.';
			return fail(result.status, { portalError });
		}
	}
};
