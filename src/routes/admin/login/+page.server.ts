import { fail, redirect } from '@sveltejs/kit';
import {
	ADMIN_COOKIE,
	ADMIN_SESSION_SECONDS,
	createSessionToken,
	getAdminPassword,
	sessionCookieOptions
} from '$lib/server/auth/session';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
	if (locals.admin) redirect(303, '/admin');
};

export const actions: Actions = {
	default: async ({ request, cookies, url }) => {
		const data = await request.formData();
		const password = String(data.get('password') ?? '');

		if (password !== getAdminPassword()) {
			return fail(400, { error: 'Incorrect password.' });
		}

		const token = await createSessionToken({
			type: 'admin',
			exp: Date.now() + ADMIN_SESSION_SECONDS * 1000
		});

		cookies.set(ADMIN_COOKIE, token, sessionCookieOptions(ADMIN_SESSION_SECONDS, url.protocol === 'https:'));
		redirect(303, '/admin');
	}
};
