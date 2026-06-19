import { redirect } from '@sveltejs/kit';
import { redirectClientIfPinChangeRequired } from '$lib/server/auth/portal-login';

const ADMIN_LOGIN_PATHS = new Set(['/']);
const CLIENT_LOGIN_PATHS = new Set(['/', '/portal']);

export async function redirectAuthenticatedUser(
	locals: App.Locals,
	pathname: string
): Promise<void> {
	if (locals.admin) {
		if (ADMIN_LOGIN_PATHS.has(pathname)) {
			redirect(303, '/admin');
		}
		return;
	}

	if (locals.client && CLIENT_LOGIN_PATHS.has(pathname)) {
		await redirectClientIfPinChangeRequired(locals.db, locals.client.assignmentId);
		redirect(303, '/portal/brief');
	}
}

export function redirectAdminAfterLogin(locals: App.Locals): void {
	if (locals.admin) {
		redirect(303, '/admin');
	}
}

export async function redirectClientAfterLogin(locals: App.Locals): Promise<void> {
	if (!locals.client) return;
	await redirectClientIfPinChangeRequired(locals.db, locals.client.assignmentId);
	redirect(303, '/portal/brief');
}
