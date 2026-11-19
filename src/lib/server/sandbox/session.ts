import type { RequestEvent } from '@sveltejs/kit';
import { ADMIN_COOKIE, CLIENT_COOKIE, parseSessionToken } from '$lib/server/auth/session';
import { createSandboxD1, type SandboxDatabaseStub } from './d1-shim';
import { buildSandboxSeed, SANDBOX_SCHEMA_VERSION, sandboxMigrations } from './seed';
import { cookiePath, deleteCookieEverywhere } from '$lib/paths';

export const SANDBOX_COOKIE = 'clientell_sandbox';
const DEFAULT_TTL_MS = 24 * 60 * 60 * 1000;
const DAY_MS = 24 * 60 * 60 * 1000;

type Namespace = {
	idFromName(name: string): unknown;
	get(id: unknown): SandboxDatabaseStub;
};

function namespaceFrom(event: RequestEvent): Namespace {
	const ns = (event.platform?.env as unknown as Record<string, unknown> | undefined)?.SANDBOX_DB;
	if (!ns) {
		throw new Error(
			'SANDBOX_DB binding missing. Deploy/run sandbox-store and use wrangler.sandbox.jsonc (see SETUP.md).'
		);
	}
	return ns as Namespace;
}

/**
 * Resolve (or create) this visitor's private sandbox DB.
 *
 * Lifetime follows the "Keep me logged in" answer: a "Today" login keeps the sandbox only
 * for this browser session (session cookie, server copy expires after 24h idle). A longer
 * choice persists the cookie — and the server copy — for that long, so visitors can pick
 * up where they left off.
 */
export async function sandboxDatabase(event: RequestEvent): Promise<D1Database> {
	const { cookies, url } = event;
	let sid = cookies.get(SANDBOX_COOKIE);
	const isNew = !sid || !/^[0-9a-f-]{36}$/.test(sid);
	if (isNew) {
		sid = crypto.randomUUID();
		// Auth cookies from an expired sandbox point at rows that no longer exist.
		deleteCookieEverywhere(cookies, ADMIN_COOKIE);
		deleteCookieEverywhere(cookies, CLIENT_COOKIE);
	}

	let longestExp = 0;
	for (const name of [ADMIN_COOKIE, CLIENT_COOKIE]) {
		const token = isNew ? undefined : cookies.get(name);
		const session = token ? await parseSessionToken(token) : null;
		if (session) longestExp = Math.max(longestExp, session.exp);
	}
	const remainingMs = longestExp - Date.now();
	const persistent = remainingMs > DAY_MS;

	cookies.set(SANDBOX_COOKIE, sid!, {
		path: cookiePath(),
		httpOnly: true,
		sameSite: 'lax',
		secure: url.protocol === 'https:',
		...(persistent ? { maxAge: Math.floor(remainingMs / 1000) } : {})
	});

	const ns = namespaceFrom(event);
	const stub = ns.get(ns.idFromName(sid!));
	const { ready } = await stub.status(persistent ? remainingMs : DEFAULT_TTL_MS, SANDBOX_SCHEMA_VERSION);
	if (!ready) {
		await stub.initialize(SANDBOX_SCHEMA_VERSION, sandboxMigrations(), await buildSandboxSeed());
	}
	return createSandboxD1(stub);
}

export async function destroySandbox(event: RequestEvent) {
	const sid = event.cookies.get(SANDBOX_COOKIE);
	if (sid) {
		const ns = namespaceFrom(event);
		await ns.get(ns.idFromName(sid)).destroy();
	}
	for (const name of [SANDBOX_COOKIE, ADMIN_COOKIE, CLIENT_COOKIE]) {
		deleteCookieEverywhere(event.cookies, name);
	}
}
