import { redirect } from '@sveltejs/kit';
import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = async ({ locals, url }) => {
	if (url.pathname === '/admin/login') {
		if (locals.admin) redirect(303, '/admin');
		return {};
	}

	if (!locals.admin) {
		redirect(303, '/admin/login');
	}

	return {};
};
