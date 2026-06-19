import { asc, eq } from 'drizzle-orm';
import {
	normalizeCategoryDefinitions,
	normalizeQuestionCategoryIds,
	questionAppliesToBrief,
	type QuestionCategory
} from '$lib/categories';
import type { Database } from '$lib/server/db';
import { questions, type QuestionType } from '$lib/server/db/schema';

export type QuestionRow = {
	id: string;
	questionSetId: string;
	sortOrder: number;
	type: QuestionType;
	label: string;
	helpText: string | null;
	required: boolean;
	options: string[] | null;
	allowAttachments: boolean;
	inputRestriction: import('$lib/question-restrictions').QuestionInputRestriction | null;
	categories: string[];
	isActive: boolean;
};

export type LoadQuestionsOptions = {
	activeOnly?: boolean;
};

export function filterQuestionsForBrief<T extends { categories: unknown }>(
	questionRows: T[],
	briefCategories: string[],
	setCategories: QuestionCategory[]
): T[] {
	return questionRows.filter((question) =>
		questionAppliesToBrief(
			normalizeQuestionCategoryIds(question.categories, setCategories),
			briefCategories,
			setCategories
		)
	);
}

export function filterActiveQuestions<T extends { isActive: boolean }>(questionRows: T[]): T[] {
	return questionRows.filter((question) => question.isActive);
}

export async function loadQuestionsForAssignment(
	db: Database,
	questionSetId: string,
	briefCategories: string[],
	setCategories: QuestionCategory[],
	options: LoadQuestionsOptions = { activeOnly: true }
) {
	const rows = await db
		.select()
		.from(questions)
		.where(eq(questions.questionSetId, questionSetId))
		.orderBy(asc(questions.sortOrder), asc(questions.label));

	let result = filterQuestionsForBrief(rows, briefCategories, setCategories);

	if (options.activeOnly !== false) {
		result = filterActiveQuestions(result);
	}

	return result;
}
