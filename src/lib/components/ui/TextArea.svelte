<script lang="ts">
	/** Multi-line field with a floating label. */
	let {
		label = '',
		labelText = '',
		id,
		value = $bindable(''),
		helperText = '',
		error = '',
		required = false,
		class: className = '',
		...rest
	}: {
		label?: string;
		labelText?: string;
		id?: string;
		value?: string;
		helperText?: string;
		error?: string;
		required?: boolean;
		class?: string;
		[key: string]: unknown;
	} = $props();

	const resolvedLabel = $derived(labelText || label);
	// Every control gets an id so its label is always programmatically attached (WCAG 1.3.1 / 4.1.2).
	const fallbackId = $props.id();
	const inputId = $derived(id ?? (typeof rest.name === 'string' ? rest.name : `field-${fallbackId}`));
	const hintId = $derived(inputId ? `${inputId}-hint` : undefined);
	const placeholder = $derived(
		typeof rest.placeholder === 'string' && rest.placeholder ? rest.placeholder : ' '
	);
</script>

<div class="field-group {className}">
	<div class="float-field" class:float-field--bare={!resolvedLabel}>
		<textarea
			{...rest}
			class="field"
			class:field-invalid={!!error}
			id={inputId}
			{required}
			placeholder={resolvedLabel ? placeholder : (rest.placeholder as string | undefined)}
			aria-invalid={error ? 'true' : undefined}
			aria-describedby={error || helperText ? hintId : undefined}
			bind:value
		></textarea>
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
