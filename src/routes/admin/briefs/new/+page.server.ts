import { fail } from '@sveltejs/kit';
import { asc } from 'drizzle-orm';
import { normalizeClientServiceIds } from '$lib/categories';
import { registerPageDataDepends } from '$lib/admin/refresh-data';
import { createBriefAssignment } from '$lib/server/brief-create';
import { ensureBriefWorkspace } from '$lib/server/brief-workspace';
import { clients } from '$lib/server/db/schema';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals, depends, url }) => {
	registerPageDataDepends(depends, url.pathname, 'briefly:clients', 'briefly:dashboard');
	const [clientRows, workspace] = await Promise.all([
		locals.db.select().from(clients).orderBy(asc(clients.company)),
		ensureBriefWorkspace(locals.db)
	]);

	return {
		clients: clientRows.map((client) => ({
			...client,
			services: normalizeClientServiceIds(client.services ?? [], workspace.categories)
		})),
		workspace
	};
};

export const actions: Actions = {
	default: async ({ request, locals, platform }) => {
		const result = await createBriefAssignment(locals.db, await request.formData(), platform);

		if (!result.ok) {
			return fail(result.status, { error: result.error });
		}

		return {
			success: true,
			assignmentId: result.assignmentId,
			pin: result.pin,
			clientEmail: result.clientEmail,
			briefCategories: result.briefCategories,
			portalUrl: result.portalUrl
		};
	}
};
