<script lang="ts">
	import { enhance } from '$app/forms';
	import { refreshAfterQuestionChange } from '$lib/admin/refresh-data';
	import Btn from '$lib/components/Btn.svelte';
	import Checkbox from '$lib/components/ui/Checkbox.svelte';
	import Chip from '$lib/components/ui/Chip.svelte';
	import CategoryDots from '$lib/components/admin/CategoryDots.svelte';
	import type { QuestionCategory } from '$lib/categories';
	import { restrictionLabel, type QuestionInputRestriction } from '$lib/question-restrictions';

	type QuestionItem = {
		id: string;
		label: string;
		helpText: string | null;
		required: boolean;
		allowAttachments: boolean;
		inputRestriction: QuestionInputRestriction | null;
		categories: string[];
		isActive: boolean;
	};

	let {
		question,
		setId,
		categories,
		selectMode = false,
		selected = false,
		ontoggle,
		onedit
	}: {
		question: QuestionItem;
		setId: string;
		categories: QuestionCategory[];
		selectMode?: boolean;
		selected?: boolean;
		ontoggle?: (questionId: string, checked: boolean) => void;
		onedit: (question: QuestionItem) => void;
	} = $props();
</script>

<article class="question-card" class:inactive={!question.isActive} class:select-mode={selectMode}>
	{#if selectMode}
		<div class="question-select">
			<Checkbox
				checked={selected}
				hideLabel
				id="select-{question.id}"
				onchange={(event) =>
					ontoggle?.(question.id, (event.currentTarget as HTMLInputElement).checked)}
			/>
		</div>
	{/if}

	<button
		type="button"
		class="question-card-main"
		disabled={selectMode}
		onclick={() => onedit(question)}
	>
		<div class="question-card-top">
			<h3>{question.label}</h3>
			<div class="question-tags">
				{#if !question.isActive}
					<Chip variant="gray">Inactive</Chip>
				{/if}
				{#if question.required}
					<Chip variant="blue">Required</Chip>
				{/if}
				{#if question.allowAttachments}
					<Chip variant="green">Attachments</Chip>
				{/if}
				{#if restrictionLabel(question.inputRestriction)}
					<Chip variant="gray">{restrictionLabel(question.inputRestriction)}</Chip>
				{/if}
			</div>
		</div>
		{#if question.helpText}
			<p class="question-details">{question.helpText}</p>
		{/if}
		<CategoryDots categoryIds={question.categories} {categories} class="question-meta" />
	</button>

	{#if !selectMode}
		<form
			method="POST"
			action="?/deleteQuestion"
			class="question-delete"
			use:enhance={() => {
				return async ({ result, update }) => {
					await update({ reset: false, invalidateAll: false });
					if (result.type === 'success') {
						await refreshAfterQuestionChange();
					}
				};
			}}
			onsubmit={(event) => {
				if (!confirm('Delete this question?')) event.preventDefault();
			}}
		>
			<input type="hidden" name="setId" value={setId} />
			<input type="hidden" name="questionId" value={question.id} />
			<Btn variant="ghost" size="small" type="submit">Delete</Btn>
		</form>
	{/if}
</article>

<style>
	.question-card {
		border: 1px solid var(--color-border);
		background: var(--color-surface);
		display: grid;
		grid-template-columns: auto 1fr auto;
		align-items: start;
		border-radius: var(--radius-lg);
		width: 100%;
		max-width: 100%;
	}

	.question-card:not(.select-mode) {
		grid-template-columns: 1fr auto;
	}

	.question-card.inactive {
		opacity: 0.72;
	}

	.question-select {
		display: flex;
		align-items: flex-start;
		padding: 0.85rem 0 0 0.75rem;
	}

	.question-card-main {
		display: grid;
		gap: 0.45rem;
		padding: 1rem;
		text-align: left;
		background: transparent;
		border: 0;
		cursor: pointer;
		color: inherit;
		font: inherit;
		width: 100%;
	}

	.question-card-main:hover:not(:disabled) {
		background: var(--color-surface-hover);
	}

	.question-card-main:disabled {
		cursor: default;
	}

	.question-card-top {
		display: flex;
		justify-content: space-between;
		gap: 0.75rem;
		align-items: flex-start;
		flex-wrap: wrap;
	}

	h3 {
		font-size: 1rem;
		font-weight: 600;
		line-height: 1.35;
		min-width: 0;
		flex: 1 1 12rem;
	}

	.question-tags {
		display: flex;
		flex-wrap: wrap;
		gap: 0.35rem;
	}

	.question-details {
		font-size: 0.875rem;
		color: var(--color-muted);
	}

	.question-delete {
		padding: 0.5rem 0.5rem 0 0;
	}
</style>
