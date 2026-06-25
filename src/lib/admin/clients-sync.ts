import { invalidate } from '$app/navigation';
import { adminDataKeys } from '$lib/admin/refresh-data';
import type { ClientListItem } from '$lib/admin/clients-list';

export type ClientListRow = Omit<ClientListItem, 'createdAt'> & { createdAt: string | Date };

export function normalizeClients(rows: ClientListRow[]): ClientListItem[] {
	return rows.map((client) => ({
		...client,
		createdAt:
			client.createdAt instanceof Date ? client.createdAt : new Date(client.createdAt)
	}));
}

export function clientsFromActionData(data: unknown): ClientListItem[] | null {
	if (!data || typeof data !== 'object' || !('clients' in data)) return null;
	const rows = (data as { clients?: unknown }).clients;
	return Array.isArray(rows) ? normalizeClients(rows as ClientListRow[]) : null;
}

/** Reload server data for the clients page and related admin views. */
export async function reloadClientsPageData() {
	await Promise.all([
		invalidate(adminDataKeys.clients),
		invalidate(adminDataKeys.dashboard),
		invalidate('/admin/clients'),
		invalidate('/admin/briefs/new'),
		invalidate('/admin/submissions'),
		invalidate('/admin/submissions/unfinished'),
		invalidate('/admin/submissions/completed')
	]);
}
