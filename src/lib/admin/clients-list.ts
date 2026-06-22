export type ClientListItem = {
	id: string;
	company: string;
	contactName: string;
	email: string;
	phone: string | null;
	services: string[];
	createdAt: Date;
};

function parseClientListItem(
	client: Omit<ClientListItem, 'createdAt'> & { createdAt: string | Date }
): ClientListItem {
	return {
		...client,
		createdAt: client.createdAt instanceof Date ? client.createdAt : new Date(client.createdAt)
	};
}

export async function fetchClientsList(): Promise<ClientListItem[]> {
	const response = await fetch(`/admin/clients/list?_=${Date.now()}`, {
		method: 'GET',
		credentials: 'same-origin',
		cache: 'no-store',
		headers: {
			accept: 'application/json',
			'cache-control': 'no-cache'
		}
	});

	if (!response.ok) {
		throw new Error('Could not load clients.');
	}

	const rows = (await response.json()) as Array<
		Omit<ClientListItem, 'createdAt'> & { createdAt: string | Date }
	>;

	return rows.map(parseClientListItem);
}
