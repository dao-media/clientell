<script lang="ts">
	let {
		label = '',
		labelText = '',
		id,
		value = $bindable(''),
		helperText = '',
		error = '',
		class: className = '',
		...rest
	}: {
		label?: string;
		labelText?: string;
		id?: string;
		value?: string;
		helperText?: string;
		error?: string;
		class?: string;
		[key: string]: unknown;
	} = $props();

	const resolvedLabel = $derived(labelText || label);
	const inputId = $derived(id ?? (typeof rest.name === 'string' ? rest.name : undefined));
</script>

<div class="field-group {className}">
	{#if resolvedLabel}
		<label class="label" for={inputId}>{resolvedLabel}</label>
	{/if}
	<textarea
		class="field min-h-[8rem] resize-y"
		class:field-invalid={!!error}
		id={inputId}
		bind:value
		{...rest}
	></textarea>
	{#if error}
		<p class="form-error">{error}</p>
	{:else if helperText}
		<p class="help">{helperText}</p>
	{/if}
</div>
