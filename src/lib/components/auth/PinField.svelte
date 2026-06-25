<script lang="ts">
	import { normalizePinInput } from '$lib/utils/pin';
	import { analyzePinValue, authDebug } from '$lib/debug/auth-debug';

	let {
		id,
		name,
		value = $bindable(''),
		class: className = ''
	}: {
		id: string;
		name: string;
		value?: string;
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

	function onInvalid(event: Event) {
		event.preventDefault();
	}
</script>

<!-- Hidden field carries the POST value; visible field is display-only (no name = no browser format checks). -->
<input type="hidden" {name} bind:this={hiddenInput} value={value} />

<input
	class="field font-mono tracking-[0.3em] {className}"
	{id}
	type="text"
	autocomplete="off"
	autocapitalize="off"
	autocorrect="off"
	spellcheck="false"
	enterkeyhint="done"
	maxlength={6}
	data-auth-pin="true"
	value={display}
	oninput={onInput}
	onpaste={onPaste}
	oninvalid={onInvalid}
/>
