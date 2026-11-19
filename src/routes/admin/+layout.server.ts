import { redirect } from '@sveltejs/kit';
import { redirectAuthenticatedUser } from '$lib/server/auth/routing';
import { ensureClausesSeeded } from '$lib/server/contract/ensure-clauses';
import { getDesignerIdentity } from '$lib/server/admin-profile';
import type { LayoutServerLoad } from './$types';
import { base } from '$app/paths';

export const load: LayoutServerLoad = async ({ locals, url, setHeaders }) => {
	setHeaders({
		'cache-control': 'private, no-cache, no-store, must-revalidate'
	});

	await redirectAuthenticatedUser(locals, url.pathname);

	if (!locals.admin) {
		redirect(303, `${base}/`);
	}

	await ensureClausesSeeded(locals.db);

	return { designer: await getDesignerIdentity(locals.db) };
};
