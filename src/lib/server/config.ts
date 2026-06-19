import { env } from '$env/dynamic/private';

/** Production hostname for Briefly */
export const PRODUCTION_ORIGIN = 'https://briefly.daneoleary.com';

export function getPublicOrigin(): string {
	const configured = env.PUBLIC_ORIGIN as string | undefined;
	if (configured) {
		return configured.replace(/\/$/, '');
	}

	return env.NODE_ENV === 'production' ? PRODUCTION_ORIGIN : 'https://localhost:5173';
}

export function getPortalUrl(): string {
	return `${getPublicOrigin()}/portal`;
}
