import { attachAuthFormDebug, authDebug, maskEmail, analyzePinValue } from '$lib/debug/auth-debug';
import { normalizeEmail } from '$lib/utils';
import { normalizePinInput } from '$lib/utils/pin';

/** Normalize auth fields before submit. */
export function prepareAuthFormForSubmit(form: HTMLFormElement, formId = 'auth-form') {
	const before = {
		email: maskEmail(String(new FormData(form).get('email') ?? '')),
		pin: analyzePinValue(String(new FormData(form).get('pin') ?? '')),
		confirmPin: analyzePinValue(String(new FormData(form).get('confirmPin') ?? ''))
	};

	const email = form.querySelector<HTMLInputElement>('input[name="email"]');
	if (email) {
		const raw = email.value;
		email.value = normalizeEmail(raw);
		if (raw !== email.value) {
			authDebug('email-normalized', { formId, before: maskEmail(raw), after: maskEmail(email.value) });
		}
	}

	for (const pinInput of form.querySelectorAll<HTMLInputElement>(
		'input[name="pin"], input[name="confirmPin"]'
	)) {
		const raw = pinInput.value;
		pinInput.value = normalizePinInput(raw);
		if (raw !== pinInput.value) {
			authDebug('pin-normalized', {
				formId,
				field: pinInput.name,
				before: analyzePinValue(raw),
				after: analyzePinValue(pinInput.value)
			});
		}
	}

	authDebug('form-prepared', {
		formId,
		before,
		after: {
			email: maskEmail(String(new FormData(form).get('email') ?? '')),
			pin: analyzePinValue(String(new FormData(form).get('pin') ?? '')),
			confirmPin: analyzePinValue(String(new FormData(form).get('confirmPin') ?? ''))
		}
	});
}

/** Submit without browser constraint validation (works around iOS ignoring novalidate). */
export function submitAuthForm(event: SubmitEvent, formId = 'auth-form') {
	event.preventDefault();
	const form = event.currentTarget;
	if (!(form instanceof HTMLFormElement)) {
		authDebug('submit-aborted', { formId, reason: 'target-not-form' });
		return;
	}

	prepareAuthFormForSubmit(form, formId);
	authDebug('form-submitting', { formId, action: form.action, method: form.method });
	form.submit();
}

export function submitAuthFormOnEnter(
	event: KeyboardEvent,
	options: { focusPinOnEmail?: boolean; formId?: string } = {}
) {
	if (event.key !== 'Enter') return;
	if (!(event.currentTarget instanceof HTMLFormElement)) return;
	if (!(event.target instanceof HTMLInputElement)) return;

	const formId = options.formId ?? 'auth-form';

	if (options.focusPinOnEmail && event.target.name === 'email') {
		event.preventDefault();
		authDebug('enter-focus-pin', { formId });
		event.currentTarget.querySelector<HTMLInputElement>('input[name="pin"]')?.focus();
		return;
	}

	event.preventDefault();
	authDebug('enter-submit', { formId, field: event.target.name });
	prepareAuthFormForSubmit(event.currentTarget, formId);
	event.currentTarget.submit();
}

export function bindAuthFormDebug(form: HTMLFormElement | null, formId: string) {
	if (!form) return;
	return attachAuthFormDebug(form, formId);
}
