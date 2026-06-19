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
	let saving = $state(false);
	let error = $state('');

	const isPhone = $derived(type === 'tel');
	const displayValue = $derived(isPhone ? formatUsPhoneDisplay(value) : value);

	function startEdit() {
		draft = isPhone ? formatUsPhoneDisplay(value) : value;
		error = '';
		editing = true;
	}

	function cancel() {
		editing = false;
		draft = isPhone ? formatUsPhoneDisplay(value) : value;
		error = '';
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
			editing = false;
			return;
		}

		saving = true;
		error = '';
		const ok = await onsave(draft);
		saving = false;

		if (ok) {
			editing = false;
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
	<span class="inline-field-label">{label}</span>

	{#if editing}
		<div class="inline-field-edit">
			<input
				class="field"
				{type}
				{placeholder}
				{required}
				value={draft}
				inputmode={isPhone ? 'numeric' : undefined}
				autocomplete={isPhone ? 'tel' : undefined}
				oninput={onDraftInput}
				onkeydown={onKeydown}
			/>
			<div class="inline-field-actions">
				<Btn size="small" type="button" onclick={save} disabled={saving}>
					{saving ? 'Saving…' : 'Save'}
				</Btn>
				<Btn size="small" variant="ghost" type="button" onclick={cancel} disabled={saving}>
					Cancel
				</Btn>
			</div>
			{#if error}
				<p class="inline-field-error">{error}</p>
			{/if}
		</div>
	{:else}
		<!-- svelte-ignore a11y_no_static_element_interactions -->
		<div class="inline-field-display" ondblclick={startEdit}>
			<span class="inline-field-value">{displayValue || '—'}</span>
			<span class="inline-field-hint">Double-click to edit</span>
		</div>
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
		cursor: text;
		min-width: 0;
	}

	.inline-field-value {
		font-size: 0.9375rem;
		line-height: 1.45;
		overflow-wrap: anywhere;
	}

	.inline-field-hint {
		font-size: 0.75rem;
		color: var(--color-muted);
		opacity: 0;
		transition: opacity 0.15s ease;
	}

	.inline-field-display:hover .inline-field-hint,
	.inline-field--editing .inline-field-hint {
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

	.inline-field-error {
		font-size: 0.8125rem;
		color: var(--color-error);
	}
</style>
