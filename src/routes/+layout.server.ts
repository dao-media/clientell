import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = async ({ locals }) => {
	return {
		auth: {
			admin: Boolean(locals.admin),
			client: Boolean(locals.client)
		}
	};
};
