<script lang="ts">
	import { normalizePinInput } from '$lib/utils/pin';

	let {
		id,
		name,
		value = $bindable(''),
		required = false,
		autocomplete = 'off',
		class: className = ''
	}: {
		id: string;
		name: string;
		value?: string;
		required?: boolean;
		autocomplete?: string;
		class?: string;
	} = $props();

	function syncInput(input: HTMLInputElement) {
		const normalized = normalizePinInput(input.value);
		if (normalized !== input.value) {
			input.value = normalized;
		}
		value = normalized;
	}

	function onInput(event: Event) {
		syncInput(event.currentTarget as HTMLInputElement);
	}

	function onPaste(event: ClipboardEvent) {
		event.preventDefault();
		const input = event.currentTarget as HTMLInputElement;
		const pasted = event.clipboardData?.getData('text') ?? '';
		input.value = normalizePinInput(pasted);
		value = input.value;
	}
</script>

<input
	class="field font-mono tracking-[0.3em] {className}"
	{id}
	{name}
	type="text"
	inputmode="numeric"
	autocomplete={autocomplete}
	maxlength="6"
	{required}
	bind:value
	oninput={onInput}
	onpaste={onPaste}
	onchange={(event) => syncInput(event.currentTarget as HTMLInputElement)}
/>
