import type { Database } from '$lib/server/db';
import { findClientByEmail } from '$lib/server/clients-email';
import { sendForgotPinEmail } from '$lib/server/email/reminder';
import { resetClientPortalPin } from '$lib/server/auth/reset-client-pin';
import { authDebug, maskEmail } from '$lib/debug/auth-debug';
import { normalizeEmail } from '$lib/utils';

/** Issue a temporary PIN for all active briefs on this client and email it. */
export async function sendForgotPinForEmail(
	db: Database,
	platform: App.Platform | undefined,
	email: string
): Promise<{ sent: boolean }> {
	const normalized = normalizeEmail(email);
	authDebug('forgot-pin-start', { email: maskEmail(email), normalized: maskEmail(normalized) });

	if (!normalized) {
		authDebug('forgot-pin-aborted', { reason: 'empty-email' });
		return { sent: false };
	}

	const client = await findClientByEmail(db, normalized);
	if (!client) {
		authDebug('forgot-pin-no-client', { email: maskEmail(normalized) });
		return { sent: false };
	}

	const pin = await resetClientPortalPin(db, client.id);
	if (!pin) {
		authDebug('forgot-pin-reset-failed', { clientId: client.id });
		return { sent: false };
	}

	authDebug('forgot-pin-sending-email', {
		clientId: client.id,
		to: maskEmail(client.email),
		pinLength: pin.length
	});

	const result = await sendForgotPinEmail(platform, {
		to: client.email,
		contactName: client.contactName,
		loginEmail: client.email,
		pin
	});

	authDebug('forgot-pin-email-result', { clientId: client.id, ok: result.ok });

	return { sent: result.ok };
}
