import { error, json } from '@sveltejs/kit';
import { getSubmissionDetail } from '$lib/server/submissions';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ locals, params }) => {
	const detail = await getSubmissionDetail(locals.db, params.id);
	if (!detail) error(404, 'Submission not found');

	return json({
		assignment: {
			id: detail.assignment.id,
			isActive: detail.assignment.isActive,
			sentAt: detail.assignment.sentAt?.toISOString() ?? null,
			canSendBrief: !detail.assignment.sentAt && Boolean(detail.assignment.invitationPin),
			canResendBrief: Boolean(detail.assignment.sentAt),
			createdAt: detail.assignment.createdAt.toISOString()
		},
		client: {
			company: detail.client.company,
			contactName: detail.client.contactName,
			email: detail.client.email,
			phone: detail.client.phone
		},
		questionSet: {
			title: detail.questionSet.title,
			description: detail.questionSet.description
		},
		response: detail.response
			? {
					status: detail.response.status,
					answers: detail.response.answers,
					updatedAt: detail.response.updatedAt?.toISOString() ?? null,
					submittedAt: detail.response.submittedAt?.toISOString() ?? null
				}
			: null,
		questions: detail.questions.map((question) => ({
			id: question.id,
			label: question.label,
			helpText: question.helpText,
			allowAttachments: question.allowAttachments
		})),
		briefCategories: detail.briefCategories,
		setCategories: detail.setCategories,
		progress: detail.progress
	});
};
