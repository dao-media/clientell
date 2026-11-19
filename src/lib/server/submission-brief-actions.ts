import { fail, redirect } from '@sveltejs/kit';
import { createBriefAssignment } from '$lib/server/brief-create';
import type { Actions } from '@sveltejs/kit';
import { base } from '$app/paths';

export const submissionBriefActions = {
	createBrief: async ({ request, locals, platform }) => {
		const result = await createBriefAssignment(locals.db, await request.formData(), platform);

		if (!result.ok) {
			return fail(result.status, { briefError: result.error });
		}

		throw redirect(303, `${base}/admin/submissions/${result.assignmentId}`);
	}
} satisfies Actions;
