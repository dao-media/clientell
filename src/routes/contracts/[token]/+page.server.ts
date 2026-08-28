import { error, fail } from '@sveltejs/kit';
import {
	assembleFromContract,
	getContractByDownloadToken,
	renderAndStoreContractPdf,
	saveContractSignature,
	signaturesFrom
} from '$lib/server/contract/store';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals, params }) => {
	const row = await getContractByDownloadToken(locals.db, params.token);
	if (!row || row.contract.status === 'draft') error(404, 'Contract not found');

	const assembled = await assembleFromContract(locals.db, row.contract.id);
	if (!assembled) error(404, 'Contract not found');

	return {
		token: params.token,
		contract: row.contract,
		client: row.client,
		assembly: assembled.assembly,
		signatures: signaturesFrom(row.contract)
	};
};

export const actions: Actions = {
	sign: async ({ request, locals, params, platform }) => {
		const row = await getContractByDownloadToken(locals.db, params.token);
		if (!row || row.contract.status === 'draft') return fail(404, { error: 'Contract not found.' });
		if (row.contract.clientSignature) {
			return fail(400, { error: 'This contract is already signed by the client.' });
		}

		const data = await request.formData();
		const png = String(data.get('signature') ?? '').trim();
		if (!png.startsWith('data:image/png')) {
			return fail(400, { error: 'Sign in the Client box, then save.' });
		}

		await saveContractSignature(locals.db, row.contract.id, 'client', png);
		await renderAndStoreContractPdf(locals.db, platform, row.contract.id);
		return { signed: true };
	}
};
