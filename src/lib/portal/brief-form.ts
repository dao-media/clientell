import { attachmentAnswerKey } from '$lib/attachments';
import { deserialize } from '$app/forms';
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

		if (question.type === 'checkbox') {
			formData.set(question.id, value === true ? 'on' : '');
		} else if (value === undefined || value === null) {
			formData.set(question.id, '');
		} else {
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

/** POST a portal brief action and deserialize the SvelteKit action result. */
export async function submitBriefAction(action: 'save' | 'submit', formData: FormData) {
	const response = await fetch(`?/${action}`, {
		method: 'POST',
		headers: {
			accept: 'application/json',
			'x-sveltekit-action': 'true'
		},
		body: formData
	});

	return deserialize(await response.text());
}
