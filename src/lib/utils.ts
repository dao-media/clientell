import type { QuestionType } from '$lib/server/db/schema';

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

export function validateAnswers(
	questions: Array<{
		id: string;
		label: string;
		required: boolean;
		type: QuestionType;
	}>,
	answers: Record<string, unknown>
): string | null {
	for (const question of questions) {
		const value = answers[question.id];
		const empty =
			value === undefined ||
			value === null ||
			value === '' ||
			(question.type === 'checkbox' && value !== true);

		if (question.required && empty) {
			return `"${question.label}" is required.`;
		}
	}
	return null;
}

export function isAnswered(type: QuestionType, value: unknown): boolean {
	if (value === undefined || value === null || value === '') return false;
	if (type === 'checkbox') return value === true;
	return true;
}

export function formatAnswer(value: unknown): string {
	if (value === undefined || value === null || value === '') return '—';
	if (value === true) return 'Yes';
	if (value === false) return 'No';
	return String(value);
}

export function computeProgress(
	questions: Array<{ id: string; type: QuestionType }>,
	answers: Record<string, unknown>
): number {
	if (questions.length === 0) return 0;
	const answered = questions.filter((question) => isAnswered(question.type, answers[question.id])).length;
	return Math.round((answered / questions.length) * 100);
}
