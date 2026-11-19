<script lang="ts">
	import Btn from '$lib/components/Btn.svelte';
	import { formatUsPhoneDisplay, formatUsPhoneInput } from '$lib/phone';

	let {
		label,
		value,
		type = 'text',
		placeholder = '',
		required = false,
		onsave
	}: {
		label: string;
		value: string;
		type?: 'text' | 'email' | 'tel';
		placeholder?: string;
		required?: boolean;
		onsave: (nextValue: string) => Promise<boolean>;
	} = $props();

	let editing = $state(false);
	let draft = $state('');
	let inputEl = $state<HTMLInputElement | null>(null);
	let displayEl = $state<HTMLButtonElement | null>(null);
	const fieldId = `inline-${Math.random().toString(36).slice(2, 9)}`;
	let saving = $state(false);
	let error = $state('');

	const isPhone = $derived(type === 'tel');
	const displayValue = $derived(isPhone ? formatUsPhoneDisplay(value) : value);

	function startEdit() {
		draft = isPhone ? formatUsPhoneDisplay(value) : value;
		error = '';
		editing = true;
		queueMicrotask(() => inputEl?.focus());
	}

	function finishEditing() {
		editing = false;
		// Return focus to the value so keyboard users keep their place (WCAG 2.4.3).
		queueMicrotask(() => displayEl?.focus());
	}

	function cancel() {
		draft = isPhone ? formatUsPhoneDisplay(value) : value;
		error = '';
		finishEditing();
	}

	function onDraftInput(event: Event & { currentTarget: HTMLInputElement }) {
		draft = isPhone ? formatUsPhoneInput(event.currentTarget.value) : event.currentTarget.value;
	}

	async function save() {
		if (required && !draft.trim()) {
			error = 'This field is required.';
			return;
		}

		if (draft === value) {
			finishEditing();
			return;
		}

		saving = true;
		error = '';
		const ok = await onsave(draft);
		saving = false;

		if (ok) {
			finishEditing();
		} else {
			error = 'Could not save.';
		}
	}

	function onKeydown(event: KeyboardEvent) {
		if (event.key === 'Enter') {
			event.preventDefault();
			void save();
		}
		if (event.key === 'Escape') {
			event.preventDefault();
			cancel();
		}
	}
</script>

<div class="inline-field" class:inline-field--editing={editing}>
	{#if editing}
		<div class="inline-field-edit">
			<div class="float-field">
				<input
					bind:this={inputEl}
					class="field"
					id={fieldId}
					{type}
					placeholder={placeholder || ' '}
					{required}
					value={draft}
					inputmode={isPhone ? 'numeric' : undefined}
					autocomplete={isPhone ? 'tel' : undefined}
					aria-invalid={error ? 'true' : undefined}
					aria-describedby={error ? `${fieldId}-error` : undefined}
					oninput={onDraftInput}
					onkeydown={onKeydown}
				/>
				<label class="float-field__label" for={fieldId}>{label}</label>
			</div>
			<div class="inline-field-actions">
				<Btn size="small" type="button" onclick={save} disabled={saving}>
					{saving ? 'Saving…' : 'Save'}
				</Btn>
				<Btn size="small" variant="ghost" type="button" onclick={cancel} disabled={saving}>
					Cancel
				</Btn>
			</div>
			{#if error}
				<p class="form-error" id="{fieldId}-error" role="alert">{error}</p>
			{/if}
		</div>
	{:else}
		<span class="inline-field-label" id="{fieldId}-label">{label}</span>
		<button
			type="button"
			class="inline-field-display"
			bind:this={displayEl}
			aria-labelledby="{fieldId}-label {fieldId}-value"
			aria-describedby="{fieldId}-hint"
			onclick={startEdit}
		>
			<span class="inline-field-value" id="{fieldId}-value">{displayValue || '—'}</span>
			<span class="inline-field-hint" id="{fieldId}-hint">Edit</span>
		</button>
	{/if}
</div>

<style>
	.inline-field {
		display: grid;
		gap: 0.35rem;
		padding: 0.75rem 0;
		border-bottom: 1px solid var(--color-border);
	}

	.inline-field:last-child {
		border-bottom: 0;
	}

	.inline-field-label {
		font-size: 0.75rem;
		font-weight: 600;
		color: var(--color-muted);
		text-transform: uppercase;
		letter-spacing: 0.04em;
	}

	.inline-field-display {
		display: flex;
		flex-wrap: wrap;
		align-items: baseline;
		gap: 0.5rem 0.75rem;
		width: 100%;
		min-width: 0;
		min-height: var(--target-min);
		margin: 0 -0.375rem;
		padding: 0.25rem 0.375rem;
		border: 0;
		border-radius: var(--control-radius);
		background: transparent;
		color: inherit;
		font: inherit;
		text-align: left;
		cursor: pointer;
	}

	.inline-field-display:hover {
		background: var(--color-surface-hover);
	}

	.inline-field-display:focus-visible {
		outline: 2px solid var(--color-focus-ring);
		outline-offset: 1px;
	}

	.inline-field-value {
		font-size: 0.9375rem;
		line-height: 1.45;
		overflow-wrap: anywhere;
	}

	.inline-field-hint {
		margin-left: auto;
		font-size: 0.75rem;
		font-weight: 600;
		color: var(--color-accent);
		opacity: 0;
		transition: opacity 0.15s ease;
	}

	.inline-field-display:hover .inline-field-hint,
	.inline-field-display:focus-visible .inline-field-hint {
		opacity: 1;
	}

	.inline-field-edit {
		display: grid;
		gap: 0.5rem;
	}

	.inline-field-actions {
		display: flex;
		flex-wrap: wrap;
		gap: 0.5rem;
	}

</style>
