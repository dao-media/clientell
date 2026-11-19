import { fail, redirect } from '@sveltejs/kit';
import { env } from '$env/dynamic/private';
import {
	createAdminProfile,
	hasAdminProfile,
	MIN_ADMIN_PASSWORD_LENGTH,
	parseAdminProfileForm
} from '$lib/server/admin-profile';
import { isSandboxMode } from '$lib/server/sandbox/mode';
import type { Actions, PageServerLoad } from './$types';
import { base } from '$app/paths';

/**
 * On a real deployment with ADMIN_PASSWORD set, that value acts as a one-time setup key so a
 * stranger can't claim the admin account on a fresh install. The sandbox skips it.
 */
function setupKeyRequired(platformEnv?: Partial<Env> | null): boolean {
	return !isSandboxMode(platformEnv) && Boolean(env.ADMIN_PASSWORD?.trim());
}

export const load: PageServerLoad = async ({ locals, platform }) => {
	if (await hasAdminProfile(locals.db)) redirect(303, `${base}/?panel=admin`);
	return {
		setupKeyRequired: setupKeyRequired(platform?.env),
		minPasswordLength: MIN_ADMIN_PASSWORD_LENGTH
	};
};

export const actions: Actions = {
	default: async ({ request, locals, platform }) => {
		if (await hasAdminProfile(locals.db)) redirect(303, `${base}/?panel=admin`);

		const data = await request.formData();
		const values = Object.fromEntries(
			['email', 'firstName', 'lastName', 'businessName', 'phone', 'website'].map((key) => [
				key,
				String(data.get(key) ?? '')
			])
		);
		const socialLinks = data.getAll('socialUrl').map((url, i) => ({
			label: String(data.getAll('socialLabel')[i] ?? ''),
			url: String(url)
		}));

		if (setupKeyRequired(platform?.env)) {
			const key = String(data.get('setupKey') ?? '').trim();
			if (key !== env.ADMIN_PASSWORD?.trim()) {
				return fail(400, {
					values,
					socialLinks,
					errors: { setupKey: 'Setup key does not match ADMIN_PASSWORD.' } as Record<string, string>
				});
			}
		}

		const parsed = parseAdminProfileForm(data);
		if (!parsed.ok) return fail(400, { values, socialLinks, errors: parsed.errors });

		await createAdminProfile(locals.db, parsed.value);
		redirect(303, `${base}/?panel=admin&setup=done`);
	}
};
