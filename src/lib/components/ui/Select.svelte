<script lang="ts">
	import type { Snippet } from 'svelte';

	type Option = { value: string; text: string };

	/** Select with its label inside the control. A select always shows a value, so the label stays raised. */
	let {
		label = '',
		labelText = '',
		id,
		value = $bindable(''),
		options,
		disabled = false,
		required = false,
		helperText = '',
		error = '',
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
		required?: boolean;
		helperText?: string;
		error?: string;
		class?: string;
		children?: Snippet;
		[key: string]: unknown;
	} = $props();

	const resolvedLabel = $derived(labelText || label);
	// Every control gets an id so its label is always programmatically attached (WCAG 1.3.1 / 4.1.2).
	const fallbackId = $props.id();
	const inputId = $derived(id ?? (typeof rest.name === 'string' ? rest.name : `field-${fallbackId}`));
	const hintId = $derived(inputId ? `${inputId}-hint` : undefined);
</script>

<div class="field-group {className}">
	<div class="float-field float-field--static" class:float-field--bare={!resolvedLabel}>
		<select
			{...rest}
			class="field"
			id={inputId}
			{disabled}
			{required}
			aria-invalid={error ? 'true' : undefined}
			aria-describedby={error || helperText ? hintId : undefined}
			bind:value
		>
			{#if options}
				{#each options as option (option.value)}
					<option value={option.value}>{option.text}</option>
				{/each}
			{:else if children}
				{@render children()}
			{/if}
		</select>
		{#if resolvedLabel}
			<label class="float-field__label" for={inputId}>
				{resolvedLabel}{#if required}<span class="float-field__required" aria-hidden="true">{' *'}</span>{/if}
			</label>
		{/if}
	</div>
	{#if error}
		<p class="form-error" id={hintId} role="alert">{error}</p>
	{:else if helperText}
		<p class="help" id={hintId}>{helperText}</p>
	{/if}
</div>
