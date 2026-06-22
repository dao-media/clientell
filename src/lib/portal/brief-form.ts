import { attachmentAnswerKey } from '$lib/attachments';
import type { QuestionType } from '$lib/server/db/schema';

export type BriefQuestion = {
	id: string;
	type: QuestionType;
	allowAttachments: boolean;
};

export function buildBriefFormData(
	questions: BriefQuestion[],
	answers: Record<string, unknown>,
	options: { partial?: boolean } = {}
): FormData {
	const formData = new FormData();
	formData.set('questionIds', questions.map((question) => question.id).join(','));
	if (options.partial) {
		formData.set('partial', 'true');
	}

	for (const question of questions) {
		const value = answers[question.id];
		if (value === true) {
			formData.set(question.id, 'on');
		} else if (value !== undefined && value !== null && value !== '') {
			formData.set(question.id, String(value));
		}

		if (question.allowAttachments) {
			const attachments = answers[attachmentAnswerKey(question.id)];
			if (attachments) {
				formData.set(attachmentAnswerKey(question.id), JSON.stringify(attachments));
			}
		}
	}

	return formData;
}
