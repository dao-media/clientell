import { fail } from '@sveltejs/kit';
import {
	getAdminProfile,
	MIN_ADMIN_PASSWORD_LENGTH,
	parseAdminProfileForm,
	toPublicProfile,
	updateAdminProfile,
	verifyAdminPassword
} from '$lib/server/admin-profile';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => ({
	profile: toPublicProfile(await getAdminProfile(locals.db)),
	minPasswordLength: MIN_ADMIN_PASSWORD_LENGTH
});

export const actions: Actions = {
	default: async ({ request, locals }) => {
		if (!locals.admin) return fail(401, { errors: { form: 'Sign in again.' } as Record<string, string> });
		const profile = await getAdminProfile(locals.db);
		if (!profile) return fail(400, { errors: { form: 'Finish admin setup first.' } as Record<string, string> });

		const data = await request.formData();
		const parsed = parseAdminProfileForm(data, { passwordOptional: true });
		if (!parsed.ok) return fail(400, { errors: parsed.errors });

		const newPassword = parsed.value.password;
		if (newPassword) {
			const current = String(data.get('currentPassword') ?? '');
			if (!(await verifyAdminPassword(locals.db, current))) {
				return fail(400, { errors: { currentPassword: 'Current password is incorrect.' } as Record<string, string> });
			}
		}

		await updateAdminProfile(locals.db, { ...parsed.value, newPassword: newPassword || undefined });
		return { saved: true, passwordChanged: Boolean(newPassword) };
	}
};
