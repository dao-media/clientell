import { and, desc, eq, gte, isNull, or, sql } from 'drizzle-orm';
import { formatCategoryList, normalizeCategoryDefinitions, parseCategoryIds } from '$lib/categories';
import { countDistinctBriefCategories } from '$lib/server/brief-workspace';
import { assignments, clients, questionSets, responses } from '$lib/server/db/schema';
import type { PageServerLoad } from './$types';

const RECENT_SUBMISSION_DAYS = 90;

function recentSubmissionCutoff(): Date {
	const cutoff = new Date();
	cutoff.setDate(cutoff.getDate() - RECENT_SUBMISSION_DAYS);
	return cutoff;
}

export const load: PageServerLoad = async ({ locals, depends }) => {
	depends('briefly:dashboard');

	const [clientCount, categoryCount, pendingCount, assignmentRows] = await Promise.all([
		locals.db.select({ count: sql<number>`count(*)` }).from(clients),
		countDistinctBriefCategories(locals.db),
		locals.db
			.select({ count: sql<number>`count(*)` })
			.from(assignments)
			.leftJoin(responses, eq(responses.assignmentId, assignments.id))
			.where(or(isNull(responses.status), eq(responses.status, 'draft'))),
		locals.db
			.select({
				id: assignments.id,
				submittedAt: responses.submittedAt,
				isActive: assignments.isActive,
				clientCompany: clients.company,
				briefCategories: assignments.categories,
				setCategories: questionSets.categories,
				status: responses.status
			})
			.from(assignments)
			.innerJoin(clients, eq(assignments.clientId, clients.id))
			.innerJoin(questionSets, eq(assignments.questionSetId, questionSets.id))
			.innerJoin(responses, eq(responses.assignmentId, assignments.id))
			.where(
				and(
					eq(responses.status, 'submitted'),
					gte(responses.submittedAt, recentSubmissionCutoff())
				)
			)
			.orderBy(desc(responses.submittedAt))
			.limit(8)
	]);

	return {
		stats: {
			clients: clientCount[0]?.count ?? 0,
			categories: categoryCount,
			pending: pendingCount[0]?.count ?? 0
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
