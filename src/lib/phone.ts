/** Strip to at most 10 US national digits, dropping a leading country code 1. */
export function usPhoneDigits(value: string): string {
	const digits = value.replace(/\D/g, '');

	if (digits.length === 11 && digits.startsWith('1')) {
		return digits.slice(1, 11);
	}

	return digits.slice(0, 10);
}

/** Format partial or complete input as (555) 555-5555 while typing. */
export function formatUsPhoneInput(value: string): string {
	const digits = usPhoneDigits(value);

	if (digits.length === 0) return '';
	if (digits.length <= 3) return `(${digits}`;
	if (digits.length <= 6) return `(${digits.slice(0, 3)}) ${digits.slice(3)}`;
	return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
}

/** Format stored phone values for display (handles raw digits or prior formatting). */
export function formatUsPhoneDisplay(value: string | null | undefined): string {
	if (!value) return '';
	return formatUsPhoneInput(value);
}
