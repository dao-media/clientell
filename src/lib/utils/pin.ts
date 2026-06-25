/** Strip non-digits and cap at six characters for portal PIN fields. */
export function normalizePinInput(value: string): string {
	return value.replace(/\D/g, '').slice(0, 6);
}

export function isValidPin(value: string): boolean {
	return /^\d{6}$/.test(normalizePinInput(value));
}
