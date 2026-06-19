import { desc, eq, sql } from 'drizzle-orm';
import { formatCategoryList, normalizeCategoryDefinitions, parseCategoryIds } from '$lib/categories';
import { countDistinctBriefCategories } from '$lib/server/brief-workspace';
import { assignments, clients, questionSets, responses } from '$lib/server/db/schema';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
	const [clientCount, categoryCount, assignmentRows] = await Promise.all([
		locals.db.select({ count: sql<number>`count(*)` }).from(clients),
		countDistinctBriefCategories(locals.db),
		locals.db
			.select({
				id: assignments.id,
				createdAt: assignments.createdAt,
				isActive: assignments.isActive,
				clientCompany: clients.company,
				briefCategories: assignments.categories,
				setCategories: questionSets.categories,
				status: responses.status
			})
			.from(assignments)
			.innerJoin(clients, eq(assignments.clientId, clients.id))
			.innerJoin(questionSets, eq(assignments.questionSetId, questionSets.id))
			.leftJoin(responses, eq(responses.assignmentId, assignments.id))
			.orderBy(desc(assignments.createdAt))
			.limit(8)
	]);

	return {
		stats: {
			clients: clientCount[0]?.count ?? 0,
			categories: categoryCount,
			assignments: assignmentRows.length
		},
		recentAssignments: assignmentRows.map((row) => ({
			...row,
			categoriesLabel: formatCategoryList(
				parseCategoryIds(row.briefCategories),
				normalizeCategoryDefinitions(row.setCategories)
			)
		}))
	};
};
