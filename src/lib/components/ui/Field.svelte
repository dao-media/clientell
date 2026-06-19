<script lang="ts">
	let {
		label = '',
		labelText = '',
		id,
		value = $bindable(),
		error = '',
		invalidText = '',
		helperText = '',
		class: className = '',
		...rest
	}: {
		label?: string;
		labelText?: string;
		id?: string;
		value?: string;
		error?: string;
		invalidText?: string;
		helperText?: string;
		class?: string;
		[key: string]: unknown;
	} = $props();

	const resolvedLabel = $derived(labelText || label);
	const resolvedError = $derived(error || invalidText);
	const inputId = $derived(id ?? (typeof rest.name === 'string' ? rest.name : undefined));
</script>

<div class="field-group {className}">
	{#if resolvedLabel}
		<label class="label" for={inputId}>{resolvedLabel}</label>
	{/if}
	{#if value !== undefined}
		<input
			class="field"
			class:field-invalid={!!resolvedError}
			id={inputId}
			bind:value
			{...rest}
		/>
	{:else}
		<input class="field" class:field-invalid={!!resolvedError} id={inputId} {...rest} />
	{/if}
	{#if resolvedError}
		<p class="form-error">{resolvedError}</p>
	{:else if helperText}
		<p class="help">{helperText}</p>
	{/if}
</div>
