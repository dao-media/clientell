import { error, redirect } from '@sveltejs/kit';
import type { AdminSession, ClientSession } from './session';
import { base } from '$app/paths';

export function requireAdmin(locals: App.Locals): AdminSession {
	if (!locals.admin) {
		redirect(303, `${base}/`);
	}
	return locals.admin;
}

export function requireClient(locals: App.Locals): ClientSession {
	if (!locals.client) {
		redirect(303, `${base}/portal`);
	}
	return locals.client;
}

export function assertAdminApi(locals: App.Locals): AdminSession {
	if (!locals.admin) {
		error(401, 'Unauthorized');
	}
	return locals.admin;
}

export function assertClientApi(locals: App.Locals): ClientSession {
	if (!locals.client) {
		error(401, 'Unauthorized');
	}
	return locals.client;
}
