import { and, eq } from 'drizzle-orm';
import { generatePin, hashPin } from '$lib/server/auth/pin';
import type { Database } from '$lib/server/db';
import { assignments, clients } from '$lib/server/db/schema';
import { findClientByEmail } from '$lib/server/clients-email';
import { sendForgotPinEmail } from '$lib/server/email/reminder';
import { normalizeEmail } from '$lib/utils';

/** Issue a temporary PIN for all active briefs on this client and email it. */
export async function sendForgotPinForEmail(
	db: Database,
	platform: App.Platform | undefined,
	email: string
): Promise<{ sent: boolean }> {
	const normalized = normalizeEmail(email);
	if (!normalized) return { sent: false };

	const client = await findClientByEmail(db, normalized);
	if (!client) return { sent: false };

	const activeAssignments = await db
		.select({ id: assignments.id })
		.from(assignments)
		.where(and(eq(assignments.clientId, client.id), eq(assignments.isActive, true)));

	if (activeAssignments.length === 0) return { sent: false };

	const pin = generatePin();
	const { hash, salt } = await hashPin(pin);

	for (const assignment of activeAssignments) {
		await db
			.update(assignments)
			.set({
				pinHash: hash,
				pinSalt: salt,
				pinMustChange: true,
				invitationPin: null
			})
			.where(eq(assignments.id, assignment.id));
	}

	const result = await sendForgotPinEmail(platform, {
		to: client.email,
		contactName: client.contactName,
		loginEmail: client.email,
		pin
	});

	return { sent: result.ok };
}
