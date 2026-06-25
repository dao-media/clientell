import { redirectAuthenticatedUser, redirectClientAfterLogin } from '$lib/server/auth/routing';
import { clientPortalLoginFromForm } from '$lib/server/auth/portal-login';
import { authDebug } from '$lib/debug/auth-debug';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async () => ({});

export const actions: Actions = {
	default: async ({ request, locals, cookies, url }) => {
		authDebug('portal-login-action-start', {
			path: url.pathname,
			hasExistingClientSession: Boolean(locals.client),
			userAgent: request.headers.get('user-agent') ?? null
		});

		if (locals.client) {
			await redirectClientAfterLogin(locals);
		}

		return (
			(await clientPortalLoginFromForm(
				locals.db,
				cookies,
				url,
				await request.formData(),
				request
			)) ?? undefined
		);
	}
};
