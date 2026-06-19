import { buildBriefPdf } from '$lib/server/pdf/brief-export';
import { submissionToPdfSection } from '$lib/server/pdf/submission-section';
import { listSubmissions, type SubmissionStatusFilter } from '$lib/server/submissions';
import type { RequestHandler } from './$types';

function viewToStatus(view: string | null): SubmissionStatusFilter {
	if (view === 'unfinished') return 'draft';
	if (view === 'completed') return 'submitted';
	return 'all';
}

export const GET: RequestHandler = async ({ locals, url }) => {
	const search = url.searchParams.get('q') ?? '';
	const clientId = url.searchParams.get('client') ?? '';
	const dateFrom = url.searchParams.get('from') ?? '';
	const dateTo = url.searchParams.get('to') ?? '';
	const view = url.searchParams.get('view');

	const submissions = await listSubmissions(locals.db, {
		status: viewToStatus(view),
		clientId: clientId || undefined,
		search: search || undefined,
		dateFrom: dateFrom || undefined,
		dateTo: dateTo || undefined
	});

	const sections = (
		await Promise.all(submissions.map((submission) => submissionToPdfSection(locals.db, submission.id)))
	).filter((section): section is NonNullable<typeof section> => section !== null);

	if (sections.length === 0) {
		return new Response('No submissions match the current filters.', { status: 404 });
	}

	const pdf = await buildBriefPdf(sections);

	return new Response(new Blob([pdf as BlobPart], { type: 'application/pdf' }), {
		headers: {
			'Content-Type': 'application/pdf',
			'Content-Disposition': 'attachment; filename="briefly-submissions.pdf"'
		}
	});
};
