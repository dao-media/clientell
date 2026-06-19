import type { Handle, HandleServerError } from '@sveltejs/kit';
import { dev } from '$app/environment';
import { getDb } from '$lib/server/db';
import {
	ADMIN_COOKIE,
	CLIENT_COOKIE,
	parseSessionToken,
	type AdminSession,
	type ClientSession
} from '$lib/server/auth/session';

function isSchemaError(message: string): boolean {
	return (
		message.includes('not valid JSON') ||
		message.includes('no such column') ||
		message.includes('no such table')
	);
}

export const handle: Handle = async ({ event, resolve }) => {
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
			event.locals.client = session as ClientSession;
		}
	}

	return resolve(event);
};

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
