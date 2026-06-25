import { analyzePinValue, authDebug } from '$lib/debug/auth-debug';

/** Strip non-digits and cap at six characters for portal PIN fields. */
export function normalizePinInput(value: string, debugContext?: string): string {
	const normalized = value.replace(/\D/g, '').slice(0, 6);
	if (debugContext && value !== normalized) {
		authDebug('normalize-pin-input', {
			context: debugContext,
			before: analyzePinValue(value),
			after: analyzePinValue(normalized)
		});
	}
	return normalized;
}

export function isValidPin(value: string): boolean {
	return /^\d{6}$/.test(normalizePinInput(value));
}
