/** Format integer cents as a USD string, e.g. 6500 → "$65.00". */
export function formatCents(cents: number | null | undefined): string {
	const value = Number.isFinite(cents) ? Number(cents) : 0;
	return new Intl.NumberFormat('en-US', {
		style: 'currency',
		currency: 'USD'
	}).format(value / 100);
}

/** Parse a dollar string or number into integer cents. Empty → 0. */
export function parseDollarsToCents(value: unknown): number {
	if (typeof value === 'number' && Number.isFinite(value)) {
		return Math.round(value * 100);
	}
	const raw = String(value ?? '')
		.trim()
		.replace(/[$,]/g, '');
	if (!raw) return 0;
	const parsed = Number.parseFloat(raw);
	if (!Number.isFinite(parsed)) return 0;
	return Math.round(parsed * 100);
}

export function centsToDollarInput(cents: number | null | undefined): string {
	const value = Number.isFinite(cents) ? Number(cents) : 0;
	return (value / 100).toFixed(2);
}

export function roundCents(value: number): number {
	return Math.round(value);
}
