export type QuestionCategory = {
	id: string;
	name: string;
	color: string;
};

export const CATEGORY_COLOR_PRESETS = [
	'#0f62fe',
	'#1192e8',
	'#8a3ffc',
	'#fa4d56',
	'#198038',
	'#f1c21b'
] as const;

/** Tab id for the placeholder shown before the first real category exists. */
export const PLACEHOLDER_CATEGORY_TAB_ID = '__category-placeholder__';

function slugId(value: string): string {
	return value
		.toLowerCase()
		.replace(/[^a-z0-9]+/g, '-')
		.replace(/^-|-$/g, '')
		.slice(0, 40);
}

export function createCategory(name: string, color?: string, index = 0): QuestionCategory {
	const trimmed = name.trim();
	return {
		id: slugId(trimmed) || crypto.randomUUID(),
		name: trimmed,
		color: color ?? CATEGORY_COLOR_PRESETS[index % CATEGORY_COLOR_PRESETS.length]
	};
}

export function normalizeCategoryDefinitions(value: unknown): QuestionCategory[] {
	if (!Array.isArray(value)) return [];

	const categories: QuestionCategory[] = [];
	const seen = new Set<string>();

	for (const [index, item] of value.entries()) {
		if (typeof item === 'string') {
			const category = createCategory(item, undefined, index);
			if (seen.has(category.id)) continue;
			seen.add(category.id);
			categories.push(category);
			continue;
		}

		if (item && typeof item === 'object' && 'name' in item) {
			const raw = item as Partial<QuestionCategory>;
			const name = String(raw.name ?? '').trim();
			if (!name) continue;
			const id = String(raw.id ?? slugId(name) ?? crypto.randomUUID());
			if (seen.has(id)) continue;
			seen.add(id);
			categories.push({
				id,
				name,
				color: raw.color ?? CATEGORY_COLOR_PRESETS[index % CATEGORY_COLOR_PRESETS.length]
			});
		}
	}

	return categories;
}

export function parseCategoryIds(value: unknown): string[] {
	if (!Array.isArray(value)) return [];
	return value
		.filter((item): item is string => typeof item === 'string')
		.map((item) => item.trim())
		.filter(Boolean);
}

export function mergeCategoryDefinitions(categoryGroups: unknown[]): QuestionCategory[] {
	const merged: QuestionCategory[] = [];
	const seen = new Set<string>();

	for (const group of categoryGroups) {
		for (const category of normalizeCategoryDefinitions(group)) {
			if (seen.has(category.id)) continue;
			seen.add(category.id);
			merged.push(category);
		}
	}

	return merged.sort((a, b) => a.name.localeCompare(b.name));
}

export function normalizeClientServiceIds(
	selected: string[],
	available: QuestionCategory[]
): string[] {
	const validIds = new Set(available.map((category) => category.id));
	return selected.filter((id) => validIds.has(id));
}

export function parseCategoriesFromFormData(data: FormData, field = 'categories'): string[] {
	return parseCategoryIds(data.getAll(field).map(String));
}

/** @deprecated use normalizeCategoryDefinitions */
export function parseCategories(value: unknown): string[] {
	return normalizeCategoryDefinitions(value).map((category) => category.id);
}

export function resolveCategoryNames(
	ids: string[],
	definitions: QuestionCategory[]
): string[] {
	const byId = new Map(definitions.map((category) => [category.id, category.name]));
	const byName = new Map(definitions.map((category) => [category.name.toLowerCase(), category.name]));

	return ids
		.map((id) => byId.get(id) ?? byName.get(id.toLowerCase()) ?? id)
		.filter(Boolean);
}

export function normalizeQuestionCategoryIds(
	value: unknown,
	definitions: QuestionCategory[]
): string[] {
	const ids = parseCategoryIds(value);
	const byName = new Map(definitions.map((category) => [category.name.toLowerCase(), category.id]));

	return ids
		.map((entry) => {
			const match = definitions.find((category) => category.id === entry);
			if (match) return match.id;
			return byName.get(entry.toLowerCase()) ?? null;
		})
		.filter((id): id is string => Boolean(id));
}

export function formatCategoryList(
	ids: string[],
	definitions: QuestionCategory[] = []
): string {
	if (ids.length === 0) return 'All categories';
	const names = resolveCategoryNames(ids, definitions);
	return names.length > 0 ? names.join(', ') : ids.join(', ');
}

export function questionAppliesToBrief(
	questionCategoryIds: string[],
	briefCategoryIds: string[],
	setCategories: QuestionCategory[]
): boolean {
	const setIds = setCategories.map((category) => category.id);
	if (setIds.length === 0) return true;
	if (briefCategoryIds.length === 0) return questionCategoryIds.length === 0;
	if (questionCategoryIds.length === 0) return true;
	return questionCategoryIds.some((id) => briefCategoryIds.includes(id));
}

export function categoriesOverlap(a: string[], b: string[]): boolean {
	if (a.length === 0 || b.length === 0) return true;
	return a.some((value) => b.includes(value));
}

export function validateQuestionCategories(
	selected: string[],
	setCategories: QuestionCategory[]
): string | null {
	if (setCategories.length === 0) {
		return 'Create at least one category before saving a question.';
	}
	if (selected.length === 0) {
		return 'Select at least one category for this question.';
	}

	const validIds = new Set(setCategories.map((category) => category.id));
	const invalid = selected.filter((id) => !validIds.has(id));
	if (invalid.length > 0) {
		return 'One or more selected categories are no longer available.';
	}
	return null;
}

export function validateBriefCategories(
	selected: string[],
	setCategories: QuestionCategory[]
): string | null {
	if (setCategories.length === 0) return null;
	if (selected.length === 0) {
		return 'Select at least one category for this brief.';
	}

	const validIds = new Set(setCategories.map((category) => category.id));
	const invalid = selected.filter((id) => !validIds.has(id));
	if (invalid.length > 0) {
		return 'One or more selected categories are no longer available.';
	}
	return null;
}

export function parseCategoriesInput(raw: string): QuestionCategory[] {
	const names = raw
		.split(/[\n,]+/)
		.map((line) => line.trim())
		.filter(Boolean);

	return names.map((name, index) => createCategory(name, undefined, index));
}

export function categoryById(
	definitions: QuestionCategory[],
	id: string
): QuestionCategory | undefined {
	return definitions.find((category) => category.id === id);
}
