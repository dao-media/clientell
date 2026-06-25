<script lang="ts">
	import { normalizePinInput } from '$lib/utils/pin';
	import { analyzePinValue, authDebug } from '$lib/debug/auth-debug';

	let {
		id,
		name,
		value = $bindable(''),
		autocomplete = 'off' as HTMLInputElement['autocomplete'],
		class: className = ''
	}: {
		id: string;
		name: string;
		value?: string;
		autocomplete?: HTMLInputElement['autocomplete'];
		class?: string;
	} = $props();

	function syncInput(input: HTMLInputElement, source: string) {
		const before = analyzePinValue(input.value);
		const normalized = normalizePinInput(input.value);
		if (normalized !== input.value) {
			input.value = normalized;
		}
		value = normalized;
		authDebug('pin-field-sync', {
			id,
			name,
			source,
			before,
			after: analyzePinValue(normalized),
			validationMessage: input.validationMessage || null,
			willValidate: input.willValidate
		});
	}

	function onInput(event: Event) {
		syncInput(event.currentTarget as HTMLInputElement, 'input');
	}

	function onPaste(event: ClipboardEvent) {
		event.preventDefault();
		const input = event.currentTarget as HTMLInputElement;
		const pasted = event.clipboardData?.getData('text') ?? '';
		authDebug('pin-field-paste', { id, name, pasted: analyzePinValue(pasted) });
		input.value = normalizePinInput(pasted);
		value = input.value;
		syncInput(input, 'paste');
	}

	function onInvalid(event: Event) {
		event.preventDefault();
		const input = event.currentTarget as HTMLInputElement;
		authDebug('pin-field-invalid', {
			id,
			name,
			validationMessage: input.validationMessage,
			value: analyzePinValue(input.value),
			required: input.required,
			pattern: input.pattern || null,
			maxLength: input.maxLength
		});
		syncInput(input, 'invalid');
	}
</script>

<input
	class="field font-mono tracking-[0.3em] {className}"
	{id}
	{name}
	type="text"
	{autocomplete}
	enterkeyhint="done"
	autocapitalize="off"
	autocorrect="off"
	spellcheck="false"
	bind:value
	oninput={onInput}
	onpaste={onPaste}
	onchange={(event) => syncInput(event.currentTarget as HTMLInputElement, 'change')}
	oninvalid={onInvalid}
/>
