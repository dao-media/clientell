import { error } from '@sveltejs/kit';
import { loadBriefPreviewForAssignment } from '$lib/server/brief-preview';
import type { PageServerLoad } from './$types';
import { withBase } from '$lib/paths';

export const load: PageServerLoad = async ({ locals, params }) => {
	const preview = await loadBriefPreviewForAssignment(locals.db, params.id);
	if (!preview) error(404, 'Submission not found');

	return {
		...preview,
		backHref: withBase(`/admin/submissions/${params.id}`)
	};
};
