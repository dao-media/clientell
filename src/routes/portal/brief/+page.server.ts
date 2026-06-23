import { error, fail, redirect } from '@sveltejs/kit';
import { and, eq } from 'drizzle-orm';
import { formatCategoryList, normalizeCategoryDefinitions, parseCategoryIds } from '$lib/categories';
import { redirectClientIfPinChangeRequired } from '$lib/server/auth/portal-login';
import { requireClient } from '$lib/server/auth/guard';
import { loadQuestionsForAssignment } from '$lib/server/questions';
import {
	assignments,
	clients,
	questionSets,
	responses
} from '$lib/server/db/schema';
import { validateAnswers, validatePartialAnswers } from '$lib/utils';
import { attachmentAnswerKey, parseAttachmentsField } from '$lib/attachments';
import { adminSubmissionUrl, getAdminNotificationEmail } from '$lib/server/config';
import { sendBriefSubmittedNotification } from '$lib/server/email/reminder';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
	const session = requireClient(locals);
	await redirectClientIfPinChangeRequired(locals.db, session.assignmentId);

	const [row] = await locals.db
		.select({
			assignment: assignments,
			client: clients,
			questionSet: questionSets,
			response: responses
		})
		.from(assignments)
		.innerJoin(clients, eq(assignments.clientId, clients.id))
		.innerJoin(questionSets, eq(assignments.questionSetId, questionSets.id))
		.innerJoin(responses, eq(responses.assignmentId, assignments.id))
		.where(and(eq(assignments.id, session.assignmentId), eq(assignments.isActive, true)))
		.limit(1);

	if (!row) {
		error(404, 'This assignment is unavailable.');
	}

	const briefCategories = parseCategoryIds(row.assignment.categories);
	const setCategories = normalizeCategoryDefinitions(row.questionSet.categories);
	const setQuestions = await loadQuestionsForAssignment(
		locals.db,
		row.questionSet.id,
		briefCategories,
		setCategories
	);

	const editable =
		row.response.status === 'draft' ||
		(row.response.status === 'submitted' && row.assignment.allowEditsAfterSubmit);

	return {
		assignment: row.assignment,
		client: row.client,
		questionSet: row.questionSet,
		response: row.response,
		questions: setQuestions,
		briefCategories,
		setCategories,
		categoriesLabel: formatCategoryList(briefCategories, setCategories),
		editable
	};
};

function parseAnswers(
	formData: FormData,
	questionIds: string[],
	questions: Array<{ id: string; allowAttachments: boolean }>
): Record<string, unknown> {
	const answers: Record<string, unknown> = {};
	const questionMap = new Map(questions.map((question) => [question.id, question]));

	for (const id of questionIds) {
		const value = formData.get(id);
		if (value === 'on') {
			answers[id] = true;
		} else if (value !== null && value !== '') {
			answers[id] = String(value);
		}

		const question = questionMap.get(id);
		if (question?.allowAttachments) {
			const attachments = parseAttachmentsField(formData.get(attachmentAnswerKey(id)));
			if (attachments.length > 0) {
				answers[attachmentAnswerKey(id)] = attachments;
			}
		}
	}
	return answers;
}

async function loadAssignmentQuestions(
	db: App.Locals['db'],
	assignmentId: string,
	questionIds: string[]
) {
	const [row] = await db
		.select({
			questionSetId: assignments.questionSetId,
			briefCategories: assignments.categories,
			setCategories: questionSets.categories
		})
		.from(assignments)
		.innerJoin(questionSets, eq(assignments.questionSetId, questionSets.id))
		.where(eq(assignments.id, assignmentId))
		.limit(1);

	if (!row) return [];

	const applicable = await loadQuestionsForAssignment(
		db,
		row.questionSetId,
		parseCategoryIds(row.briefCategories),
		normalizeCategoryDefinitions(row.setCategories)
	);

	return applicable.filter((question) => questionIds.includes(question.id));
}

export const actions: Actions = {
	save: async ({ request, locals }) => {
		const session = requireClient(locals);
		const data = await request.formData();
		const questionIds = String(data.get('questionIds') ?? '')
			.split(',')
			.filter(Boolean);
		const setQuestions = await loadAssignmentQuestions(locals.db, session.assignmentId, questionIds);
		const answers = parseAnswers(data, questionIds, setQuestions);
		const partial = data.get('partial') === 'true';

		const validationError = partial
			? validatePartialAnswers(setQuestions, answers)
			: validateAnswers(setQuestions, answers);
		if (validationError) {
			return fail(400, { error: validationError });
		}

		const [response] = await locals.db
			.select()
			.from(responses)
			.where(eq(responses.assignmentId, session.assignmentId))
			.limit(1);

		if (!response || response.status === 'submitted') {
			const [assignment] = await locals.db
				.select()
				.from(assignments)
				.where(eq(assignments.id, session.assignmentId))
				.limit(1);

			if (response?.status === 'submitted' && assignment?.allowEditsAfterSubmit) {
				await locals.db
					.update(responses)
					.set({ answers, updatedAt: new Date() })
					.where(eq(responses.assignmentId, session.assignmentId));
				return { saved: true };
			}

			return fail(400, { error: 'This brief can no longer be edited.' });
		}

		await locals.db
			.update(responses)
			.set({ answers, updatedAt: new Date() })
			.where(eq(responses.assignmentId, session.assignmentId));

		return { saved: true };
	},

	submit: async ({ request, locals, platform }) => {
		const session = requireClient(locals);
		const data = await request.formData();
		const questionIds = String(data.get('questionIds') ?? '')
			.split(',')
			.filter(Boolean);

		const [row] = await locals.db
			.select({
				assignment: assignments,
				client: clients,
				response: responses,
				questionSet: questionSets,
				setCategories: questionSets.categories
			})
			.from(assignments)
			.innerJoin(clients, eq(assignments.clientId, clients.id))
			.innerJoin(responses, eq(responses.assignmentId, assignments.id))
			.innerJoin(questionSets, eq(assignments.questionSetId, questionSets.id))
			.where(eq(assignments.id, session.assignmentId))
			.limit(1);

		if (!row) return fail(404, { error: 'Assignment not found.' });

		const setQuestions = await loadQuestionsForAssignment(
			locals.db,
			row.assignment.questionSetId,
			parseCategoryIds(row.assignment.categories),
			normalizeCategoryDefinitions(row.setCategories)
		);

		const applicable = setQuestions.filter((question) => questionIds.includes(question.id));
		const answers = parseAnswers(data, questionIds, applicable);

		const validationError = validateAnswers(applicable, answers);
		if (validationError) {
			return fail(400, { error: validationError });
		}

		if (row.response.status === 'submitted' && !row.assignment.allowEditsAfterSubmit) {
			return fail(400, { error: 'This brief has already been submitted.' });
		}

		const wasDraft = row.response.status !== 'submitted';

		await locals.db
			.update(responses)
			.set({
				answers,
				status: 'submitted',
				submittedAt: row.response.submittedAt ?? new Date(),
				updatedAt: new Date()
			})
			.where(eq(responses.assignmentId, session.assignmentId));

		if (wasDraft) {
			const briefTitle =
				formatCategoryList(
					parseCategoryIds(row.assignment.categories),
					normalizeCategoryDefinitions(row.setCategories)
				) || row.questionSet.title;

			void sendBriefSubmittedNotification(platform, {
				to: getAdminNotificationEmail(),
				clientCompany: row.client.company,
				clientContact: row.client.contactName,
				briefTitle,
				submissionUrl: adminSubmissionUrl(session.assignmentId, platform)
			}).catch((notifyError) => {
				console.error('[briefly] submission notification failed', notifyError);
			});
		}

		return { submitted: true };
	}
};
