export type SubmissionsView = 'all' | 'unfinished' | 'completed';

export const SUBMISSION_STATUS_FILTERS = [
	{ view: 'all' as const, label: 'All', href: '/admin/submissions' },
	{ view: 'unfinished' as const, label: 'Pending', href: '/admin/submissions/unfinished' },
	{ view: 'completed' as const, label: 'Submitted', href: '/admin/submissions/completed' }
] as const;

export function submissionsHrefForView(
	view: SubmissionsView,
	params: { search?: string; clientId?: string; dateFrom?: string; dateTo?: string } = {}
): string {
	const base = SUBMISSION_STATUS_FILTERS.find((item) => item.view === view)?.href ?? '/admin/submissions';
	const query = new URLSearchParams();
	if (params.search?.trim()) query.set('q', params.search.trim());
	if (params.clientId) query.set('client', params.clientId);
	if (params.dateFrom) query.set('from', params.dateFrom);
	if (params.dateTo) query.set('to', params.dateTo);
	const qs = query.toString();
	return qs ? `${base}?${qs}` : base;
}

export function submissionsPageTitle(view: SubmissionsView): string {
	if (view === 'unfinished') return 'Pending submissions';
	if (view === 'completed') return 'Submitted submissions';
	return 'All submissions';
}

export function submissionNavActive(pathname: string, href: string): boolean {
	if (href === '/admin/submissions') {
		return (
			pathname === '/admin/submissions' ||
			(pathname.startsWith('/admin/submissions/') &&
				!pathname.startsWith('/admin/submissions/unfinished') &&
				!pathname.startsWith('/admin/submissions/completed'))
		);
	}

	return pathname === href || pathname.startsWith(`${href}/`);
}
