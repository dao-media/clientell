import { and, eq } from 'drizzle-orm';
import { createClauseId } from '$lib/ids';
import { CLAUSE_SEEDS } from '$lib/contract/clause-seed';
import type { Database } from '$lib/server/db';
import { clauses } from '$lib/server/db/schema';

const OBSOLETE = [
	{ docType: 'agreement', sectionNumber: '10.1' },
	{ docType: 'agreement', sectionNumber: '10.2' }
] as const;

export async function ensureClausesSeeded(db: Database): Promise<void> {
	try {
		const existing = await db.select().from(clauses);
		const byKey = new Map(existing.map((row) => [`${row.docType}:${row.sectionNumber}`, row]));

		for (const seed of CLAUSE_SEEDS) {
			const key = `${seed.docType}:${seed.sectionNumber}`;
			const found = byKey.get(key);
			if (!found) {
				await db.insert(clauses).values({
					id: createClauseId(),
					sectionNumber: seed.sectionNumber,
					title: seed.title,
					body: seed.body,
					docType: seed.docType,
					clauseType: seed.clauseType,
					moduleKey: seed.moduleKey,
					sortOrder: seed.sortOrder,
					isActive: true
				});
				continue;
			}

			await db
				.update(clauses)
				.set({
					title: seed.title,
					body: seed.body,
					clauseType: seed.clauseType,
					moduleKey: seed.moduleKey,
					sortOrder: seed.sortOrder
				})
				.where(eq(clauses.id, found.id));
		}

		for (const obsolete of OBSOLETE) {
			await db
				.delete(clauses)
				.where(
					and(eq(clauses.docType, obsolete.docType), eq(clauses.sectionNumber, obsolete.sectionNumber))
				);
		}
	} catch (err) {
		console.warn('[clientell] clause seed skipped (clauses table may not exist yet)', err);
	}
}
