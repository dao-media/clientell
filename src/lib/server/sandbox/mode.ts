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

/** Portfolio case study the sandbox links back to (CASE_STUDY_URL). Only absolute http(s) URLs. */
export function caseStudyUrl(platformEnv?: Partial<Env> | null): string | null {
	const raw = String(
		(platformEnv as Record<string, unknown> | undefined)?.CASE_STUDY_URL || env.CASE_STUDY_URL || ''
	).trim();
	return /^https?:\/\/\S+$/i.test(raw) ? raw : null;
}
