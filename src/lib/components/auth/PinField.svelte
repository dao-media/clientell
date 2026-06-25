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
</script>

<input
	class="field font-mono tracking-[0.3em] {className}"
	{id}
	{name}
	type="text"
	inputmode="numeric"
	{autocomplete}
	maxlength="6"
	{required}
	bind:value
	oninput={onInput}
/>
