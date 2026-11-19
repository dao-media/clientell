import { redirect } from '@sveltejs/kit';
import { CLIENT_COOKIE } from '$lib/server/auth/session';
import type { Actions } from './$types';
import { base } from '$app/paths';
import { deleteCookieEverywhere } from '$lib/paths';

export const actions: Actions = {
	default: async ({ cookies }) => {
		deleteCookieEverywhere(cookies, CLIENT_COOKIE);
		redirect(303, `${base}/portal`);
	}
};
