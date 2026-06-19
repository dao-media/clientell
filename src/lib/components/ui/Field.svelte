<script lang="ts">
	import { formatUsPhoneInput } from '$lib/phone';

	let {
		label = '',
		labelText = '',
		id,
		value = $bindable(),
		error = '',
		invalidText = '',
		helperText = '',
		class: className = '',
		type,
		oninput,
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
		type?: string;
		oninput?: (event: Event & { currentTarget: HTMLInputElement }) => void;
		[key: string]: unknown;
	} = $props();

	const resolvedLabel = $derived(labelText || label);
	const resolvedError = $derived(error || invalidText);
	const inputId = $derived(id ?? (typeof rest.name === 'string' ? rest.name : undefined));
	const isPhone = $derived(type === 'tel');

	function handlePhoneInput(event: Event & { currentTarget: HTMLInputElement }) {
		const formatted = formatUsPhoneInput(event.currentTarget.value);
		event.currentTarget.value = formatted;
		if (value !== undefined) {
			value = formatted;
		}
		oninput?.(event);
	}

	function handleInput(event: Event & { currentTarget: HTMLInputElement }) {
		oninput?.(event);
	}
</script>

<div class="field-group {className}">
	{#if resolvedLabel}
		<label class="label" for={inputId}>{resolvedLabel}</label>
	{/if}
	{#if value !== undefined}
		{#if isPhone}
			<input
				class="field"
				class:field-invalid={!!resolvedError}
				id={inputId}
				type="tel"
				inputmode="numeric"
				autocomplete="tel"
				{value}
				oninput={handlePhoneInput}
				{...rest}
			/>
		{:else}
			<input
				class="field"
				class:field-invalid={!!resolvedError}
				id={inputId}
				{type}
				bind:value
				oninput={handleInput}
				{...rest}
			/>
		{/if}
	{:else if isPhone}
		<input
			class="field"
			class:field-invalid={!!resolvedError}
			id={inputId}
			type="tel"
			inputmode="numeric"
			autocomplete="tel"
			oninput={handlePhoneInput}
			{...rest}
		/>
	{:else}
		<input
			class="field"
			class:field-invalid={!!resolvedError}
			id={inputId}
			{type}
			oninput={handleInput}
			{...rest}
		/>
	{/if}
	{#if resolvedError}
		<p class="form-error">{resolvedError}</p>
	{:else if helperText}
		<p class="help">{helperText}</p>
	{/if}
</div>
