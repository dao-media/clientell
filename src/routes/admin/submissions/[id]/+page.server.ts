import { error, fail } from '@sveltejs/kit';
import { eq } from 'drizzle-orm';
import { resetClientPortalPin } from '$lib/server/auth/reset-client-pin';
import { getPortalUrl } from '$lib/server/config';
import { sendBriefReminder, sendBriefReadyEmail, sendPortalLinkEmail } from '$lib/server/email/reminder';
import { getSubmissionDetail } from '$lib/server/submissions';
import { assignments, questionSets, responses } from '$lib/server/db/schema';
	import { formatCategoryList, mergeCategoryDefinitions, normalizeClientServiceIds } from '$lib/categories';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals, params, platform }) => {
	const detail = await getSubmissionDetail(locals.db, params.id);
	if (!detail) error(404, 'Submission not found');

	const setRows = await locals.db
		.select({ categories: questionSets.categories })
		.from(questionSets);
	const serviceOptions = mergeCategoryDefinitions(setRows.map((set) => set.categories));

	return {
		assignment: detail.assignment,
		client: {
			...detail.client,
			services: normalizeClientServiceIds(detail.client.services ?? [], serviceOptions)
		},
		questionSet: detail.questionSet,
		response: detail.response,
		questions: detail.questions,
		briefCategories: detail.briefCategories,
		setCategories: detail.setCategories,
		progress: detail.progress,
		portalUrl: getPortalUrl(platform),
		serviceOptions,
		canSendBrief: !detail.assignment.sentAt && Boolean(detail.assignment.invitationPin)
	};
};

export const actions: Actions = {
	sendBrief: async ({ locals, params, platform }) => {
		const detail = await getSubmissionDetail(locals.db, params.id);
		if (!detail) return fail(404, { error: 'Submission not found.' });

		if (detail.assignment.sentAt) {
			return fail(400, { error: 'This brief was already sent to the client.' });
		}

		const pin = detail.assignment.invitationPin;
		if (!pin) {
			return fail(400, {
				error: 'Reset the client PIN before sending this brief.'
			});
		}

		const categoriesLabel = formatCategoryList(detail.briefCategories, detail.setCategories);
		const result = await sendBriefReadyEmail(platform, {
			to: detail.client.email,
			contactName: detail.client.contactName,
			loginEmail: detail.client.email,
			pin,
			categoriesLabel: categoriesLabel === 'All categories' ? undefined : categoriesLabel
		});

		if (!result.ok) {
			return fail(500, { emailResult: result, action: 'brief' as const });
		}

		await locals.db
			.update(assignments)
			.set({ sentAt: new Date(), invitationPin: null })
			.where(eq(assignments.id, params.id));

		return { emailResult: result, action: 'brief' as const };
	},
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

	resetClientPin: async ({ locals, params }) => {
		const detail = await getSubmissionDetail(locals.db, params.id);
		if (!detail) return fail(404, { error: 'Submission not found.' });

		const pin = await resetClientPortalPin(locals.db, detail.client.id);
		if (!pin) {
			return fail(400, {
				resetPinError: 'This client has no active briefs to reset the PIN for.'
			});
		}

		return { resetPin: pin };
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
