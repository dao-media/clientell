import { fail } from '@sveltejs/kit';
import { desc, eq, inArray } from 'drizzle-orm';
import {
	mergeCategoryDefinitions,
	normalizeClientServiceIds,
	parseCategoriesFromFormData
} from '$lib/categories';
import { clients, questionSets } from '$lib/server/db/schema';
import { formatUsPhoneInput } from '$lib/phone';
import { normalizeEmail } from '$lib/utils';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals, depends }) => {
	depends('briefly:clients');
	depends('briefly:dashboard');

	const [clientRows, setRows] = await Promise.all([
		locals.db.select().from(clients).orderBy(desc(clients.createdAt)),
		locals.db.select({ categories: questionSets.categories }).from(questionSets)
	]);

	const serviceOptions = mergeCategoryDefinitions(setRows.map((set) => set.categories));

	return {
		serviceOptions,
		clients: clientRows.map((client) => ({
			...client,
			services: normalizeClientServiceIds(client.services ?? [], serviceOptions)
		}))
	};
};

export const actions: Actions = {
	saveClient: async ({ request, locals }) => {
		const data = await request.formData();
		const clientId = String(data.get('clientId') ?? '').trim();
		const company = String(data.get('company') ?? '').trim();
		const contactName = String(data.get('contactName') ?? '').trim();
		const email = normalizeEmail(String(data.get('email') ?? ''));
		const phoneRaw = String(data.get('phone') ?? '').trim();
		const phone = phoneRaw ? formatUsPhoneInput(phoneRaw) : '';
		const selectedServices = parseCategoriesFromFormData(data, 'services');

		if (!company || !contactName || !email) {
			return fail(400, { clientError: 'Company, point of contact, and email are required.' });
		}

		const setRows = await locals.db.select({ categories: questionSets.categories }).from(questionSets);
		const serviceOptions = mergeCategoryDefinitions(setRows.map((set) => set.categories));
		const services = normalizeClientServiceIds(selectedServices, serviceOptions);

		if (clientId) {
			await locals.db
				.update(clients)
				.set({
					company,
					contactName,
					email,
					phone: phone || null,
					services
				})
				.where(eq(clients.id, clientId));
		} else {
			await locals.db.insert(clients).values({
				company,
				contactName,
				email,
				phone: phone || null,
				services
			});
		}

		return { success: true };
	},

	deleteClient: async ({ request, locals }) => {
		const data = await request.formData();
		const clientId = String(data.get('clientId') ?? '').trim();

		if (!clientId) {
			return fail(400, { deleteError: 'Missing client id.' });
		}

		await locals.db.delete(clients).where(eq(clients.id, clientId));

		return { success: true, deleted: true };
	},

	bulkDeleteClients: async ({ request, locals }) => {
		const data = await request.formData();
		const clientIds = data
			.getAll('clientIds')
			.map((value) => String(value).trim())
			.filter(Boolean);

		if (clientIds.length === 0) {
			return fail(400, { bulkDeleteError: 'Select at least one client.' });
		}

		await locals.db.delete(clients).where(inArray(clients.id, clientIds));

		return { success: true, deletedCount: clientIds.length };
	}
};
