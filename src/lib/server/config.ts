import { dev } from '$app/environment';
import { env } from '$env/dynamic/private';

/** Production hostname for ClienTell */
export const PRODUCTION_ORIGIN = 'https://briefly.daneoleary.com';

const LOCAL_ORIGIN = 'https://localhost:5173';

function isLocalHostOrigin(origin: string): boolean {
	try {
		const host = new URL(origin).hostname;
		return host === 'localhost' || host === '127.0.0.1';
	} catch {
		return false;
	}
}

function isCloudflarePages(platform?: App.Platform): boolean {
	return (
		(platform?.env as { CF_PAGES?: string } | undefined)?.CF_PAGES === '1' || env.CF_PAGES === '1'
	);
}

export function getPublicOrigin(platform?: App.Platform): string {
	const configured =
		(platform?.env as { PUBLIC_ORIGIN?: string } | undefined)?.PUBLIC_ORIGIN ?? env.PUBLIC_ORIGIN;

	if (configured) {
		const origin = configured.replace(/\/$/, '');
		if (isCloudflarePages(platform) && isLocalHostOrigin(origin)) {
			return PRODUCTION_ORIGIN;
		}
		return origin;
	}

	if (isCloudflarePages(platform)) {
		return PRODUCTION_ORIGIN;
	}

	return dev ? LOCAL_ORIGIN : PRODUCTION_ORIGIN;
}

export function getPortalUrl(platform?: App.Platform): string {
	return `${getPublicOrigin(platform)}/portal`;
}

export function getAdminNotificationEmail(): string {
	return (env.ADMIN_NOTIFICATION_EMAIL ?? env.EMAIL_FROM ?? 'briefly@daneoleary.com').trim();
}

export function adminSubmissionUrl(assignmentId: string, platform?: App.Platform): string {
	return `${getPublicOrigin(platform)}/admin/submissions/${assignmentId}`;
}

export function contractDownloadUrl(token: string, platform?: App.Platform): string {
	return `${getPublicOrigin(platform)}/api/contracts/download/${token}`;
}

export function contractViewUrl(token: string, platform?: App.Platform): string {
	return `${getPublicOrigin(platform)}/contracts/${token}`;
}
