import { and, eq, ne } from 'drizzle-orm';
import type { Database } from '$lib/server/db';
import { clients } from '$lib/server/db/schema';
import { normalizeEmail } from '$lib/utils';

export const CLIENT_EMAIL_TAKEN_MESSAGE =
	'This email already has portal access. Sign in with the PIN you set, or use Forgot PIN to get a new temporary one.';

export async function findClientByEmail(db: Database, email: string) {
	const normalized = normalizeEmail(email);
	if (!normalized) return null;

	const [row] = await db
		.select()
		.from(clients)
		.where(eq(clients.email, normalized))
		.limit(1);

	return row ?? null;
}

export async function isClientEmailTaken(
	db: Database,
	email: string,
	excludeClientId?: string
) {
	const normalized = normalizeEmail(email);
	if (!normalized) return false;

	const conditions = excludeClientId
		? and(eq(clients.email, normalized), ne(clients.id, excludeClientId))
		: eq(clients.email, normalized);

	const [row] = await db.select({ id: clients.id }).from(clients).where(conditions).limit(1);
	return Boolean(row);
}
