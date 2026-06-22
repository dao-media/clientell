import { formatCategoryList } from '$lib/categories';
import type { Database } from '$lib/server/db';
import { loadQuestionsForAssignment } from '$lib/server/questions';
import { getSubmissionDetail } from '$lib/server/submissions';

export async function loadBriefPreviewForAssignment(db: Database, assignmentId: string) {
	const detail = await getSubmissionDetail(db, assignmentId);
	if (!detail) return null;

	const questions = await loadQuestionsForAssignment(
		db,
		detail.questionSet.id,
		detail.briefCategories,
		detail.setCategories,
		{ activeOnly: true }
	);

	return {
		assignmentId: detail.assignment.id,
		client: detail.client,
		questionSet: detail.questionSet,
		briefCategories: detail.briefCategories,
		setCategories: detail.setCategories,
		categoriesLabel: formatCategoryList(detail.briefCategories, detail.setCategories),
		questions
	};
}
