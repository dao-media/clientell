import { fail, redirect } from '@sveltejs/kit';
import {
	clientPortalLoginFromForm
} from '$lib/server/auth/portal-login';
import { authDebug, maskEmail } from '$lib/debug/auth-debug';
import { loginDurationFromForm } from '$lib/server/auth/login-duration';
import { redirectAdminAfterLogin, redirectAuthenticatedUser, redirectClientAfterLogin } from '$lib/server/auth/routing';
import { getAdminPassword, setAdminSession } from '$lib/server/auth/session';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals, url }) => {
	await redirectAuthenticatedUser(locals, url.pathname);
	return {};
};

export const actions: Actions = {
	adminLogin: async ({ request, cookies, url, locals }) => {
		authDebug('home-admin-login-start', {
			path: url.pathname,
			userAgent: request.headers.get('user-agent') ?? null
		});

		redirectAdminAfterLogin(locals);

		const data = await request.formData();
		const password = String(data.get('password') ?? '').trim();
		const passwordPresent = password.length > 0;

		if (password !== getAdminPassword()) {
			authDebug('home-admin-login-failed', { passwordPresent });
			return fail(400, { adminError: 'Incorrect password.' });
		}

		authDebug('home-admin-login-success', {
			loginDuration: String(data.get('loginDuration') ?? '')
		});

		await setAdminSession(cookies, url, loginDurationFromForm(data), request);
		redirect(303, '/admin');
	},

	portalLogin: async ({ request, locals, cookies, url }) => {
		authDebug('home-portal-login-action-start', {
			path: url.pathname,
			hasExistingClientSession: Boolean(locals.client)
		});

		if (locals.client) {
			await redirectClientAfterLogin(locals);
		}

		const data = await request.formData();
		const result = await clientPortalLoginFromForm(locals.db, cookies, url, data, request);
		if (result) {
			const portalError =
				typeof result.data?.error === 'string' ? result.data.error : 'Invalid email or PIN.';
			authDebug('home-portal-login-action-failed', {
				status: result.status,
				error: portalError,
				email: maskEmail(String(data.get('email') ?? ''))
			});
			return fail(result.status, {
				portalError,
				...(result.data?.authDebug && typeof result.data.authDebug === 'object'
					? { authDebug: result.data.authDebug }
					: {})
			});
		}
	}
};
