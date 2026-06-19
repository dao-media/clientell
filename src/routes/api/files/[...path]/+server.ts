import { error } from '@sveltejs/kit';
import { canAccessUploadKey, readStoredFile } from '$lib/server/uploads';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ locals, params, platform }) => {
	const key = params.path.split('/').map(decodeURIComponent).join('/');

	if (!canAccessUploadKey(locals, key)) {
		error(403, 'Forbidden');
	}

	const object = await readStoredFile(platform, key);
	const contentType = object.httpMetadata?.contentType ?? 'application/octet-stream';

	return new Response(object.body, {
		headers: {
			'Content-Type': contentType,
			'Cache-Control': 'private, max-age=3600'
		}
	});
};
