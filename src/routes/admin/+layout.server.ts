import { redirect } from '@sveltejs/kit';
import { redirectAuthenticatedUser } from '$lib/server/auth/routing';
import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = async ({ locals, url }) => {
	await redirectAuthenticatedUser(locals, url.pathname);

	if (!locals.admin) {
		redirect(303, '/');
	}

	return {};
};
