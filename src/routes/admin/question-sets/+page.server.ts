import { fail, redirect } from '@sveltejs/kit';
import { asc, eq, inArray } from 'drizzle-orm';
import {
	createCategory,
	normalizeQuestionCategoryIds,
	parseCategoriesFromFormData,
	validateQuestionCategories,
	type QuestionCategory
} from '$lib/categories';
import { createQuestionId } from '$lib/ids';
import { parseQuestionInputRestriction } from '$lib/question-restrictions';
import { ensureBriefWorkspace } from '$lib/server/brief-workspace';
import { registerPageDataDepends } from '$lib/admin/refresh-data';
import { questionSets, questions } from '$lib/server/db/schema';
import type { Actions, PageServerLoad } from './$types';

function persistCategories(categories: QuestionCategory[]) {
	return categories;
}

function resolveSetId(data: FormData, workspaceId: string): string {
	return String(data.get('setId') ?? workspaceId).trim();
}

export const load: PageServerLoad = async ({ locals, url, depends }) => {
	registerPageDataDepends(depends, url.pathname, 'briefly:questions', 'briefly:dashboard');

	if (url.searchParams.has('all') || url.searchParams.has('set')) {
		redirect(303, '/admin/question-sets');
	}

	const activeSet = await ensureBriefWorkspace(locals.db);

	const setQuestions = await locals.db
		.select()
		.from(questions)
		.where(eq(questions.questionSetId, activeSet.id))
		.orderBy(asc(questions.sortOrder), asc(questions.label));

	return {
		activeSet,
		questions: setQuestions.map((question) => ({
			...question,
			categories: normalizeQuestionCategoryIds(question.categories, activeSet.categories)
		}))
	};
};

export const actions: Actions = {
	saveCategory: async ({ request, locals }) => {
		const activeSet = await ensureBriefWorkspace(locals.db);
		const data = await request.formData();
		const setId = resolveSetId(data, activeSet.id);
		const categoryId = String(data.get('categoryId') ?? '').trim();
		const name = String(data.get('name') ?? '').trim();
		const color = String(data.get('color') ?? '').trim();

		if (!name) return fail(400, { categoryError: 'Category name is required.' });

		const categories = activeSet.categories;
		const nextCategory = categoryId
			? {
					id: categoryId,
					name,
					color: color || categories.find((entry) => entry.id === categoryId)?.color || '#0f62fe'
				}
			: createCategory(name, color || undefined, categories.length);

		const duplicate = categories.some(
			(entry) => entry.name.toLowerCase() === name.toLowerCase() && entry.id !== nextCategory.id
		);
		if (duplicate) return fail(400, { categoryError: 'A category with that name already exists.' });

		const nextCategories = categoryId
			? categories.map((entry) => (entry.id === categoryId ? nextCategory : entry))
			: [...categories, nextCategory];

		await locals.db
			.update(questionSets)
			.set({ categories: persistCategories(nextCategories), updatedAt: new Date() })
			.where(eq(questionSets.id, setId));

		return { success: true, activeCategoryId: nextCategory.id };
	},

	reorderCategories: async ({ request, locals }) => {
		const activeSet = await ensureBriefWorkspace(locals.db);
		const data = await request.formData();
		const setId = resolveSetId(data, activeSet.id);
		const orderedIds = data
			.getAll('categoryIds')
			.map((value) => String(value).trim())
			.filter(Boolean);

		if (orderedIds.length === 0) {
			return fail(400, { categoryError: 'Category order is required.' });
		}

		const byId = new Map(activeSet.categories.map((category) => [category.id, category]));
		const nextCategories = orderedIds
			.map((id) => byId.get(id))
			.filter((category): category is QuestionCategory => Boolean(category));

		if (nextCategories.length !== activeSet.categories.length) {
			return fail(400, { categoryError: 'Invalid category order.' });
		}

		await locals.db
			.update(questionSets)
			.set({ categories: persistCategories(nextCategories), updatedAt: new Date() })
			.where(eq(questionSets.id, setId));

		return { success: true };
	},

	saveQuestion: async ({ request, locals }) => {
		const activeSet = await ensureBriefWorkspace(locals.db);
		const data = await request.formData();
		const setId = resolveSetId(data, activeSet.id);
		const questionId = String(data.get('questionId') ?? '').trim();
		const label = String(data.get('label') ?? '').trim();
		const helpText = String(data.get('helpText') ?? '').trim();
		const required = data.get('required') === 'on';
		const allowAttachments = data.get('allowAttachments') === 'on';
		const isActive = data.get('isActive') === 'on';
		const selectedCategories = parseCategoriesFromFormData(data);
		const inputRestriction = parseQuestionInputRestriction(data.get('inputRestriction'));

		if (!label) return fail(400, { questionError: 'Question is required.' });

		const categoryError = validateQuestionCategories(selectedCategories, activeSet.categories);
		if (categoryError) return fail(400, { questionError: categoryError });

		if (questionId) {
			await locals.db
				.update(questions)
				.set({
					label,
					helpText: helpText || null,
					required,
					allowAttachments,
					categories: selectedCategories,
					inputRestriction,
					isActive,
					type: 'textarea'
				})
				.where(eq(questions.id, questionId));
		} else {
			const existing = await locals.db
				.select({ sortOrder: questions.sortOrder })
				.from(questions)
				.where(eq(questions.questionSetId, setId));

			const nextOrder = existing.reduce((max, row) => Math.max(max, row.sortOrder), -1) + 1;

			await locals.db.insert(questions).values({
				id: createQuestionId(),
				questionSetId: setId,
				label,
				helpText: helpText || null,
				required,
				allowAttachments,
				categories: selectedCategories,
				inputRestriction,
				isActive,
				type: 'textarea',
				sortOrder: nextOrder
			});
		}

		await locals.db
			.update(questionSets)
			.set({ updatedAt: new Date() })
			.where(eq(questionSets.id, setId));

		return { success: true };
	},

	deleteQuestion: async ({ request, locals }) => {
		const activeSet = await ensureBriefWorkspace(locals.db);
		const data = await request.formData();
		const setId = resolveSetId(data, activeSet.id);
		const questionId = String(data.get('questionId') ?? '');

		if (!questionId) return fail(400, { questionError: 'Missing question id.' });

		await locals.db.delete(questions).where(eq(questions.id, questionId));
		await locals.db
			.update(questionSets)
			.set({ updatedAt: new Date() })
			.where(eq(questionSets.id, setId));

		return { success: true };
	},

	bulkUpdateQuestions: async ({ request, locals }) => {
		const activeSet = await ensureBriefWorkspace(locals.db);
		const data = await request.formData();
		const setId = resolveSetId(data, activeSet.id);
		const questionIds = data
			.getAll('questionIds')
			.map((value) => String(value).trim())
			.filter(Boolean);
		const status = String(data.get('status') ?? '').trim();

		if (questionIds.length === 0) return fail(400, { bulkError: 'Select at least one question.' });
		if (status !== 'active' && status !== 'inactive') {
			return fail(400, { bulkError: 'Choose Active or Inactive.' });
		}

		const isActive = status === 'active';

		await locals.db
			.update(questions)
			.set({ isActive })
			.where(inArray(questions.id, questionIds));

		await locals.db
			.update(questionSets)
			.set({ updatedAt: new Date() })
			.where(eq(questionSets.id, setId));

		return { success: true };
	},

	bulkDeleteQuestions: async ({ request, locals }) => {
		const activeSet = await ensureBriefWorkspace(locals.db);
		const data = await request.formData();
		const setId = resolveSetId(data, activeSet.id);
		const questionIds = data
			.getAll('questionIds')
			.map((value) => String(value).trim())
			.filter(Boolean);

		if (questionIds.length === 0) {
			return fail(400, { bulkDeleteError: 'Select at least one question.' });
		}

		await locals.db.delete(questions).where(inArray(questions.id, questionIds));
		await locals.db
			.update(questionSets)
			.set({ updatedAt: new Date() })
			.where(eq(questionSets.id, setId));

		return { success: true, deletedCount: questionIds.length };
	}
};
