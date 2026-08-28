import { error } from '@sveltejs/kit';
import { getContractByDownloadToken, renderAndStoreContractPdf } from '$lib/server/contract/store';
import { readStoredFile } from '$lib/server/uploads';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ locals, params, platform }) => {
	const row = await getContractByDownloadToken(locals.db, params.token);
	if (!row) error(404, 'Contract not found');
	if (row.contract.status === 'draft') error(404, 'Contract not found');

	const rendered = await renderAndStoreContractPdf(locals.db, platform, row.contract.id);
	if (!rendered?.ok) {
		error(404, 'Contract PDF is not available.');
	}

	const stored = await readStoredFile(platform, rendered.key).catch(() => null);
	if (stored) {
		return new Response(stored.body, {
			headers: {
				'Content-Type': 'application/pdf',
				'Content-Disposition': `inline; filename="contract.pdf"`
			}
		});
	}

	return new Response(new Blob([rendered.pdf as BlobPart], { type: 'application/pdf' }), {
		headers: {
			'Content-Type': 'application/pdf',
			'Content-Disposition': `inline; filename="contract.pdf"`
		}
	});
};
