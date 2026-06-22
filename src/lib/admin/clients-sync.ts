import { fetchClientsList, type ClientListItem } from '$lib/admin/clients-list';
import { refreshAfterClientChange } from '$lib/admin/refresh-data';

function normalizeClients(
	rows: Array<Omit<ClientListItem, 'createdAt'> & { createdAt: string | Date }>
): ClientListItem[] {
	return rows.map((client) => ({
		...client,
		createdAt:
			client.createdAt instanceof Date ? client.createdAt : new Date(client.createdAt)
	}));
}

/** Load the authoritative client list from the database. */
export async function reloadClientsAfterSave(): Promise<ClientListItem[]> {
	return normalizeClients(await fetchClientsList());
}

/** Refresh other admin views that depend on the client list. */
export function notifyOtherAdminPagesClientChanged() {
	void refreshAfterClientChange();
}

export { normalizeClients };
