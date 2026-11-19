import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { base } from '$app/paths';

export const load: PageServerLoad = ({ params }) => {
	redirect(301, `${base}/admin/submissions/${params.id}`);
};
