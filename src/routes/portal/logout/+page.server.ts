import { redirect } from '@sveltejs/kit';
import { CLIENT_COOKIE } from '$lib/server/auth/session';
import type { Actions } from './$types';

export const actions: Actions = {
	default: async ({ cookies }) => {
		cookies.delete(CLIENT_COOKIE, { path: '/' });
		redirect(303, '/portal');
	}
};
