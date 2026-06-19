export const QUESTION_INPUT_RESTRICTIONS = [
	{ value: '', text: 'No restriction' },
	{ value: 'max_1_sentence', text: '1 sentence maximum' },
	{ value: 'min_1_sentence', text: '1 sentence minimum' },
	{ value: 'max_3_sentences', text: '3 sentences maximum' },
	{ value: 'max_300_words', text: '300 words or less' },
	{ value: 'max_500_words', text: '500 words or less' }
] as const;

export type QuestionInputRestriction =
	| 'max_1_sentence'
	| 'min_1_sentence'
	| 'max_3_sentences'
	| 'max_300_words'
	| 'max_500_words';

const RESTRICTION_LABELS: Record<QuestionInputRestriction, string> = {
	max_1_sentence: '1 sentence maximum',
	min_1_sentence: '1 sentence minimum',
	max_3_sentences: '3 sentences maximum',
	max_300_words: '300 words or less',
	max_500_words: '500 words or less'
};

export function parseQuestionInputRestriction(value: unknown): QuestionInputRestriction | null {
	if (typeof value !== 'string') return null;
	const trimmed = value.trim();
	if (!trimmed) return null;
	if (trimmed in RESTRICTION_LABELS) {
		return trimmed as QuestionInputRestriction;
	}
	return null;
}

export function restrictionLabel(restriction: QuestionInputRestriction | null | undefined): string | null {
	if (!restriction) return null;
	return RESTRICTION_LABELS[restriction] ?? null;
}

export function countWords(text: string): number {
	const trimmed = text.trim();
	if (!trimmed) return 0;
	return trimmed.split(/\s+/).filter(Boolean).length;
}

export function countSentences(text: string): number {
	const trimmed = text.trim();
	if (!trimmed) return 0;

	const segments = trimmed.match(/[^.!?]+[.!?]+|[^.!?]+$/g);
	if (!segments) return 1;

	return segments.map((segment) => segment.trim()).filter(Boolean).length;
}

export function validateInputRestriction(
	restriction: QuestionInputRestriction | null | undefined,
	value: unknown
): string | null {
	if (!restriction) return null;

	const text = String(value ?? '').trim();
	if (!text) return null;

	switch (restriction) {
		case 'max_1_sentence':
			if (countSentences(text) > 1) return 'Use 1 sentence maximum.';
			break;
		case 'min_1_sentence':
			if (countSentences(text) < 1) return 'Use at least 1 sentence.';
			break;
		case 'max_3_sentences':
			if (countSentences(text) > 3) return 'Use 3 sentences maximum.';
			break;
		case 'max_300_words':
			if (countWords(text) > 300) return 'Use 300 words or less.';
			break;
		case 'max_500_words':
			if (countWords(text) > 500) return 'Use 500 words or less.';
			break;
	}

	return null;
}

export function inputRestrictionStats(
	restriction: QuestionInputRestriction | null | undefined,
	value: unknown
): string | null {
	if (!restriction) return null;

	const text = String(value ?? '').trim();
	if (!text) return null;

	if (restriction === 'max_300_words' || restriction === 'max_500_words') {
		const limit = restriction === 'max_300_words' ? 300 : 500;
		return `${countWords(text)} / ${limit} words`;
	}

	if (
		restriction === 'max_1_sentence' ||
		restriction === 'min_1_sentence' ||
		restriction === 'max_3_sentences'
	) {
		const limit =
			restriction === 'max_1_sentence'
				? 1
				: restriction === 'max_3_sentences'
					? 3
					: 1;
		const label =
			restriction === 'min_1_sentence'
				? `${countSentences(text)} sentence${countSentences(text) === 1 ? '' : 's'}`
				: `${countSentences(text)} / ${limit} sentence${limit === 1 ? '' : 's'}`;
		return label;
	}

	return null;
}
