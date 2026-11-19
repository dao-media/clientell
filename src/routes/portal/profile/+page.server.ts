import { error, fail } from '@sveltejs/kit';
import { eq } from 'drizzle-orm';
import { requireClient } from '$lib/server/auth/guard';
import { redirectClientIfPinChangeRequired } from '$lib/server/auth/portal-login';
import { assignments, clients } from '$lib/server/db/schema';
import { CLIENT_EMAIL_TAKEN_MESSAGE, isClientEmailTaken } from '$lib/server/clients-email';
import { formatUsPhoneInput } from '$lib/phone';
import { normalizeEmail } from '$lib/utils';
import type { Actions, PageServerLoad } from './$types';

async function loadClient(db: App.Locals['db'], assignmentId: string) {
	const [row] = await db
		.select({ client: clients })
		.from(assignments)
		.innerJoin(clients, eq(assignments.clientId, clients.id))
		.where(eq(assignments.id, assignmentId))
		.limit(1);
	return row?.client ?? null;
}

export const load: PageServerLoad = async ({ locals, setHeaders }) => {
	setHeaders({ 'cache-control': 'private, no-store' });
	const session = requireClient(locals);
	await redirectClientIfPinChangeRequired(locals.db, session.assignmentId);
	const client = await loadClient(locals.db, session.assignmentId);
	if (!client) error(404, 'This account is unavailable.');
	return {
		profile: {
			company: client.company,
			legalName: client.legalName ?? '',
			contactName: client.contactName,
			email: client.email,
			phone: client.phone ?? ''
		}
	};
};

export const actions: Actions = {
	default: async ({ request, locals }) => {
		const session = requireClient(locals);
		const client = await loadClient(locals.db, session.assignmentId);
		if (!client) return fail(404, { error: 'This account is unavailable.' });

		const data = await request.formData();
		const company = String(data.get('company') ?? '').trim();
		const legalName = String(data.get('legalName') ?? '').trim();
		const contactName = String(data.get('contactName') ?? '').trim();
		const email = normalizeEmail(String(data.get('email') ?? ''));
		const phoneRaw = String(data.get('phone') ?? '').trim();
		const values = { company, legalName, contactName, email, phone: phoneRaw };

		if (!company || !contactName || !email) {
			return fail(400, { values, error: 'Company, contact name, and email are required.' });
		}
		if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
			return fail(400, { values, error: 'Enter a valid email address.' });
		}
		if (await isClientEmailTaken(locals.db, email, client.id)) {
			return fail(409, { values, error: CLIENT_EMAIL_TAKEN_MESSAGE });
		}

		await locals.db
			.update(clients)
			.set({
				company,
				legalName: legalName || null,
				contactName,
				email,
				phone: phoneRaw ? formatUsPhoneInput(phoneRaw) : null
			})
			.where(eq(clients.id, client.id));

		return { saved: true, emailChanged: email !== client.email };
	}
};
