import { eq } from 'drizzle-orm';
import { designerFromProfile, type DesignerIdentity } from '$lib/contract/designer';
import { hashPin, verifyPin } from '$lib/server/auth/pin';
import { getAdminPassword } from '$lib/server/auth/session';
import type { Database } from '$lib/server/db';
import { adminProfile, type SocialLink } from '$lib/server/db/schema';

export const ADMIN_PROFILE_ID = 'owner';
export const MIN_ADMIN_PASSWORD_LENGTH = 8;

export type AdminProfileRow = typeof adminProfile.$inferSelect;
export type PublicAdminProfile = Omit<AdminProfileRow, 'passwordHash' | 'passwordSalt'>;

export async function getAdminProfile(db: Database): Promise<AdminProfileRow | null> {
	const [row] = await db
		.select()
		.from(adminProfile)
		.where(eq(adminProfile.id, ADMIN_PROFILE_ID))
		.limit(1);
	return row ?? null;
}

export async function hasAdminProfile(db: Database): Promise<boolean> {
	return (await getAdminProfile(db)) !== null;
}

export function toPublicProfile(row: AdminProfileRow | null): PublicAdminProfile | null {
	if (!row) return null;
	const { passwordHash: _h, passwordSalt: _s, ...rest } = row;
	return rest;
}

export async function getDesignerIdentity(db: Database): Promise<DesignerIdentity> {
	return designerFromProfile(await getAdminProfile(db));
}

export type AdminProfileInput = {
	email: string;
	firstName: string;
	lastName: string;
	businessName: string;
	phone: string;
	website: string;
	socialLinks: SocialLink[];
	password: string;
};

export async function createAdminProfile(db: Database, input: AdminProfileInput) {
	const { hash, salt } = await hashPin(input.password);
	const now = new Date();
	await db.insert(adminProfile).values({
		id: ADMIN_PROFILE_ID,
		email: input.email,
		firstName: input.firstName,
		lastName: input.lastName,
		businessName: input.businessName,
		phone: input.phone || null,
		website: input.website || null,
		socialLinks: input.socialLinks,
		passwordHash: hash,
		passwordSalt: salt,
		createdAt: now,
		updatedAt: now
	});
}

/**
 * Admin password check. Once an admin profile exists its password is authoritative;
 * before onboarding, the legacy ADMIN_PASSWORD env value still works.
 */
export async function verifyAdminPassword(db: Database, password: string): Promise<boolean> {
	if (!password) return false;
	const profile = await getAdminProfile(db);
	if (profile) return verifyPin(password, profile.passwordHash, profile.passwordSalt);
	return password === getAdminPassword();
}

function normalizeUrl(value: string): string {
	const trimmed = value.trim();
	if (!trimmed) return '';
	return /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
}

export function parseAdminProfileForm(data: FormData, options: { passwordOptional?: boolean } = {}):
	| { ok: true; value: AdminProfileInput }
	| { ok: false; errors: Record<string, string> } {
	const get = (key: string) => String(data.get(key) ?? '').trim();
	const errors: Record<string, string> = {};

	const email = get('email').toLowerCase();
	const firstName = get('firstName');
	const lastName = get('lastName');
	const businessName = get('businessName');
	const phone = get('phone');
	const website = normalizeUrl(get('website'));
	const password = String(data.get('password') ?? '');
	const confirm = String(data.get('passwordConfirm') ?? '');

	if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errors.email = 'Enter a valid email.';
	if (!firstName) errors.firstName = 'First name is required.';
	if (!lastName) errors.lastName = 'Last name is required.';
	if (!businessName) errors.businessName = 'Business / brand name is required.';
	if (options.passwordOptional && !password && !confirm) {
		// keep existing password
	} else if (password.length < MIN_ADMIN_PASSWORD_LENGTH)
		errors.password = `Use at least ${MIN_ADMIN_PASSWORD_LENGTH} characters.`;
	else if (password !== confirm) errors.passwordConfirm = 'Passwords do not match.';

	const labels = data.getAll('socialLabel').map((v) => String(v).trim());
	const urls = data.getAll('socialUrl').map((v) => String(v).trim());
	const socialLinks: SocialLink[] = urls
		.map((url, i) => ({ label: labels[i] ?? '', url: normalizeUrl(url) }))
		.filter((link) => link.url);

	if (Object.keys(errors).length > 0) return { ok: false, errors };
	return {
		ok: true,
		value: { email, firstName, lastName, businessName, phone, website, socialLinks, password }
	};
}

export async function updateAdminProfile(
	db: Database,
	input: Omit<AdminProfileInput, 'password'> & { newPassword?: string }
) {
	const patch: Partial<typeof adminProfile.$inferInsert> = {
		email: input.email,
		firstName: input.firstName,
		lastName: input.lastName,
		businessName: input.businessName,
		phone: input.phone || null,
		website: input.website || null,
		socialLinks: input.socialLinks,
		updatedAt: new Date()
	};
	if (input.newPassword) {
		const { hash, salt } = await hashPin(input.newPassword);
		patch.passwordHash = hash;
		patch.passwordSalt = salt;
	}
	await db.update(adminProfile).set(patch).where(eq(adminProfile.id, ADMIN_PROFILE_ID));
}

/** Who client emails come from / point to. Built from the admin profile. */
export type EmailOwner = {
	/** First name used in copy, e.g. "email Jane at …". */
	firstName: string;
	/** Full display name for the sign-off. */
	displayName: string;
	/** Business / brand / DBA. */
	business: string;
	/** Address clients are told to contact for help. */
	supportEmail: string;
	/** False until onboarding is done (legacy fallback values). */
	fromProfile: boolean;
};

/** Legacy owner used only until onboarding is completed (matches the contract fallback). */
const LEGACY_EMAIL_OWNER: EmailOwner = {
	firstName: 'Dane',
	displayName: "Dane O'Leary",
	business: "Dane O'Leary Media",
	supportEmail: 'hello@daneoleary.com',
	fromProfile: false
};

export async function getEmailOwner(db: Database): Promise<EmailOwner> {
	const profile = await getAdminProfile(db);
	if (!profile) return LEGACY_EMAIL_OWNER;
	return {
		firstName: profile.firstName,
		displayName: `${profile.firstName} ${profile.lastName}`.trim(),
		business: profile.businessName,
		supportEmail: profile.email,
		fromProfile: true
	};
}
