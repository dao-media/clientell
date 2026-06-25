import { fail, redirect } from '@sveltejs/kit';
import { createBriefAssignment } from '$lib/server/brief-create';
import { saveClientFromForm } from '$lib/server/save-client-action';
import type { Actions } from '@sveltejs/kit';

export const submissionBriefActions = {
	createBrief: async ({ request, locals, platform }) => {
		const result = await createBriefAssignment(locals.db, await request.formData(), platform);

		if (!result.ok) {
			return fail(result.status, { briefError: result.error });
		}

		throw redirect(303, `/admin/submissions/${result.assignmentId}`);
	},

	saveClient: saveClientFromForm
} satisfies Actions;
