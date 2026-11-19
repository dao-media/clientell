<script lang="ts">
	import { normalizePinInput } from '$lib/utils/pin';
	import { analyzePinValue, authDebug } from '$lib/debug/auth-debug';

	let {
		id,
		name,
		value = $bindable(''),
		label = '',
		error = '',
		class: className = ''
	}: {
		id: string;
		name: string;
		value?: string;
		/** Visible label, rendered inside the field. */
		label?: string;
		error?: string;
		class?: string;
	} = $props();

	let display = $state('');
	let hiddenInput = $state<HTMLInputElement | null>(null);

	function syncPin(raw: string, source: string) {
		const normalized = normalizePinInput(raw);
		display = normalized;
		value = normalized;
		if (hiddenInput) {
			hiddenInput.value = normalized;
		}
		authDebug('pin-field-sync', {
			id,
			name,
			source,
			before: analyzePinValue(raw),
			after: analyzePinValue(normalized)
		});
	}

	$effect(() => {
		if (value !== display) {
			syncPin(value, 'external');
		}
	});

	function onInput(event: Event) {
		syncPin((event.currentTarget as HTMLInputElement).value, 'input');
	}

	function onPaste(event: ClipboardEvent) {
		event.preventDefault();
		const pasted = event.clipboardData?.getData('text') ?? '';
		authDebug('pin-field-paste', { id, name, pasted: analyzePinValue(pasted) });
		syncPin(pasted, 'paste');
	}

	function onChange(event: Event) {
		syncPin((event.currentTarget as HTMLInputElement).value, 'change');
	}

	function onBlur(event: Event) {
		syncPin((event.currentTarget as HTMLInputElement).value, 'blur');
	}

	function onInvalid(event: Event) {
		event.preventDefault();
	}
</script>

<!-- Hidden field carries the POST value; visible field is display-only (no name = no browser format checks). -->
<input type="hidden" {name} bind:this={hiddenInput} bind:value />

<div class="float-field" class:float-field--bare={!label}>
	<input
		class="field pin-input {className}"
		{id}
		type="tel"
		inputmode="numeric"
		autocomplete="one-time-code"
		autocapitalize="off"
		autocorrect="off"
		spellcheck="false"
		enterkeyhint="done"
		maxlength={6}
		placeholder=" "
		aria-invalid={error ? 'true' : undefined}
		data-auth-pin="true"
		data-auth-pin-name={name}
		value={display}
		oninput={onInput}
		onchange={onChange}
		onblur={onBlur}
		onpaste={onPaste}
		oninvalid={onInvalid}
	/>
	{#if label}
		<label class="float-field__label" for={id}>{label}</label>
	{/if}
</div>

<style>
	.pin-input {
		font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
		letter-spacing: 0.3em;
	}
</style>
