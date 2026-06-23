import type { RequestEvent } from '@sveltejs/kit';
import type { SubmissionsView } from '$lib/admin/submission-filters';
import { listClientsForFilter, listSubmissions, type SubmissionStatusFilter } from '$lib/server/submissions';

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

	const [submissions, clients] = await Promise.all([
		listSubmissions(event.locals.db, {
			status: statusForView(view),
			clientId: clientId || undefined,
			search: search || undefined,
			dateFrom: dateFrom || undefined,
			dateTo: dateTo || undefined
		}),
		listClientsForFilter(event.locals.db)
	]);

	return {
		view,
		submissions,
		clients,
		filters: {
			search,
			clientId,
			dateFrom,
			dateTo
		}
	};
}
