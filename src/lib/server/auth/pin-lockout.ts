import { eq } from 'drizzle-orm';
import type { Database } from '$lib/server/db';
import { assignments, clients } from '$lib/server/db/schema';

/** Wrong PINs allowed before a timed lockout (and again before a hard lock). */
export const MAX_PIN_ATTEMPTS = 3;
export const LOCKOUT_MS = 30 * 60 * 1000;
/** After a lockout ends, another MAX_PIN_ATTEMPTS failures inside this window hard-lock the account. */
export const STRIKE_WINDOW_MS = 24 * 60 * 60 * 1000;

export type LockoutClient = Pick<
	typeof clients.$inferSelect,
	'id' | 'failedPinAttempts' | 'pinLockoutUntil' | 'pinStrikeWindowUntil' | 'isLocked'
>;

export type LockoutState =
	| { kind: 'open'; attemptsLeft: number; onFinalStrike: boolean }
	| { kind: 'cooldown'; until: Date }
	| { kind: 'locked' };

export function lockoutState(client: LockoutClient, now = new Date()): LockoutState {
	if (client.isLocked) return { kind: 'locked' };
	if (client.pinLockoutUntil && client.pinLockoutUntil > now) {
		return { kind: 'cooldown', until: client.pinLockoutUntil };
	}
	const onFinalStrike = Boolean(client.pinStrikeWindowUntil && client.pinStrikeWindowUntil > now);
	return {
		kind: 'open',
		attemptsLeft: Math.max(0, MAX_PIN_ATTEMPTS - client.failedPinAttempts),
		onFinalStrike
	};
}

export function lockoutMessage(state: LockoutState, now = new Date()): string | null {
	if (state.kind === 'locked') {
		return 'This account is locked after repeated incorrect PINs. Contact your account admin to unlock it.';
	}
	if (state.kind === 'cooldown') {
		const minutes = Math.max(1, Math.ceil((state.until.getTime() - now.getTime()) / 60_000));
		return `Too many incorrect PINs. Try again in ${minutes} minute${minutes === 1 ? '' : 's'}.`;
	}
	return null;
}

export async function findLockoutClientByEmail(
	db: Database,
	email: string
): Promise<LockoutClient | null> {
	const [row] = await db
		.select({
			id: clients.id,
			failedPinAttempts: clients.failedPinAttempts,
			pinLockoutUntil: clients.pinLockoutUntil,
			pinStrikeWindowUntil: clients.pinStrikeWindowUntil,
			isLocked: clients.isLocked
		})
		.from(clients)
		.where(eq(clients.email, email))
		.limit(1);
	return row ?? null;
}

/**
 * Record a wrong PIN and return the resulting state.
 * 3 misses → 30-minute cooldown, then a 24h strike window opens when it ends.
 * 3 more misses inside that window → hard lock (admin must unlock).
 */
export async function registerFailedPin(
	db: Database,
	client: LockoutClient,
	now = new Date()
): Promise<LockoutState> {
	const strikeActive = Boolean(client.pinStrikeWindowUntil && client.pinStrikeWindowUntil > now);
	// A stale strike window (more than 24h since the last lockout ended) starts the cycle over.
	const priorFailures = strikeActive || !client.pinStrikeWindowUntil ? client.failedPinAttempts : 0;
	const failed = priorFailures + 1;

	if (failed < MAX_PIN_ATTEMPTS) {
		await db
			.update(clients)
			.set({
				failedPinAttempts: failed,
				...(strikeActive || !client.pinStrikeWindowUntil ? {} : { pinStrikeWindowUntil: null })
			})
			.where(eq(clients.id, client.id));
		return { kind: 'open', attemptsLeft: MAX_PIN_ATTEMPTS - failed, onFinalStrike: strikeActive };
	}

	if (strikeActive) {
		await db
			.update(clients)
			.set({ failedPinAttempts: failed, isLocked: true, lockedAt: now, pinLockoutUntil: null })
			.where(eq(clients.id, client.id));
		return { kind: 'locked' };
	}

	const until = new Date(now.getTime() + LOCKOUT_MS);
	await db
		.update(clients)
		.set({
			failedPinAttempts: 0,
			pinLockoutUntil: until,
			pinStrikeWindowUntil: new Date(until.getTime() + STRIKE_WINDOW_MS)
		})
		.where(eq(clients.id, client.id));
	return { kind: 'cooldown', until };
}

export async function clearPinFailures(db: Database, clientId: string) {
	await db
		.update(clients)
		.set({ failedPinAttempts: 0, pinLockoutUntil: null, pinStrikeWindowUntil: null })
		.where(eq(clients.id, clientId));
}

export async function setClientLocked(
	db: Database,
	clientId: string,
	locked: boolean,
	options: { forcePinReset?: boolean } = {}
) {
	await db
		.update(clients)
		.set(
			locked
				? { isLocked: true, lockedAt: new Date() }
				: {
						isLocked: false,
						lockedAt: null,
						failedPinAttempts: 0,
						pinLockoutUntil: null,
						pinStrikeWindowUntil: null
					}
		)
		.where(eq(clients.id, clientId));

	if (!locked && options.forcePinReset) {
		await db
			.update(assignments)
			.set({ pinMustChange: true })
			.where(eq(assignments.clientId, clientId));
	}
}
