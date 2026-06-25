import type { RequestEvent } from '@sveltejs/kit';
import { asc } from 'drizzle-orm';
import type { SubmissionsView } from '$lib/admin/submission-filters';
import { normalizeClientServiceIds } from '$lib/categories';
import { ensureBriefWorkspace } from '$lib/server/brief-workspace';
import { clients } from '$lib/server/db/schema';
import { listClientsForFilter, listSubmissions, type SubmissionStatusFilter } from '$lib/server/submissions';

export type BriefClientOption = {
	id: string;
	company: string;
	contactName: string;
	email: string;
	services: string[];
};

export type { SubmissionsView };

export function statusForView(view: SubmissionsView): SubmissionStatusFilter {
	if (view === 'unfinished') return 'pending';
	if (view === 'completed') return 'submitted';
	return 'all';
}

export async function loadSubmissionsPage(event: RequestEvent, view: SubmissionsView) {
	const url = event.url;
	const search = url.searchParams.get('q') ?? '';
	const clientId = url.searchParams.get('client') ?? '';
	const dateFrom = url.searchParams.get('from') ?? '';
	const dateTo = url.searchParams.get('to') ?? '';

	const [submissions, filterClients, briefSetup] = await Promise.all([
		listSubmissions(event.locals.db, {
			status: statusForView(view),
			clientId: clientId || undefined,
			search: search || undefined,
			dateFrom: dateFrom || undefined,
			dateTo: dateTo || undefined
		}),
		listClientsForFilter(event.locals.db),
		loadBriefPickerData(event)
	]);

	return {
		view,
		submissions,
		clients: filterClients,
		briefClients: briefSetup.briefClients,
		serviceOptions: briefSetup.serviceOptions,
		filters: {
			search,
			clientId,
			dateFrom,
			dateTo
		}
	};
}

async function loadBriefPickerData(event: RequestEvent) {
	const workspace = await ensureBriefWorkspace(event.locals.db);
	const clientRows = await event.locals.db
		.select()
		.from(clients)
		.orderBy(asc(clients.company));

	return {
		briefClients: clientRows.map((client) => ({
			id: client.id,
			company: client.company,
			contactName: client.contactName,
			email: client.email,
			services: normalizeClientServiceIds(client.services ?? [], workspace.categories)
		})) satisfies BriefClientOption[],
		serviceOptions: workspace.categories
	};
}
