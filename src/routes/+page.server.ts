import { fail, redirect } from '@sveltejs/kit';
import { and, eq } from 'drizzle-orm';
import { verifyPin } from '$lib/server/auth/pin';
import {
	ADMIN_COOKIE,
	ADMIN_SESSION_SECONDS,
	CLIENT_COOKIE,
	CLIENT_SESSION_SECONDS,
	createSessionToken,
	getAdminPassword,
	sessionCookieOptions
} from '$lib/server/auth/session';
import { assignments, clients } from '$lib/server/db/schema';
import { normalizeEmail } from '$lib/utils';
import type { Actions } from './$types';

export const actions: Actions = {
	adminLogin: async ({ request, cookies, url }) => {
		const data = await request.formData();
		const password = String(data.get('password') ?? '');

		if (password !== getAdminPassword()) {
			return fail(400, { adminError: 'Incorrect password.' });
		}

		const token = await createSessionToken({
			type: 'admin',
			exp: Date.now() + ADMIN_SESSION_SECONDS * 1000
		});

		cookies.set(ADMIN_COOKIE, token, sessionCookieOptions(ADMIN_SESSION_SECONDS, url.protocol === 'https:'));
		redirect(303, '/admin');
	},

	portalLogin: async ({ request, locals, cookies, url }) => {
		const data = await request.formData();
		const email = normalizeEmail(String(data.get('email') ?? ''));
		const pin = String(data.get('pin') ?? '').trim();

		if (!email || !/^\d{6}$/.test(pin)) {
			return fail(400, { portalError: 'Enter a valid email and 6-digit PIN.' });
		}

		const matches = await locals.db
			.select({
				assignment: assignments,
				client: clients
			})
			.from(assignments)
			.innerJoin(clients, eq(assignments.clientId, clients.id))
			.where(and(eq(clients.email, email), eq(assignments.isActive, true)));

		let matchedAssignmentId: string | null = null;

		for (const row of matches) {
			const valid = await verifyPin(pin, row.assignment.pinHash, row.assignment.pinSalt);
			if (valid) {
				matchedAssignmentId = row.assignment.id;
				break;
			}
		}

		if (!matchedAssignmentId) {
			return fail(400, { portalError: 'Invalid email or PIN.' });
		}

		const token = await createSessionToken({
			type: 'client',
			assignmentId: matchedAssignmentId,
			exp: Date.now() + CLIENT_SESSION_SECONDS * 1000
		});

		cookies.set(CLIENT_COOKIE, token, sessionCookieOptions(CLIENT_SESSION_SECONDS, url.protocol === 'https:'));
		redirect(303, '/portal/brief');
	}
};
