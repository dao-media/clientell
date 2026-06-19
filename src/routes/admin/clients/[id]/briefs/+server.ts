import { error, json } from '@sveltejs/kit';
import { listSubmissions } from '$lib/server/submissions';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ locals, params }) => {
	if (!locals.admin) error(401, 'Unauthorized');

	const briefs = await listSubmissions(locals.db, { clientId: params.id });

	return json(
		briefs.map((brief) => ({
			id: brief.id,
			categoriesLabel: brief.categoriesLabel,
			status: brief.status,
			progress: brief.progress,
			isActive: brief.isActive,
			createdAt: brief.createdAt.toISOString(),
			updatedAt: brief.updatedAt?.toISOString() ?? null,
			answerPreview: brief.answerPreview
		}))
	);
};
