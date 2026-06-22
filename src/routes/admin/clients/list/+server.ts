import { error, json } from '@sveltejs/kit';
import { loadClientsPageData } from '$lib/server/clients-page';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ locals }) => {
	if (!locals.admin) error(401, 'Unauthorized');

	const { clients } = await loadClientsPageData(locals.db);

	return json(clients, {
		headers: {
			'cache-control': 'private, no-store, must-revalidate'
		}
	});
};
