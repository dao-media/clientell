<script lang="ts">
	import { enhance } from '$app/forms';
	import CategoryTagPicker from '$lib/components/admin/CategoryTagPicker.svelte';
	import Btn from '$lib/components/Btn.svelte';
	import Alert from '$lib/components/ui/Alert.svelte';
	import Checkbox from '$lib/components/ui/Checkbox.svelte';
	import Field from '$lib/components/ui/Field.svelte';
	import Select from '$lib/components/ui/Select.svelte';
	import TextArea from '$lib/components/ui/TextArea.svelte';
	import type { QuestionCategory } from '$lib/categories';

	type QuestionDraft = {
		id?: string;
		label: string;
		helpText: string;
		required: boolean;
		allowAttachments: boolean;
		categories: string[];
		isActive: boolean;
	};

	let {
		open = $bindable(false),
		setId,
		categories,
		question = null,
		heading = 'New Question',
		error = '',
		onclose,
		oncreatecategory
	}: {
		open?: boolean;
		setId: string;
		categories: QuestionCategory[];
		question?: QuestionDraft | null;
		heading?: string;
		error?: string;
		onclose?: () => void;
		oncreatecategory?: (anchor: DOMRect) => void;
	} = $props();

	let label = $state('');
	let helpText = $state('');
	let required = $state(false);
	let allowAttachments = $state(false);
	let selectedCategories = $state<string[]>([]);
	let status = $state<'active' | 'inactive'>('active');

	$effect(() => {
		if (open) {
			label = question?.label ?? '';
			helpText = question?.helpText ?? '';
			required = question?.required ?? !question?.id;
			allowAttachments = question?.allowAttachments ?? false;
			selectedCategories = [...(question?.categories ?? [])];
			status = question?.isActive === false ? 'inactive' : 'active';
		}
	});

	const isEdit = $derived(Boolean(question?.id));
	const canSave = $derived(categories.length > 0 && selectedCategories.length > 0 && label.trim().length > 0);
	const submitLabel = $derived(isEdit ? 'Save changes' : 'Save question');

	function close() {
		open = false;
		onclose?.();
	}

	function onBackdropClick(event: MouseEvent) {
		if (event.target === event.currentTarget) close();
	}

	$effect(() => {
		if (!open) return;

		function onKeydown(event: KeyboardEvent) {
			if (event.key === 'Escape') close();
		}

		window.addEventListener('keydown', onKeydown);
		return () => window.removeEventListener('keydown', onKeydown);
	});
</script>

{#if open}
	<div class="question-overlay" onclick={onBackdropClick} role="presentation">
		<div class="question-card" role="dialog" aria-modal="true" aria-labelledby="question-editor-title">
			<header class="question-card-header">
				<h2 id="question-editor-title">{heading}</h2>
				<button type="button" class="close-button" aria-label="Close" onclick={close}>×</button>
			</header>

			<form
				method="POST"
				action="?/saveQuestion"
				class="question-form"
				use:enhance={() => {
					return async ({ result, update }) => {
						await update({ reset: false });
						if (result.type === 'success') close();
					};
				}}
			>
				<input type="hidden" name="setId" value={setId} />
				{#if question?.id}
					<input type="hidden" name="questionId" value={question.id} />
				{/if}

				{#each selectedCategories as categoryId (categoryId)}
					<input type="hidden" name="categories" value={categoryId} />
				{/each}

				<Field labelText="Question" name="label" bind:value={label} required />

				<TextArea
					labelText="Details"
					name="helpText"
					bind:value={helpText}
					rows={6}
					helperText="Optional guidance shown to the client."
				/>

				<CategoryTagPicker
					{categories}
					bind:selected={selectedCategories}
					legend="Categories"
					required
					helperText="1 or more categories required"
					placeholder="Type to search or pick a category…"
					{oncreatecategory}
				/>

				<div class="toggle-grid">
					<Checkbox labelText="File/link attachments" bind:checked={allowAttachments} />
					<input type="hidden" name="allowAttachments" value={allowAttachments ? 'on' : ''} />

					<Checkbox labelText="Required for client" bind:checked={required} />
					<input type="hidden" name="required" value={required ? 'on' : ''} />
				</div>

				<Select
					labelText="State"
					bind:value={status}
					options={[
						{ value: 'active', text: 'Active' },
						{ value: 'inactive', text: 'Inactive' }
					]}
				/>
				<input type="hidden" name="isActive" value={status === 'active' ? 'on' : ''} />

				{#if error}
					<Alert variant="error" title="Could not save question" subtitle={error} />
				{/if}

				<footer class="question-card-footer">
					<Btn variant="secondary" type="button" onclick={close}>Cancel</Btn>
					<Btn type="submit" disabled={!canSave}>{submitLabel}</Btn>
				</footer>
			</form>
		</div>
	</div>
{/if}

<style>
	.question-overlay {
		position: fixed;
		inset: 0;
		z-index: 8000;
		display: flex;
		align-items: center;
		justify-content: center;
		padding: 1.25rem;
		background: rgb(15 23 42 / 55%);
		backdrop-filter: blur(3px);
		overflow-y: auto;
	}

	.question-card {
		display: flex;
		flex-direction: column;
		width: min(100%, 52rem);
		min-height: min(88vh, 40rem);
		max-height: 92vh;
		background: var(--color-surface);
		border: 1px solid var(--color-border);
		border-radius: var(--radius-lg);
		box-shadow: 0 16px 48px rgb(0 0 0 / 22%);
	}

	.question-card-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 1rem;
		padding: 1.25rem 1.75rem;
		border-bottom: 1px solid var(--color-border);
		flex-shrink: 0;
	}

	.question-card-header h2 {
		font-size: 1.375rem;
		font-weight: 600;
		line-height: 1.3;
	}

	.close-button {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		width: 2.25rem;
		height: 2.25rem;
		border: 0;
		border-radius: var(--radius);
		background: transparent;
		color: var(--color-ink);
		font-size: 1.625rem;
		line-height: 1;
		cursor: pointer;
	}

	.close-button:hover {
		background: var(--color-surface-hover);
	}

	.question-form {
		display: flex;
		flex-direction: column;
		flex: 1;
		gap: 1.25rem;
		padding: 1.5rem 1.75rem 1.75rem;
		overflow-y: auto;
	}

	.toggle-grid {
		display: grid;
		gap: 1rem;
	}

	@media (min-width: 672px) {
		.question-card {
			width: min(calc(100% - 2.5rem), 56rem);
		}

		.toggle-grid {
			grid-template-columns: repeat(2, minmax(0, 1fr));
		}
	}

	.question-card-footer {
		display: flex;
		justify-content: flex-end;
		gap: 0.75rem;
		flex-wrap: wrap;
		padding-top: 1rem;
		margin-top: auto;
		border-top: 1px solid var(--color-border);
	}

	@media (max-width: 671px) {
		.question-overlay {
			padding: 0;
			align-items: stretch;
		}

		.question-card {
			width: 100%;
			min-height: 100%;
			max-height: none;
			border: 0;
			border-radius: 0;
		}
	}
</style>
