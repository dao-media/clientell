import { loadSubmissionsPage } from '$lib/server/submissions-page';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async (event) => {
	return loadSubmissionsPage(event, 'all');
};
