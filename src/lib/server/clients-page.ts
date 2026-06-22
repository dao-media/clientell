import { desc } from 'drizzle-orm';
import { mergeCategoryDefinitions, normalizeClientServiceIds } from '$lib/categories';
import type { Database } from '$lib/server/db';
import { clients, questionSets } from '$lib/server/db/schema';

export async function loadClientsPageData(db: Database) {
	const [clientRows, setRows] = await Promise.all([
		db.select().from(clients).orderBy(desc(clients.createdAt)),
		db.select({ categories: questionSets.categories }).from(questionSets)
	]);

	const serviceOptions = mergeCategoryDefinitions(setRows.map((set) => set.categories));

	return {
		serviceOptions,
		clients: clientRows.map((client) => ({
			...client,
			services: normalizeClientServiceIds(client.services ?? [], serviceOptions)
		}))
	};
}
