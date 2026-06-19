import { desc } from 'drizzle-orm';
import {
	mergeCategoryDefinitions,
	normalizeCategoryDefinitions,
	type QuestionCategory
} from '$lib/categories';
import type { Database } from '$lib/server/db';
import { questionSets } from '$lib/server/db/schema';

export type BriefWorkspace = {
	id: string;
	title: string;
	description: string | null;
	categories: QuestionCategory[];
	createdAt: Date;
	updatedAt: Date;
};

export async function ensureBriefWorkspace(db: Database): Promise<BriefWorkspace> {
	let rows = await db.select().from(questionSets).orderBy(desc(questionSets.updatedAt));

	if (rows.length === 0) {
		const [created] = await db.insert(questionSets).values({ title: 'Briefs' }).returning();
		rows = [created];
	}

	const workspace = rows[0];

	return {
		...workspace,
		categories: normalizeCategoryDefinitions(workspace.categories)
	};
}

export async function countDistinctBriefCategories(db: Database): Promise<number> {
	const rows = await db.select({ categories: questionSets.categories }).from(questionSets);
	return mergeCategoryDefinitions(rows.map((row) => row.categories)).length;
}
