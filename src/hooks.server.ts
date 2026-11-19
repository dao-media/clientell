import type { Handle, HandleServerError } from '@sveltejs/kit';
import { dev } from '$app/environment';
import { eq } from 'drizzle-orm';
import { getDb } from '$lib/server/db';
import { assignments, clients } from '$lib/server/db/schema';
import { isSandboxMode } from '$lib/server/sandbox/mode';
import { sandboxDatabase } from '$lib/server/sandbox/session';
import {
	ADMIN_COOKIE,
	CLIENT_COOKIE,
	parseSessionToken,
	type AdminSession,
	type ClientSession
} from '$lib/server/auth/session';
import { deleteCookieEverywhere } from '$lib/paths';

function isSchemaError(message: string): boolean {
	return (
		message.includes('not valid JSON') ||
		message.includes('no such column') ||
		message.includes('no such table')
	);
}

export const handle: Handle = async ({ event, resolve }) => {
	if (isSandboxMode(event.platform?.env)) {
		event.locals.sandbox = true;
		event.locals.db = getDb(await sandboxDatabase(event));
		await attachSessions(event);
		return resolve(event);
	}

	const dbBinding = event.platform?.env?.DB;
	if (!dbBinding) {
		const message =
			'Local D1 is unavailable. Run the app with Node 22+ via `npm run dev` from the project root.';
		if (dev) {
			return new Response(message, {
				status: 503,
				headers: { 'content-type': 'text/plain; charset=utf-8' }
			});
		}
		throw new Error(message);
	}

	event.locals.db = getDb(dbBinding);
	await attachSessions(event);
	return resolve(event);
};

async function attachSessions(event: Parameters<Handle>[0]['event']) {
	const adminToken = event.cookies.get(ADMIN_COOKIE);
	if (adminToken) {
		const session = await parseSessionToken(adminToken);
		if (session?.type === 'admin') {
			event.locals.admin = session as AdminSession;
		}
	}

	const clientToken = event.cookies.get(CLIENT_COOKIE);
	if (clientToken) {
		const session = await parseSessionToken(clientToken);
		if (session?.type === 'client') {
			// Signed-in clients are bounced the moment an admin locks the account.
			const [row] = await event.locals.db
				.select({ isLocked: clients.isLocked })
				.from(assignments)
				.innerJoin(clients, eq(assignments.clientId, clients.id))
				.where(eq(assignments.id, (session as ClientSession).assignmentId))
				.limit(1);
			if (row && !row.isLocked) {
				event.locals.client = session as ClientSession;
			} else {
				deleteCookieEverywhere(event.cookies, CLIENT_COOKIE);
			}
		}
	}
}

export const handleError: HandleServerError = ({ error }) => {
	const message = error instanceof Error ? error.message : String(error);

	if (isSchemaError(message)) {
		return {
			message: dev
				? 'Database schema is out of date. Stop the dev server and run: npm run db:migrate:local'
				: 'Something went wrong loading data.',
			code: 'SCHEMA_MISMATCH'
		};
	}

	if (dev) {
		console.error(error);
	}

	return {
		message: dev ? message : 'Something went wrong.',
		code: 'UNEXPECTED'
	};
};
