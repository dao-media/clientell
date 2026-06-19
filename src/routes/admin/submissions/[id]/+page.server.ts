import { error, fail } from '@sveltejs/kit';
import { eq } from 'drizzle-orm';
import { generatePin, hashPin } from '$lib/server/auth/pin';
import { getPortalUrl } from '$lib/server/config';
import { sendBriefReminder, sendPortalLinkEmail } from '$lib/server/email/reminder';
import { getSubmissionDetail } from '$lib/server/submissions';
import { assignments, responses } from '$lib/server/db/schema';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals, params }) => {
	const detail = await getSubmissionDetail(locals.db, params.id);
	if (!detail) error(404, 'Submission not found');

	return {
		assignment: detail.assignment,
		client: detail.client,
		questionSet: detail.questionSet,
		response: detail.response,
		questions: detail.questions,
		briefCategories: detail.briefCategories,
		setCategories: detail.setCategories,
		progress: detail.progress,
		portalUrl: getPortalUrl()
	};
};

export const actions: Actions = {
	sendReminder: async ({ locals, params, platform }) => {
		const detail = await getSubmissionDetail(locals.db, params.id);
		if (!detail) return fail(404, { error: 'Submission not found.' });

		const result = await sendBriefReminder(platform, {
			to: detail.client.email,
			contactName: detail.client.contactName,
			briefTitle: detail.questionSet.title,
			progress: detail.progress
		});

		return { emailResult: result, action: 'reminder' as const };
	},

	sendPortalLink: async ({ locals, params, platform }) => {
		const detail = await getSubmissionDetail(locals.db, params.id);
		if (!detail) return fail(404, { error: 'Submission not found.' });

		const result = await sendPortalLinkEmail(platform, {
			to: detail.client.email,
			contactName: detail.client.contactName,
			briefTitle: detail.questionSet.title
		});

		return { emailResult: result, action: 'portal' as const };
	},

	rotatePin: async ({ locals, params }) => {
		const pin = generatePin();
		const { hash, salt } = await hashPin(pin);

		await locals.db
			.update(assignments)
			.set({ pinHash: hash, pinSalt: salt })
			.where(eq(assignments.id, params.id));

		return { rotatedPin: pin };
	},

	toggleActive: async ({ locals, params }) => {
		const detail = await getSubmissionDetail(locals.db, params.id);
		if (!detail) return fail(404, { error: 'Submission not found.' });

		await locals.db
			.update(assignments)
			.set({ isActive: !detail.assignment.isActive })
			.where(eq(assignments.id, params.id));

		return { success: true };
	},

	reopen: async ({ locals, params }) => {
		await locals.db
			.update(responses)
			.set({ status: 'draft', submittedAt: null, updatedAt: new Date() })
			.where(eq(responses.assignmentId, params.id));

		return { success: true };
	}
};
