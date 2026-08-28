import { error, json } from '@sveltejs/kit';
import { listClientContracts } from '$lib/server/contract/store';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ locals, params }) => {
	if (!locals.admin) error(401, 'Unauthorized');

	const rows = await listClientContracts(locals.db, params.id);

	return json(
		rows.map((row) => ({
			id: row.id,
			projectName: row.projectName,
			status: row.status,
			createdAt: row.createdAt.toISOString(),
			sentAt: row.sentAt?.toISOString() ?? null
		}))
	);
};
