/** Shared auth-flow debug helpers (safe for client + server). Never log raw PINs. */

export const AUTH_DEBUG_PREFIX = '[briefly:auth]';

export type AuthDebugEntry = {
	ts: string;
	scope: string;
	data: Record<string, unknown>;
};

export type PinValueAnalysis = {
	rawLength: number;
	normalizedLength: number;
	trimmedLength: number;
	changed: boolean;
	valid: boolean;
	hasNonDigits: boolean;
	rawCharCodes: number[];
	normalizedPreview: string;
};

const MAX_CLIENT_LOG = 80;
const clientLog: AuthDebugEntry[] = [];

export function authDebug(scope: string, data: Record<string, unknown> = {}): AuthDebugEntry {
	const entry: AuthDebugEntry = {
		ts: new Date().toISOString(),
		scope,
		data
	};

	if (typeof console !== 'undefined') {
		console.warn(AUTH_DEBUG_PREFIX, scope, data);
	}

	if (typeof window !== 'undefined') {
		clientLog.push(entry);
		if (clientLog.length > MAX_CLIENT_LOG) {
			clientLog.shift();
		}
	}

	return entry;
}

export function getAuthDebugLog(): readonly AuthDebugEntry[] {
	return clientLog;
}

export function clearAuthDebugLog() {
	clientLog.length = 0;
}

export function analyzePinValue(raw: string): PinValueAnalysis {
	const normalized = raw.replace(/\D/g, '').slice(0, 6);
	const preview =
		normalized.length === 0
			? '(empty)'
			: normalized.length <= 2
				? '*'.repeat(normalized.length)
				: `${normalized.slice(0, 1)}${'*'.repeat(normalized.length - 2)}${normalized.slice(-1)}`;

	return {
		rawLength: raw.length,
		normalizedLength: normalized.length,
		trimmedLength: raw.trim().length,
		changed: raw !== normalized,
		valid: /^\d{6}$/.test(normalized),
		hasNonDigits: /\D/.test(raw),
		rawCharCodes: [...raw].slice(0, 16).map((char) => char.charCodeAt(0)),
		normalizedPreview: preview
	};
}

export function maskEmail(email: string): string {
	const trimmed = email.trim();
	const at = trimmed.indexOf('@');
	if (at <= 0) return '(invalid-email)';
	const local = trimmed.slice(0, at);
	const domain = trimmed.slice(at + 1);
	const visible = local.length <= 2 ? local.slice(0, 1) : local.slice(0, 2);
	return `${visible}***@${domain}`;
}

export function debugEnabledFromUrl(url: URL | undefined): boolean {
	return url?.searchParams.get('debug') === 'auth';
}

export function attachAuthFormDebug(form: HTMLFormElement, formId: string) {
	authDebug('form-attached', {
		formId,
		action: form.action,
		method: form.method,
		noValidate: form.noValidate
	});

	const onInvalid = (event: Event) => {
		const target = event.target;
		if (!(target instanceof HTMLInputElement)) return;

		const isPin = target.name === 'pin' || target.name === 'confirmPin';

		authDebug('browser-validation-blocked', {
			formId,
			field: target.name,
			inputType: target.type,
			validationMessage: target.validationMessage,
			valueLength: target.value.length,
			required: target.required,
			pattern: target.pattern || null,
			maxLength: target.maxLength,
			inputMode: target.inputMode || null,
			willValidate: target.willValidate,
			...(isPin ? { pin: analyzePinValue(target.value) } : {})
		});
	};

	const onSubmit = (event: Event) => {
		const formData = new FormData(form);
		authDebug('form-submit-event', {
			formId,
			defaultPrevented: event.defaultPrevented,
			submitterType:
				event instanceof SubmitEvent
					? ((event.submitter as HTMLButtonElement | null)?.type ?? null)
					: null,
			email: maskEmail(String(formData.get('email') ?? '')),
			pin: analyzePinValue(String(formData.get('pin') ?? '')),
			confirmPin: analyzePinValue(String(formData.get('confirmPin') ?? ''))
		});
	};

	form.addEventListener('invalid', onInvalid, true);
	form.addEventListener('submit', onSubmit);

	return () => {
		form.removeEventListener('invalid', onInvalid, true);
		form.removeEventListener('submit', onSubmit);
	};
}
