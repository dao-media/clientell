import { error, redirect } from '@sveltejs/kit';
import { destroySandbox } from '$lib/server/sandbox/session';
import type { Actions, PageServerLoad } from './$types';
import { base } from '$app/paths';

export const load: PageServerLoad = async () => redirect(303, `${base}/`);

export const actions: Actions = {
	default: async (event) => {
		if (!event.locals.sandbox) error(404, 'Not found');
		await destroySandbox(event);
		redirect(303, `${base}/`);
	}
};
