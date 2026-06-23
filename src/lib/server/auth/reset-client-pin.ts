import { and, eq } from 'drizzle-orm';
import { generatePin, hashPin } from '$lib/server/auth/pin';
import type { Database } from '$lib/server/db';
import { assignments } from '$lib/server/db/schema';

/** Reset portal PIN for every active brief on a client. Returns the new temporary PIN. */
export async function resetClientPortalPin(
	db: Database,
	clientId: string
): Promise<string | null> {
	const activeAssignments = await db
		.select({ id: assignments.id })
		.from(assignments)
		.where(and(eq(assignments.clientId, clientId), eq(assignments.isActive, true)));

	if (activeAssignments.length === 0) return null;

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

	return pin;
}
