import { fail, redirect } from '@sveltejs/kit';
import {
	clientPortalLoginFromForm
} from '$lib/server/auth/portal-login';
import { loginDurationFromForm } from '$lib/server/auth/login-duration';
import { redirectAdminAfterLogin, redirectClientAfterLogin } from '$lib/server/auth/routing';
import { getAdminPassword, setAdminSession } from '$lib/server/auth/session';
import { normalizeEmail } from '$lib/utils';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async () => ({});

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
		const pin = String(data.get('pin') ?? '').trim();

		if (!email || !/^\d{6}$/.test(pin)) {
			return fail(400, { portalError: 'Enter a valid email and 6-digit PIN.' });
		}

		const result = await clientPortalLoginFromForm(locals.db, cookies, url, data, request);
		if (result && 'error' in result && result.error) {
			return fail(400, { portalError: result.error });
		}
	}
};
