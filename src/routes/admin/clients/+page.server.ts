import { fail } from '@sveltejs/kit';
import { eq, inArray } from 'drizzle-orm';
import { resetClientPortalPin } from '$lib/server/auth/reset-client-pin';
import { registerPageDataDepends } from '$lib/admin/refresh-data';
import { loadClientsPageData } from '$lib/server/clients-page';
import { clients } from '$lib/server/db/schema';
import {
	clientsPayloadAfterMutation,
	saveClientFromForm
} from '$lib/server/save-client-action';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals, depends, url }) => {
	registerPageDataDepends(depends, url.pathname, 'briefly:clients', 'briefly:dashboard');
	return loadClientsPageData(locals.db);
};

export const actions: Actions = {
	saveClient: saveClientFromForm,

	deleteClient: async ({ request, locals }) => {
		const data = await request.formData();
		const clientId = String(data.get('clientId') ?? '').trim();

		if (!clientId) {
			return fail(400, { deleteError: 'Missing client id.' });
		}

		await locals.db.delete(clients).where(eq(clients.id, clientId));

		return { ...(await clientsPayloadAfterMutation(locals)), deleted: true };
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

		return { ...(await clientsPayloadAfterMutation(locals)), deletedCount: clientIds.length };
	},

	resetClientPin: async ({ request, locals }) => {
		const data = await request.formData();
		const clientId = String(data.get('clientId') ?? '').trim();

		if (!clientId) {
			return fail(400, { resetPinError: 'Missing client id.' });
		}

		const pin = await resetClientPortalPin(locals.db, clientId);
		if (!pin) {
			return fail(400, {
				resetPinError: 'This client has no active briefs to reset the PIN for.'
			});
		}

		return { resetPin: pin };
	}
};
