import { redirect } from '@sveltejs/kit';
import { ADMIN_COOKIE } from '$lib/server/auth/session';
import type { Actions } from './$types';
import { base } from '$app/paths';
import { deleteCookieEverywhere } from '$lib/paths';

export const actions: Actions = {
	default: async ({ cookies }) => {
		deleteCookieEverywhere(cookies, ADMIN_COOKIE);
		redirect(303, `${base}/`);
	}
};
