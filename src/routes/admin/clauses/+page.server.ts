import { fail } from '@sveltejs/kit';
import { eq } from 'drizzle-orm';
import { registerPageDataDepends } from '$lib/admin/refresh-data';
import { ensureClausesSeeded } from '$lib/server/contract/ensure-clauses';
import { clauses } from '$lib/server/db/schema';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals, url, depends }) => {
	registerPageDataDepends(depends, url.pathname, 'briefly:clauses');
	await ensureClausesSeeded(locals.db);
	const rows = await locals.db.select().from(clauses);
	return {
		clauses: rows.sort((a, b) => a.sortOrder - b.sortOrder || a.sectionNumber.localeCompare(b.sectionNumber))
	};
};

export const actions: Actions = {
	saveClause: async ({ request, locals }) => {
		const data = await request.formData();
		const id = String(data.get('clauseId') ?? '').trim();
		const title = String(data.get('title') ?? '').trim();
		const body = String(data.get('body') ?? '');
		const sectionNumber = String(data.get('sectionNumber') ?? '').trim();
		const isActive = data.get('isActive') === 'on' || data.get('isActive') === 'true';

		if (!id) return fail(400, { error: 'Missing clause id.' });
		if (!title) return fail(400, { error: 'Title is required.' });

		await locals.db
			.update(clauses)
			.set({ title, body, sectionNumber, isActive })
			.where(eq(clauses.id, id));

		return { success: true };
	}
};
