import { error } from '@sveltejs/kit';
import { renderAndStoreContractPdf, getContractDetail } from '$lib/server/contract/store';
import { readStoredFile } from '$lib/server/uploads';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ locals, params, platform }) => {
	const result = await renderAndStoreContractPdf(locals.db, platform, params.id);
	if (!result) error(404, 'Contract not found');
	if (!result.ok) {
		error(400, `Cannot export until these fields are filled: ${result.missing.join(', ')}`);
	}

	const detail = await getContractDetail(locals.db, params.id);
	const filename = `${(detail?.client.company ?? 'contract').replace(/\s+/g, '-').toLowerCase()}-contract.pdf`;

	try {
		const stored = await readStoredFile(platform, result.key);
		return new Response(stored.body, {
			headers: {
				'Content-Type': 'application/pdf',
				'Content-Disposition': `attachment; filename="${filename}"`
			}
		});
	} catch {
		return new Response(new Blob([result.pdf as BlobPart], { type: 'application/pdf' }), {
			headers: {
				'Content-Type': 'application/pdf',
				'Content-Disposition': `attachment; filename="${filename}"`
			}
		});
	}
};
