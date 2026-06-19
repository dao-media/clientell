import { error } from '@sveltejs/kit';
import { getPublicOrigin } from '$lib/server/config';

const MAX_UPLOAD_BYTES = 10 * 1024 * 1024;

type R2Bucket = {
	put: (
		key: string,
		value: ReadableStream | ArrayBuffer | ArrayBufferView | string | Blob,
		options?: { httpMetadata?: { contentType?: string } }
	) => Promise<unknown>;
	get: (key: string) => Promise<{ body: ReadableStream | null; httpMetadata?: { contentType?: string } } | null>;
	head: (key: string) => Promise<{ size?: number; httpMetadata?: { contentType?: string } } | null>;
};

export function getUploadsBucket(platform: App.Platform | undefined): R2Bucket {
	const bucket = (platform?.env as { UPLOADS?: R2Bucket } | undefined)?.UPLOADS;
	if (!bucket) {
		error(503, 'File uploads are not configured.');
	}
	return bucket;
}

export function sanitizeFilename(name: string): string {
	return name.replace(/[^a-zA-Z0-9._-]+/g, '-').replace(/-+/g, '-').slice(0, 120);
}

export function buildUploadKey(scope: string, filename: string): string {
	return `${scope}/${crypto.randomUUID()}-${sanitizeFilename(filename)}`;
}

export function buildPublicFileUrl(key: string): string {
	return `${getPublicOrigin()}/api/files/${key.split('/').map(encodeURIComponent).join('/')}`;
}

export async function storeUploadedFile(
	platform: App.Platform | undefined,
	scope: string,
	file: File
): Promise<{ key: string; url: string; name: string; mimeType: string; size: number }> {
	if (file.size > MAX_UPLOAD_BYTES) {
		error(413, 'File is too large. Maximum size is 10 MB.');
	}

	const bucket = getUploadsBucket(platform);
	const key = buildUploadKey(scope, file.name || 'upload.bin');

	await bucket.put(key, await file.arrayBuffer(), {
		httpMetadata: { contentType: file.type || 'application/octet-stream' }
	});

	return {
		key,
		url: buildPublicFileUrl(key),
		name: file.name || 'Uploaded file',
		mimeType: file.type || 'application/octet-stream',
		size: file.size
	};
}

export async function readStoredFile(platform: App.Platform | undefined, key: string) {
	const bucket = getUploadsBucket(platform);
	const object = await bucket.get(key);
	if (!object?.body) error(404, 'File not found.');
	return object;
}

export function getUploadScope(locals: App.Locals): string {
	if (locals.client) return `assignments/${locals.client.assignmentId}`;
	if (locals.admin) return 'admin';
	error(401, 'Unauthorized');
}

export function canAccessUploadKey(locals: App.Locals, key: string): boolean {
	if (locals.admin) return true;
	if (locals.client) {
		return key.startsWith(`assignments/${locals.client.assignmentId}/`);
	}
	return false;
}
