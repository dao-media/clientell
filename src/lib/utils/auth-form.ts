import { applyAction, deserialize } from '$app/forms';
import { authDebug, maskEmail, analyzePinValue } from '$lib/debug/auth-debug';
import { normalizeEmail } from '$lib/utils';
import { isValidPin, normalizePinInput } from '$lib/utils/pin';

function resolveActionUrl(form: HTMLFormElement): URL {
	const actionAttr = form.getAttribute('action');
	if (actionAttr) {
		return new URL(actionAttr, window.location.href);
	}
	return new URL(form.action, window.location.href);
}

function readAuthFormData(form: HTMLFormElement): FormData {
	const emailInput = form.querySelector<HTMLInputElement>('input[name="email"]');
	const email = normalizeEmail(emailInput?.value ?? '');

	const pin = normalizePinInput(
		form.querySelector<HTMLInputElement>('input[name="pin"]')?.value ?? ''
	);
	const confirmPin = normalizePinInput(
		form.querySelector<HTMLInputElement>('input[name="confirmPin"]')?.value ?? ''
	);

	const duration =
		form.querySelector<HTMLSelectElement>('select[name="loginDuration"]')?.value ?? '';
	const password = form.querySelector<HTMLInputElement>('input[name="password"]')?.value ?? '';

	const body = new FormData();
	if (emailInput) body.set('email', email);
	if (form.querySelector('input[name="pin"]')) body.set('pin', pin);
	if (form.querySelector('input[name="confirmPin"]')) body.set('confirmPin', confirmPin);
	if (form.querySelector('select[name="loginDuration"]') && duration) {
		body.set('loginDuration', duration);
	}
	if (form.querySelector('input[name="password"]')) body.set('password', password);

	return body;
}

/** Normalize auth fields in the DOM (keeps hidden PIN + email inputs in sync). */
export function prepareAuthFormForSubmit(form: HTMLFormElement, formId = 'auth-form') {
	const before = {
		email: maskEmail(form.querySelector<HTMLInputElement>('input[name="email"]')?.value ?? ''),
		pin: analyzePinValue(form.querySelector<HTMLInputElement>('input[name="pin"]')?.value ?? ''),
		confirmPin: analyzePinValue(
			form.querySelector<HTMLInputElement>('input[name="confirmPin"]')?.value ?? ''
		)
	};

	const emailInput = form.querySelector<HTMLInputElement>('input[name="email"]');
	if (emailInput) {
		const raw = emailInput.value;
		emailInput.value = normalizeEmail(raw);
	}

	for (const pinInput of form.querySelectorAll<HTMLInputElement>(
		'input[name="pin"], input[name="confirmPin"]'
	)) {
		pinInput.value = normalizePinInput(pinInput.value);
	}

	authDebug('form-prepared', {
		formId,
		before,
		after: {
			email: maskEmail(form.querySelector<HTMLInputElement>('input[name="email"]')?.value ?? ''),
			pin: analyzePinValue(form.querySelector<HTMLInputElement>('input[name="pin"]')?.value ?? ''),
			confirmPin: analyzePinValue(
				form.querySelector<HTMLInputElement>('input[name="confirmPin"]')?.value ?? ''
			)
		}
	});
}

/** POST via fetch — never triggers native constraint validation. */
export async function submitAuthFormElement(form: HTMLFormElement, formId = 'auth-form') {
	form.noValidate = true;
	prepareAuthFormForSubmit(form, formId);

	const body = readAuthFormData(form);
	const action = resolveActionUrl(form);

	const hasPin = form.querySelector('input[name="pin"]') != null;
	const pin = String(body.get('pin') ?? '');
	if (hasPin && !isValidPin(pin)) {
		authDebug('client-pin-rejected', { formId, pin: analyzePinValue(pin) });
		const isHomePortal = action.search.includes('portalLogin');
		await applyAction({
			type: 'failure',
			status: 400,
			data: isHomePortal
				? { portalError: 'Enter a valid email and 6-digit PIN.' }
				: { error: 'Enter a 6-digit PIN.' }
		});
		return;
	}

	authDebug('form-submitting', {
		formId,
		via: 'fetch',
		action: action.href,
		email: maskEmail(String(body.get('email') ?? '')),
		pin: analyzePinValue(pin)
	});

	const response = await fetch(action, {
		method: 'POST',
		headers: {
			accept: 'application/json',
			'x-sveltekit-action': 'true'
		},
		body,
		cache: 'no-store'
	});

	const result = deserialize(await response.text());
	if (result.type === 'error') {
		result.status = response.status;
	}

	authDebug('form-submit-result', { formId, type: result.type, status: response.status });

	await applyAction(result);
}

export function submitAuthForm(event: SubmitEvent, formId = 'auth-form') {
	event.preventDefault();
	const form = event.currentTarget;
	if (!(form instanceof HTMLFormElement)) {
		authDebug('submit-aborted', { formId, reason: 'target-not-form' });
		return;
	}
	void submitAuthFormElement(form, formId);
}

export function submitAuthFormOnEnter(
	event: KeyboardEvent,
	options: { focusPinOnEmail?: boolean; formId?: string } = {}
) {
	if (event.key !== 'Enter') return;
	if (!(event.currentTarget instanceof HTMLFormElement)) return;
	if (!(event.target instanceof HTMLInputElement)) return;

	const formId = options.formId ?? 'auth-form';
	const form = event.currentTarget;

	if (options.focusPinOnEmail && event.target.name === 'email') {
		event.preventDefault();
		authDebug('enter-focus-pin', { formId });
		form.querySelector<HTMLInputElement>('[data-auth-pin]')?.focus();
		return;
	}

	event.preventDefault();
	authDebug('enter-submit', { formId, field: event.target.name || 'pin-display' });
	void submitAuthFormElement(form, formId);
}

export function bindAuthFormDebug(form: HTMLFormElement | null, formId: string) {
	if (!form) return;

	form.noValidate = true;

	for (const input of form.querySelectorAll('input, select, textarea')) {
		if (input instanceof HTMLInputElement || input instanceof HTMLSelectElement) {
			input.addEventListener('invalid', (event) => event.preventDefault());
		}
	}

	authDebug('form-attached', {
		formId,
		action: form.getAttribute('action') ?? form.action,
		method: form.method,
		noValidate: form.noValidate
	});

	return () => {};
}
