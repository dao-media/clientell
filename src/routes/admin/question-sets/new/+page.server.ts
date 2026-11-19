import { redirect } from '@sveltejs/kit';
import { base } from '$app/paths';

export const load = () => {
	redirect(303, `${base}/admin/question-sets`);
};
