import { redirect } from '@sveltejs/kit';
import { ADMIN_COOKIE } from '$lib/server/auth/session';
import type { Actions } from './$types';

export const actions: Actions = {
	default: async ({ cookies }) => {
		cookies.delete(ADMIN_COOKIE, { path: '/' });
		redirect(303, '/');
	}
};
