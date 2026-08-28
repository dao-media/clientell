import { error, fail, redirect } from '@sveltejs/kit';
import { eq } from 'drizzle-orm';
import { contractViewUrl } from '$lib/server/config';
import { sendContractReadyEmail } from '$lib/server/email/reminder';
import {
	assembleFromContract,
	ensureDownloadToken,
	getContractDetail,
	loadActiveClauses,
	parseContractForm,
	renderAndStoreContractPdf,
	saveContractSignature,
	updateContract
} from '$lib/server/contract/store';
import { contracts } from '$lib/server/db/schema';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals, params }) => {
	const detail = await getContractDetail(locals.db, params.id);
	if (!detail) error(404, 'Contract not found');

	const [assembled, clauses] = await Promise.all([
		assembleFromContract(locals.db, params.id),
		loadActiveClauses(locals.db)
	]);

	return {
		contract: detail.contract,
		client: detail.client,
		clauses,
		pricing: assembled?.pricing ?? null,
		assembly: assembled?.assembly ?? null
	};
};

export const actions: Actions = {
	save: async ({ request, locals, params }) => {
		const parsed = parseContractForm(await request.formData());
		if (!parsed.projectName) return fail(400, { error: 'Project name is required.' });
		await updateContract(locals.db, params.id, parsed);
		return { saved: true };
	},

	exportPdf: async ({ locals, params, platform }) => {
		const result = await renderAndStoreContractPdf(locals.db, platform, params.id);
		if (!result) return fail(404, { error: 'Contract not found.' });
		if (!result.ok) {
			return fail(400, {
				error: `Cannot export until these fields are filled: ${result.missing.join(', ')}`
			});
		}
		redirect(303, `/admin/contracts/${params.id}/pdf`);
	},

	send: async ({ locals, params, platform }) => {
		const result = await renderAndStoreContractPdf(locals.db, platform, params.id);
		if (!result) return fail(404, { error: 'Contract not found.' });
		if (!result.ok) {
			return fail(400, {
				error: `Cannot send until these fields are filled: ${result.missing.join(', ')}`
			});
		}

		const detail = await getContractDetail(locals.db, params.id);
		if (!detail) return fail(404, { error: 'Contract not found.' });

		const token = await ensureDownloadToken(locals.db, params.id);
		const emailResult = await sendContractReadyEmail(platform, {
			to: detail.client.email,
			contactName: detail.client.contactName,
			projectName: detail.contract.projectName,
			downloadUrl: contractViewUrl(token, platform)
		});

		if (!emailResult.ok) {
			return fail(500, { emailResult, error: emailResult.message });
		}

		await locals.db
			.update(contracts)
			.set({ status: 'sent', sentAt: new Date() })
			.where(eq(contracts.id, params.id));

		return { emailResult, sent: true };
	},

	reopen: async ({ locals, params }) => {
		await locals.db
			.update(contracts)
			.set({
				status: 'draft',
				sentAt: null,
				signedAt: null,
				clientSignature: null,
				designerSignature: null,
				clientSignedAt: null,
				designerSignedAt: null
			})
			.where(eq(contracts.id, params.id));
		return { reopened: true };
	},

	signDesigner: async ({ request, locals, params, platform }) => {
		const data = await request.formData();
		const png = String(data.get('signature') ?? '').trim();
		if (!png.startsWith('data:image/png')) {
			return fail(400, { error: 'Draw a signature before saving.' });
		}
		await saveContractSignature(locals.db, params.id, 'designer', png);
		await renderAndStoreContractPdf(locals.db, platform, params.id);
		return { signedDesigner: true };
	},

	markSigned: async ({ locals, params }) => {
		await locals.db
			.update(contracts)
			.set({ status: 'signed', signedAt: new Date() })
			.where(eq(contracts.id, params.id));
		return { signed: true };
	}
};
