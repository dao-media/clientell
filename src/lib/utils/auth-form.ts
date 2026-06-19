export function submitAuthFormOnEnter(
	event: KeyboardEvent,
	options: { focusPinOnEmail?: boolean } = {}
) {
	if (event.key !== 'Enter') return;
	if (!(event.currentTarget instanceof HTMLFormElement)) return;
	if (!(event.target instanceof HTMLInputElement)) return;

	if (options.focusPinOnEmail && event.target.name === 'email') {
		event.preventDefault();
		event.currentTarget.querySelector<HTMLInputElement>('input[name="pin"]')?.focus();
		return;
	}

	event.preventDefault();
	event.currentTarget.requestSubmit();
}
