<script lang="ts">
	import type { Snippet } from 'svelte';

	type Option = { value: string; text: string };

	let {
		label = '',
		labelText = '',
		id,
		value = $bindable(''),
		options,
		disabled = false,
		class: className = '',
		children,
		...rest
	}: {
		label?: string;
		labelText?: string;
		id?: string;
		value?: string;
		options?: Option[];
		disabled?: boolean;
		class?: string;
		children?: Snippet;
		[key: string]: unknown;
	} = $props();

	const resolvedLabel = $derived(labelText || label);
	const inputId = $derived(id ?? (typeof rest.name === 'string' ? rest.name : undefined));
</script>

<div class="field-group {className}">
	{#if resolvedLabel}
		<label class="label" for={inputId}>{resolvedLabel}</label>
	{/if}
	<select class="field" id={inputId} bind:value {disabled} {...rest}>
		{#if options}
			{#each options as option (option.value)}
				<option value={option.value}>{option.text}</option>
			{/each}
		{:else if children}
			{@render children()}
		{/if}
	</select>
</div>
