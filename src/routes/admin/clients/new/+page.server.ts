import { fail, redirect } from '@sveltejs/kit';
import { createClientId } from '$lib/ids';
import { clients } from '$lib/server/db/schema';
import { formatUsPhoneInput } from '$lib/phone';
import { normalizeEmail } from '$lib/utils';
import type { Actions } from './$types';

export const actions: Actions = {
	default: async ({ request, locals }) => {
		const data = await request.formData();
		const company = String(data.get('company') ?? '').trim();
		const contactName = String(data.get('contactName') ?? '').trim();
		const email = normalizeEmail(String(data.get('email') ?? ''));
		const phoneRaw = String(data.get('phone') ?? '').trim();
		const phone = phoneRaw ? formatUsPhoneInput(phoneRaw) : '';

		if (!company || !contactName || !email) {
			return fail(400, { error: 'Company, point of contact, and email are required.' });
		}

		await locals.db.insert(clients).values({
			id: createClientId(),
			company,
			contactName,
			email,
			phone: phone || null
		});
		redirect(303, '/admin/clients');
	}
};
