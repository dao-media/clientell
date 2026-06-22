import { error } from '@sveltejs/kit';
import { loadBriefPreviewForAssignment } from '$lib/server/brief-preview';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals, params }) => {
	const preview = await loadBriefPreviewForAssignment(locals.db, params.id);
	if (!preview) error(404, 'Submission not found');

	return {
		...preview,
		backHref: `/admin/submissions/${params.id}`
	};
};
