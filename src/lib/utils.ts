import type { QuestionType } from '$lib/server/db/schema';
import { attachmentAnswerKey, parseAttachments } from '$lib/attachments';
import {
	validateInputRestriction,
	type QuestionInputRestriction
} from '$lib/question-restrictions';

export function normalizeEmail(email: string): string {
	return email.trim().toLowerCase();
}

export function questionTypeLabel(type: QuestionType): string {
	switch (type) {
		case 'text':
			return 'Short text';
		case 'textarea':
			return 'Long text';
		case 'email':
			return 'Email';
		case 'url':
			return 'URL';
		case 'number':
			return 'Number';
		case 'select':
			return 'Single choice';
		case 'checkbox':
			return 'Yes / No';
		default:
			return type;
	}
}

export function parseOptionsInput(raw: string): string[] {
	return raw
		.split('\n')
		.map((line) => line.trim())
		.filter(Boolean);
}

export function formatRelativeTime(date: Date): string {
	return new Intl.DateTimeFormat(undefined, {
		dateStyle: 'medium',
		timeStyle: 'short'
	}).format(date);
}

export function isTextAnswerEmpty(type: QuestionType, value: unknown): boolean {
	return (
		value === undefined ||
		value === null ||
		value === '' ||
		(type === 'checkbox' && value !== true)
	);
}

export function hasAttachmentsForQuestion(
	answers: Record<string, unknown>,
	questionId: string
): boolean {
	return parseAttachments(answers[attachmentAnswerKey(questionId)]).length > 0;
}

export function isQuestionAnswered(
	question: { id: string; type: QuestionType; allowAttachments?: boolean },
	answers: Record<string, unknown>
): boolean {
	if (!isTextAnswerEmpty(question.type, answers[question.id])) return true;
	if (question.allowAttachments && hasAttachmentsForQuestion(answers, question.id)) return true;
	return false;
}

export function validateAnswers(
	questions: Array<{
		id: string;
		label: string;
		required: boolean;
		type: QuestionType;
		allowAttachments?: boolean;
		inputRestriction?: QuestionInputRestriction | null;
	}>,
	answers: Record<string, unknown>
): string | null {
	for (const question of questions) {
		if (question.required && !isQuestionAnswered(question, answers)) {
			return `"${question.label}" is required.`;
		}

		const value = answers[question.id];
		if (!isTextAnswerEmpty(question.type, value)) {
			const restrictionError = validateInputRestriction(question.inputRestriction, value);
			if (restrictionError) {
				return `"${question.label}": ${restrictionError}`;
			}
		}
	}
	return null;
}

/** Validates only fields the client has started; used for draft saves between wizard steps. */
export function validatePartialAnswers(
	questions: Array<{
		id: string;
		label: string;
		type: QuestionType;
		allowAttachments?: boolean;
		inputRestriction?: QuestionInputRestriction | null;
	}>,
	answers: Record<string, unknown>
): string | null {
	for (const question of questions) {
		const value = answers[question.id];
		const hasAttachments =
			question.allowAttachments && hasAttachmentsForQuestion(answers, question.id);

		if (isTextAnswerEmpty(question.type, value) && !hasAttachments) continue;

		if (!isTextAnswerEmpty(question.type, value)) {
			const restrictionError = validateInputRestriction(question.inputRestriction, value);
			if (restrictionError) {
				return `"${question.label}": ${restrictionError}`;
			}
		}
	}
	return null;
}

export function isAnswered(
	type: QuestionType,
	value: unknown,
	options?: { questionId?: string; allowAttachments?: boolean; answers?: Record<string, unknown> }
): boolean {
	if (!isTextAnswerEmpty(type, value)) return true;
	if (options?.allowAttachments && options.questionId && options.answers) {
		return hasAttachmentsForQuestion(options.answers, options.questionId);
	}
	return false;
}

export function formatAnswer(value: unknown): string {
	if (value === undefined || value === null || value === '') return '—';
	if (value === true) return 'Yes';
	if (value === false) return 'No';
	return String(value);
}

export function computeProgress(
	questions: Array<{ id: string; type: QuestionType; allowAttachments?: boolean }>,
	answers: Record<string, unknown>
): number {
	if (questions.length === 0) return 0;
	const answered = questions.filter((question) =>
		isQuestionAnswered(question, answers)
	).length;
	return Math.round((answered / questions.length) * 100);
}
