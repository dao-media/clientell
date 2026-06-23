import { and, asc, desc, eq, gte, isNull, like, lte, or } from 'drizzle-orm';
import {
	formatCategoryList,
	normalizeCategoryDefinitions,
	parseCategoryIds
} from '$lib/categories';
import type { Database } from '$lib/server/db';
import { filterQuestionsForBrief, filterActiveQuestions, loadQuestionsForAssignment } from '$lib/server/questions';
import { computeProgress, formatAnswer } from '$lib/utils';
import {
	assignments,
	clients,
	questions,
	questionSets,
	responses,
	type ResponseStatus
} from '$lib/server/db/schema';

export type SubmissionStatusFilter = ResponseStatus | 'all' | 'pending';

export type SubmissionFilters = {
	status?: SubmissionStatusFilter;
	clientId?: string;
	search?: string;
	dateFrom?: string;
	dateTo?: string;
};

export type SubmissionListItem = {
	id: string;
	clientId: string;
	clientCompany: string;
	clientContact: string;
	clientEmail: string;
	clientPhone: string | null;
	categoriesLabel: string;
	status: ResponseStatus | null;
	progress: number;
	isActive: boolean;
	createdAt: Date;
	updatedAt: Date | null;
	submittedAt: Date | null;
	answerPreview: string;
};

function parseDateStart(value: string): Date | null {
	if (!value) return null;
	const date = new Date(`${value}T00:00:00`);
	return Number.isNaN(date.getTime()) ? null : date;
}

function parseDateEnd(value: string): Date | null {
	if (!value) return null;
	const date = new Date(`${value}T23:59:59.999`);
	return Number.isNaN(date.getTime()) ? null : date;
}

function buildConditions(filters: SubmissionFilters) {
	const conditions = [];

	if (filters.status === 'pending') {
		conditions.push(or(isNull(responses.status), eq(responses.status, 'draft')));
	} else if (filters.status && filters.status !== 'all') {
		conditions.push(eq(responses.status, filters.status));
	}

	if (filters.clientId) {
		conditions.push(eq(assignments.clientId, filters.clientId));
	}

	if (filters.search?.trim()) {
		const term = `%${filters.search.trim()}%`;
		conditions.push(
			or(
				like(responses.answers, term),
				like(clients.company, term),
				like(clients.contactName, term),
				like(clients.email, term),
				like(clients.phone, term),
				like(questionSets.title, term)
			)
		);
	}

	const from = filters.dateFrom ? parseDateStart(filters.dateFrom) : null;
	if (from) {
		conditions.push(gte(assignments.createdAt, from));
	}

	const to = filters.dateTo ? parseDateEnd(filters.dateTo) : null;
	if (to) {
		conditions.push(lte(assignments.createdAt, to));
	}

	return conditions;
}

export async function listSubmissions(db: Database, filters: SubmissionFilters = {}) {
	const conditions = buildConditions(filters);
	const whereClause = conditions.length ? and(...conditions) : undefined;

	const rows = await db
		.select({
			id: assignments.id,
			clientId: assignments.clientId,
			clientCompany: clients.company,
			clientContact: clients.contactName,
			clientEmail: clients.email,
			clientPhone: clients.phone,
			questionSetId: questionSets.id,
			questionSetTitle: questionSets.title,
			setCategories: questionSets.categories,
			briefCategories: assignments.categories,
			status: responses.status,
			answers: responses.answers,
			isActive: assignments.isActive,
			createdAt: assignments.createdAt,
			updatedAt: responses.updatedAt,
			submittedAt: responses.submittedAt
		})
		.from(assignments)
		.innerJoin(clients, eq(assignments.clientId, clients.id))
		.innerJoin(questionSets, eq(assignments.questionSetId, questionSets.id))
		.leftJoin(responses, eq(responses.assignmentId, assignments.id))
		.where(whereClause)
		.orderBy(desc(assignments.createdAt));

	const setIds = [...new Set(rows.map((row) => row.questionSetId))];
	const questionsBySet = new Map<
		string,
		Array<{
			id: string;
			type: import('$lib/server/db/schema').QuestionType;
			categories: string[];
			isActive: boolean;
		}>
	>();

	if (setIds.length > 0) {
		const allQuestions = await db
			.select({
				id: questions.id,
				questionSetId: questions.questionSetId,
				type: questions.type,
				categories: questions.categories,
				isActive: questions.isActive
			})
			.from(questions)
			.where(or(...setIds.map((id) => eq(questions.questionSetId, id))))
			.orderBy(asc(questions.sortOrder), asc(questions.label));

		for (const question of allQuestions) {
			const existing = questionsBySet.get(question.questionSetId) ?? [];
			existing.push({
				id: question.id,
				type: question.type,
				categories: parseCategoryIds(question.categories),
				isActive: question.isActive
			});
			questionsBySet.set(question.questionSetId, existing);
		}
	}

	return rows.map((row): SubmissionListItem => {
		const answers = (row.answers ?? {}) as Record<string, unknown>;
		const setQuestions = questionsBySet.get(row.questionSetId) ?? [];
		const briefCategories = parseCategoryIds(row.briefCategories);
		const setCategories = normalizeCategoryDefinitions(row.setCategories);
		const applicableQuestions = filterActiveQuestions(
			filterQuestionsForBrief(setQuestions, briefCategories, setCategories)
		);
		const progress = computeProgress(applicableQuestions, answers);

		const answerPreview = Object.values(answers)
			.map((value) => formatAnswer(value))
			.filter((value) => value !== '—')
			.join(' · ')
			.slice(0, 160);

		return {
			id: row.id,
			clientId: row.clientId,
			clientCompany: row.clientCompany,
			clientContact: row.clientContact,
			clientEmail: row.clientEmail,
			clientPhone: row.clientPhone,
			categoriesLabel: formatCategoryList(briefCategories, setCategories),
			status: row.status,
			progress,
			isActive: row.isActive,
			createdAt: row.createdAt,
			updatedAt: row.updatedAt,
			submittedAt: row.submittedAt,
			answerPreview
		};
	});
}

export async function getSubmissionDetail(db: Database, assignmentId: string) {
	const [row] = await db
		.select({
			assignment: assignments,
			client: clients,
			questionSet: questionSets,
			response: responses
		})
		.from(assignments)
		.innerJoin(clients, eq(assignments.clientId, clients.id))
		.innerJoin(questionSets, eq(assignments.questionSetId, questionSets.id))
		.leftJoin(responses, eq(responses.assignmentId, assignments.id))
		.where(eq(assignments.id, assignmentId))
		.limit(1);

	if (!row) return null;

	const briefCategories = parseCategoryIds(row.assignment.categories);
	const setCategories = normalizeCategoryDefinitions(row.questionSet.categories);
	const setQuestions = await loadQuestionsForAssignment(
		db,
		row.questionSet.id,
		briefCategories,
		setCategories,
		{ activeOnly: false }
	);

	const answers = (row.response?.answers ?? {}) as Record<string, unknown>;
	const progress = computeProgress(setQuestions, answers);

	return {
		...row,
		questions: setQuestions,
		briefCategories,
		setCategories,
		progress
	};
}

export async function listClientsForFilter(db: Database) {
	return db
		.select({ id: clients.id, company: clients.company })
		.from(clients)
		.orderBy(asc(clients.company));
}

export function submissionHasClientContent(
	response: { status: ResponseStatus } | null | undefined,
	progress: number
): boolean {
	if (response?.status === 'submitted') return true;
	return progress > 0;
}

export async function deleteAssignment(db: Database, assignmentId: string) {
	await db.delete(assignments).where(eq(assignments.id, assignmentId));
}
