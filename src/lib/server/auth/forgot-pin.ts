import type { Database } from '$lib/server/db';
import { findClientByEmail } from '$lib/server/clients-email';
import { sendForgotPinEmail } from '$lib/server/email/reminder';
import { resetClientPortalPin } from '$lib/server/auth/reset-client-pin';
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

	const pin = await resetClientPortalPin(db, client.id);
	if (!pin) return { sent: false };

	const result = await sendForgotPinEmail(platform, {
		to: client.email,
		contactName: client.contactName,
		loginEmail: client.email,
		pin
	});

	return { sent: result.ok };
}
