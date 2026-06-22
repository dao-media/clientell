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

export function getAdminNotificationEmail(): string {
	return (env.ADMIN_NOTIFICATION_EMAIL ?? env.EMAIL_FROM ?? 'briefly@daneoleary.com').trim();
}

export function adminSubmissionUrl(assignmentId: string): string {
	return `${getPublicOrigin()}/admin/submissions/${assignmentId}`;
}
