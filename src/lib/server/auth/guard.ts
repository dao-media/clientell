import { error, redirect } from '@sveltejs/kit';
import type { AdminSession, ClientSession } from './session';

export function requireAdmin(locals: App.Locals): AdminSession {
	if (!locals.admin) {
		redirect(303, '/admin/login');
	}
	return locals.admin;
}

export function requireClient(locals: App.Locals): ClientSession {
	if (!locals.client) {
		redirect(303, '/portal');
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
