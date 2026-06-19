import { fail } from '@sveltejs/kit';
import { asc, eq } from 'drizzle-orm';
import {
	normalizeClientServiceIds,
	parseCategoriesFromFormData,
	validateBriefCategories,
	formatCategoryList
} from '$lib/categories';
import { generatePin, hashPin } from '$lib/server/auth/pin';
import { ensureBriefWorkspace } from '$lib/server/brief-workspace';
import { getPortalUrl } from '$lib/server/config';
import { assignments, clients, responses } from '$lib/server/db/schema';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
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
	default: async ({ request, locals }) => {
		const data = await request.formData();
		const clientId = String(data.get('clientId') ?? '');
		const allowEditsAfterSubmit = data.get('allowEditsAfterSubmit') === 'on';
		const briefCategories = parseCategoriesFromFormData(data);

		const workspace = await ensureBriefWorkspace(locals.db);

		if (!clientId) {
			return fail(400, { error: 'Client is required.' });
		}

		const [client] = await locals.db
			.select()
			.from(clients)
			.where(eq(clients.id, clientId))
			.limit(1);

		if (!client) {
			return fail(400, { error: 'Invalid client.' });
		}

		const categoryError = validateBriefCategories(briefCategories, workspace.categories);
		if (categoryError) return fail(400, { error: categoryError });

		const pin = generatePin();
		const { hash, salt } = await hashPin(pin);

		const [assignment] = await locals.db
			.insert(assignments)
			.values({
				clientId,
				questionSetId: workspace.id,
				pinHash: hash,
				pinSalt: salt,
				pinMustChange: true,
				invitationPin: pin,
				allowEditsAfterSubmit,
				categories: briefCategories
			})
			.returning({ id: assignments.id });

		await locals.db.insert(responses).values({
			assignmentId: assignment.id,
			answers: {},
			status: 'draft'
		});

		const categoriesLabel = formatCategoryList(briefCategories, workspace.categories);

		return {
			success: true,
			assignmentId: assignment.id,
			pin,
			clientEmail: client.email,
			briefCategories: categoriesLabel,
			portalUrl: getPortalUrl()
		};
	}
};
