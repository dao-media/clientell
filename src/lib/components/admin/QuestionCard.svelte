<script lang="ts">
	import Btn from '$lib/components/Btn.svelte';
	import Checkbox from '$lib/components/ui/Checkbox.svelte';
	import Chip from '$lib/components/ui/Chip.svelte';
	import { formatCategoryList, type QuestionCategory } from '$lib/categories';

	type QuestionItem = {
		id: string;
		label: string;
		helpText: string | null;
		required: boolean;
		allowAttachments: boolean;
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
			</div>
		</div>
		{#if question.helpText}
			<p class="question-details">{question.helpText}</p>
		{/if}
		<p class="question-meta">{formatCategoryList(question.categories, categories)}</p>
	</button>

	{#if !selectMode}
		<form
			method="POST"
			action="?/deleteQuestion"
			class="question-delete"
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
	}

	h3 {
		font-size: 1rem;
		font-weight: 600;
		line-height: 1.35;
	}

	.question-tags {
		display: flex;
		flex-wrap: wrap;
		gap: 0.35rem;
	}

	.question-details,
	.question-meta {
		font-size: 0.875rem;
		color: var(--color-muted);
	}

	.question-delete {
		padding: 0.5rem 0.5rem 0 0;
	}
</style>
