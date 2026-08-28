export type ContractListView = 'all' | 'draft' | 'sent' | 'signed';

export const CONTRACT_STATUS_FILTERS = [
	{ view: 'all' as const, label: 'All', href: '/admin/contracts' },
	{ view: 'draft' as const, label: 'Draft', href: '/admin/contracts?status=draft' },
	{ view: 'sent' as const, label: 'Sent', href: '/admin/contracts?status=sent' },
	{ view: 'signed' as const, label: 'Signed', href: '/admin/contracts?status=signed' }
] as const;

export function parseContractListView(value: string | null | undefined): ContractListView {
	return value === 'draft' || value === 'sent' || value === 'signed' ? value : 'all';
}

export function contractsHref(
	view: ContractListView,
	params: { search?: string; clientId?: string; dateFrom?: string; dateTo?: string } = {}
): string {
	const query = new URLSearchParams();
	if (view !== 'all') query.set('status', view);
	if (params.search?.trim()) query.set('q', params.search.trim());
	if (params.clientId) query.set('client', params.clientId);
	if (params.dateFrom) query.set('from', params.dateFrom);
	if (params.dateTo) query.set('to', params.dateTo);
	const qs = query.toString();
	return qs ? `/admin/contracts?${qs}` : '/admin/contracts';
}

export function contractNavActive(pathname: string, search: string, href: string): boolean {
	if (!pathname.startsWith('/admin/contracts')) return false;
	if (pathname !== '/admin/contracts' && !pathname.startsWith('/admin/contracts?')) {
		return href === '/admin/contracts';
	}
	const current = new URLSearchParams(search).get('status');
	const target = new URL(href, 'https://clientell.local').searchParams.get('status');
	return (current ?? null) === (target ?? null);
}
