import { error, json } from '@sveltejs/kit';
import { getUploadScope, storeUploadedFile } from '$lib/server/uploads';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ request, locals, platform }) => {
	if (locals.sandbox) {
		// Visitors can't host arbitrary files on the portfolio demo.
		error(403, 'File uploads are turned off in the sandbox. Link fields still work.');
	}
	const scope = getUploadScope(locals);
	const data = await request.formData();
	const file = data.get('file');

	if (!(file instanceof File) || file.size === 0) {
		error(400, 'A file is required.');
	}

	const stored = await storeUploadedFile(platform, scope, file);

	return json({
		id: crypto.randomUUID(),
		kind: 'file' as const,
		url: stored.url,
		name: stored.name,
		mimeType: stored.mimeType,
		size: stored.size
	});
};
