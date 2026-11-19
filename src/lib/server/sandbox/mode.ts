import { env } from '$env/dynamic/private';

/** Portfolio sandbox: per-visitor demo data, no outbound communications. */
export function isSandboxMode(platformEnv?: Partial<Env> | null): boolean {
	const raw =
		(platformEnv as Record<string, unknown> | undefined)?.SANDBOX_MODE ?? env.SANDBOX_MODE ?? '';
	return ['1', 'true', 'yes'].includes(String(raw).trim().toLowerCase());
}

export { SANDBOX_COMMS_TOOLTIP } from '$lib/sandbox';

/** Demo client the sandbox portal signs in as. */
export const SANDBOX_CLIENT_EMAIL = 'avery@figma.example';
export const SANDBOX_CLIENT_PIN = '246810';
