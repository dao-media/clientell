import { fail, redirect } from '@sveltejs/kit';
import { asc } from 'drizzle-orm';
import { insertContract, loadActiveClauses, parseContractForm } from '$lib/server/contract/store';
import { clients } from '$lib/server/db/schema';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals, url }) => {
	const [clientRows, clauses] = await Promise.all([
		locals.db
			.select({
				id: clients.id,
				company: clients.company,
				contactName: clients.contactName,
				email: clients.email,
				phone: clients.phone,
				legalName: clients.legalName,
				entityType: clients.entityType,
				entityState: clients.entityState
			})
			.from(clients)
			.orderBy(asc(clients.company)),
		loadActiveClauses(locals.db)
	]);

	return {
		clients: clientRows,
		clauses,
		preselectedClientId: url.searchParams.get('client') ?? ''
	};
};

export const actions: Actions = {
	default: async ({ request, locals }) => {
		const parsed = parseContractForm(await request.formData());
		if (!parsed.clientId) return fail(400, { error: 'Client is required.' });
		if (!parsed.projectName) return fail(400, { error: 'Project name is required.' });

		const row = await insertContract(locals.db, parsed);
		redirect(303, `/admin/contracts/${row.id}`);
	}
};
