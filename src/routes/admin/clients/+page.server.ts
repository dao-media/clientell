import { fail } from '@sveltejs/kit';
import { eq, inArray } from 'drizzle-orm';
import {
	mergeCategoryDefinitions,
	normalizeClientServiceIds,
	parseCategoriesFromFormData
} from '$lib/categories';
import { createClientId } from '$lib/ids';
import { CLIENT_EMAIL_TAKEN_MESSAGE, isClientEmailTaken } from '$lib/server/clients-email';
import { registerPageDataDepends } from '$lib/admin/refresh-data';
import { loadClientsPageData } from '$lib/server/clients-page';
import { clients, questionSets } from '$lib/server/db/schema';
import { formatUsPhoneInput } from '$lib/phone';
import { normalizeEmail } from '$lib/utils';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals, depends, url }) => {
	registerPageDataDepends(depends, url.pathname, 'briefly:clients', 'briefly:dashboard');
	return loadClientsPageData(locals.db);
};

async function clientsAfterMutation(locals: App.Locals) {
	const payload = await loadClientsPageData(locals.db);
	return {
		success: true as const,
		clients: payload.clients.map((client) => ({
			...client,
			createdAt: client.createdAt.toISOString()
		}))
	};
}

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

		if (await isClientEmailTaken(locals.db, email, clientId || undefined)) {
			return fail(409, {
				clientError: CLIENT_EMAIL_TAKEN_MESSAGE,
				emailTaken: true,
				email
			});
		}

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
				id: createClientId(),
				company,
				contactName,
				email,
				phone: phone || null,
				services
			});
		}

		return clientsAfterMutation(locals);
	},

	deleteClient: async ({ request, locals }) => {
		const data = await request.formData();
		const clientId = String(data.get('clientId') ?? '').trim();

		if (!clientId) {
			return fail(400, { deleteError: 'Missing client id.' });
		}

		await locals.db.delete(clients).where(eq(clients.id, clientId));

		return { ...(await clientsAfterMutation(locals)), deleted: true };
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

		return { ...(await clientsAfterMutation(locals)), deletedCount: clientIds.length };
	}
};
