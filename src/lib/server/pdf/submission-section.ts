import { getSubmissionDetail } from '$lib/server/submissions';
import { computeProgress } from '$lib/utils';
import type { BriefPdfSection } from '$lib/server/pdf/brief-export';
import type { Database } from '$lib/server/db';

export async function submissionToPdfSection(
	db: Database,
	assignmentId: string
): Promise<BriefPdfSection | null> {
	const detail = await getSubmissionDetail(db, assignmentId);
	if (!detail) return null;

	const answers = (detail.response?.answers ?? {}) as Record<string, unknown>;
	const progress = computeProgress(detail.questions, answers);

	return {
		company: detail.client.company,
		contactName: detail.client.contactName,
		email: detail.client.email,
		phone: detail.client.phone,
		briefTitle: detail.questionSet.title,
		status: detail.response?.status ?? 'draft',
		progress,
		createdAt: detail.assignment.createdAt,
		submittedAt: detail.response?.submittedAt ?? null,
		questions: detail.questions.map((question) => ({
			id: question.id,
			label: question.label,
			helpText: question.helpText
		})),
		answers
	};
}
