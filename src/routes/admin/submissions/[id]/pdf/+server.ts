import { error } from '@sveltejs/kit';
import { buildBriefPdf } from '$lib/server/pdf/brief-export';
import { submissionToPdfSection } from '$lib/server/pdf/submission-section';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ locals, params }) => {
	const section = await submissionToPdfSection(locals.db, params.id);
	if (!section) error(404, 'Submission not found');

	const pdf = await buildBriefPdf([section]);
	const filename = `${section.company.replace(/\s+/g, '-').toLowerCase()}-brief.pdf`;

	return new Response(new Blob([pdf as BlobPart], { type: 'application/pdf' }), {
		headers: {
			'Content-Type': 'application/pdf',
			'Content-Disposition': `attachment; filename="${filename}"`
		}
	});
};
