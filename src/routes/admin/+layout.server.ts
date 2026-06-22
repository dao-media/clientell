import { redirect } from '@sveltejs/kit';
import { redirectAuthenticatedUser } from '$lib/server/auth/routing';
import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = async ({ locals, url, setHeaders }) => {
	setHeaders({
		'cache-control': 'private, no-cache, no-store, must-revalidate'
	});

	await redirectAuthenticatedUser(locals, url.pathname);

	if (!locals.admin) {
		redirect(303, '/');
	}

	return {};
};
