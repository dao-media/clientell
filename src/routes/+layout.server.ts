import { redirectAuthenticatedUser } from '$lib/server/auth/routing';
import { caseStudyUrl } from '$lib/server/sandbox/mode';
import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = async ({ locals, url, platform }) => {
	await redirectAuthenticatedUser(locals, url.pathname);

	return {
		auth: {
			admin: Boolean(locals.admin),
			client: Boolean(locals.client)
		},
		sandbox: Boolean(locals.sandbox),
		caseStudyUrl: locals.sandbox ? caseStudyUrl(platform?.env) : null
	};
};
