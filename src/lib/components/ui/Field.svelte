<script lang="ts">
	import { formatUsPhoneInput } from '$lib/phone';

	/**
	 * Text input with a floating label (label sits inside the field, rises on focus/value).
	 * Hints and errors are linked with aria-describedby; errors set aria-invalid.
	 */
	let {
		label = '',
		labelText = '',
		id,
		value = $bindable(),
		error = '',
		invalidText = '',
		helperText = '',
		class: className = '',
		type = 'text',
		required = false,
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
		required?: boolean;
		oninput?: (event: Event & { currentTarget: HTMLInputElement }) => void;
		[key: string]: unknown;
	} = $props();

	/** Native widgets that always show their own text (dd/mm/yyyy etc.), so the label stays raised. */
	const STATIC_TYPES = new Set(['date', 'datetime-local', 'time', 'month', 'week', 'color', 'file']);

	const resolvedLabel = $derived(labelText || label);
	const resolvedError = $derived(error || invalidText);
	// Every control gets an id so its label is always programmatically attached (WCAG 1.3.1 / 4.1.2).
	const fallbackId = $props.id();
	const inputId = $derived(id ?? (typeof rest.name === 'string' ? rest.name : `field-${fallbackId}`));
	const hintId = $derived(inputId ? `${inputId}-hint` : undefined);
	const describedBy = $derived(
		[rest['aria-describedby'], resolvedError || helperText ? hintId : null].filter(Boolean).join(' ') ||
			undefined
	);
	const isPhone = $derived(type === 'tel');
	const placeholder = $derived(
		typeof rest.placeholder === 'string' && rest.placeholder ? rest.placeholder : ' '
	);

	function handleInput(event: Event & { currentTarget: HTMLInputElement }) {
		if (isPhone) {
			const formatted = formatUsPhoneInput(event.currentTarget.value);
			event.currentTarget.value = formatted;
			value = formatted;
		}
		oninput?.(event);
	}
</script>

<div class="field-group {className}">
	<div
		class="float-field"
		class:float-field--static={STATIC_TYPES.has(type)}
		class:float-field--bare={!resolvedLabel}
	>
		<input
			{...rest}
			class="field"
			class:field-invalid={!!resolvedError}
			id={inputId}
			type={isPhone ? 'tel' : type}
			inputmode={isPhone ? 'numeric' : (rest.inputmode as 'numeric' | undefined)}
			autocomplete={isPhone && !rest.autocomplete ? 'tel' : (rest.autocomplete as never)}
			{required}
			placeholder={resolvedLabel ? placeholder : (rest.placeholder as string | undefined)}
			aria-invalid={resolvedError ? 'true' : undefined}
			aria-describedby={describedBy}
			bind:value
			oninput={handleInput}
		/>
		{#if resolvedLabel}
			<label class="float-field__label" for={inputId}>
				{resolvedLabel}{#if required}<span class="float-field__required" aria-hidden="true">{' *'}</span>{/if}
			</label>
		{/if}
	</div>
	{#if resolvedError}
		<p class="form-error" id={hintId} role="alert">{resolvedError}</p>
	{:else if helperText}
		<p class="help" id={hintId}>{helperText}</p>
	{/if}
</div>

