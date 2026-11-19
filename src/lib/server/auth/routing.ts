import { redirect } from '@sveltejs/kit';
import { redirectClientIfPinChangeRequired } from '$lib/server/auth/portal-login';
import { base } from '$app/paths';
import { appPath } from '$lib/paths';

const ADMIN_LOGIN_PATHS = new Set(['/']);
const CLIENT_LOGIN_PATHS = new Set(['/', '/portal']);

export async function redirectAuthenticatedUser(
	locals: App.Locals,
	pathname: string
): Promise<void> {
	if (locals.admin) {
		if (ADMIN_LOGIN_PATHS.has(appPath(pathname))) {
			redirect(303, `${base}/admin`);
		}
		return;
	}

	if (locals.client && CLIENT_LOGIN_PATHS.has(appPath(pathname))) {
		await redirectClientIfPinChangeRequired(locals.db, locals.client.assignmentId);
		redirect(303, `${base}/portal/docs`);
	}
}

export function redirectAdminAfterLogin(locals: App.Locals): void {
	if (locals.admin) {
		redirect(303, `${base}/admin`);
	}
}

export async function redirectClientAfterLogin(locals: App.Locals): Promise<void> {
	if (!locals.client) return;
	await redirectClientIfPinChangeRequired(locals.db, locals.client.assignmentId);
	redirect(303, `${base}/portal/docs`);
}
