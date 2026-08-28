import { asc } from 'drizzle-orm';
import { parseContractListView } from '$lib/admin/contract-filters';
import { registerPageDataDepends } from '$lib/admin/refresh-data';
import { listContracts, type ContractFilters } from '$lib/server/contract/store';
import { clients } from '$lib/server/db/schema';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals, url, depends }) => {
	registerPageDataDepends(depends, url.pathname, 'briefly:contracts');

	const status = parseContractListView(url.searchParams.get('status'));

	const filters: ContractFilters = {
		status,
		search: url.searchParams.get('q') ?? '',
		clientId: url.searchParams.get('client') ?? '',
		dateFrom: url.searchParams.get('from') ?? '',
		dateTo: url.searchParams.get('to') ?? ''
	};

	const [rows, clientRows] = await Promise.all([
		listContracts(locals.db, filters),
		locals.db.select({ id: clients.id, company: clients.company }).from(clients).orderBy(asc(clients.company))
	]);

	return {
		contracts: rows,
		clients: clientRows,
		filters: {
			status,
			search: filters.search ?? '',
			clientId: filters.clientId ?? '',
			dateFrom: filters.dateFrom ?? '',
			dateTo: filters.dateTo ?? ''
		}
	};
};
