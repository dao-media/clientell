import { env } from '$env/dynamic/private';

const DEV_SECRET = 'dev-only-change-me-in-production';

export function getSessionSecret(): string {
	return env.SESSION_SECRET ?? DEV_SECRET;
}

export function getAdminPassword(): string {
	return env.ADMIN_PASSWORD ?? 'briefly';
}

export const ADMIN_COOKIE = 'briefly_admin';
export const CLIENT_COOKIE = 'briefly_client';

export type AdminSession = {
	type: 'admin';
	exp: number;
};

export type ClientSession = {
	type: 'client';
	assignmentId: string;
	exp: number;
};

export type SessionPayload = AdminSession | ClientSession;

function encodeBase64Url(data: Uint8Array): string {
	return btoa(String.fromCharCode(...data))
		.replace(/\+/g, '-')
		.replace(/\//g, '_')
		.replace(/=+$/, '');
}

function decodeBase64Url(value: string): Uint8Array {
	const padded = value.replace(/-/g, '+').replace(/_/g, '/');
	const binary = atob(padded.padEnd(padded.length + ((4 - (padded.length % 4)) % 4), '='));
	return Uint8Array.from(binary, (char) => char.charCodeAt(0));
}

async function sign(data: string): Promise<string> {
	const key = await crypto.subtle.importKey(
		'raw',
		new TextEncoder().encode(getSessionSecret()),
		{ name: 'HMAC', hash: 'SHA-256' },
		false,
		['sign']
	);
	const signature = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(data));
	return encodeBase64Url(new Uint8Array(signature));
}

export async function createSessionToken(payload: SessionPayload): Promise<string> {
	const body = encodeBase64Url(new TextEncoder().encode(JSON.stringify(payload)));
	const signature = await sign(body);
	return `${body}.${signature}`;
}

export async function parseSessionToken(token: string): Promise<SessionPayload | null> {
	const [body, signature] = token.split('.');
	if (!body || !signature) return null;

	const expected = await sign(body);
	if (signature.length !== expected.length) return null;

	let valid = true;
	for (let i = 0; i < signature.length; i += 1) {
		if (signature.charCodeAt(i) !== expected.charCodeAt(i)) valid = false;
	}
	if (!valid) return null;

	try {
		const json = new TextDecoder().decode(decodeBase64Url(body));
		const payload = JSON.parse(json) as SessionPayload;
		if (payload.exp < Date.now()) return null;
		return payload;
	} catch {
		return null;
	}
}

export function sessionCookieOptions(maxAgeSeconds: number, secure: boolean) {
	return {
		path: '/',
		httpOnly: true,
		sameSite: 'lax' as const,
		secure,
		maxAge: maxAgeSeconds
	};
}

export const ADMIN_SESSION_SECONDS = 60 * 60 * 24 * 7;
export const CLIENT_SESSION_SECONDS = 60 * 60 * 24 * 30;
