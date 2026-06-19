import { redirectAuthenticatedUser } from '$lib/server/auth/routing';
import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = async ({ locals, url }) => {
	await redirectAuthenticatedUser(locals, url.pathname);

	return {
		auth: {
			admin: Boolean(locals.admin),
			client: Boolean(locals.client)
		}
	};
};
