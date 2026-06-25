<script lang="ts">
	import AttachmentPreviewCard from '$lib/components/AttachmentPreviewCard.svelte';
	import Btn from '$lib/components/Btn.svelte';
	import Spinner from '$lib/components/ui/Spinner.svelte';
	import { attachmentAnswerKey, parseAttachments } from '$lib/attachments';
	import type { QuestionType } from '$lib/server/db/schema';
	import { formatAnswer } from '$lib/utils';

	type ReviewQuestion = {
		id: string;
		type: QuestionType;
		label: string;
		helpText: string | null;
		allowAttachments: boolean;
	};

	let {
		questions,
		answers,
		editable = false,
		submitting = false,
		allowEditsAfterSubmit = true,
		onfinishlater,
		onsubmit
	}: {
		questions: ReviewQuestion[];
		answers: Record<string, unknown>;
		editable?: boolean;
		submitting?: boolean;
		allowEditsAfterSubmit?: boolean;
		onfinishlater?: () => void;
		onsubmit?: () => void;
	} = $props();

	function answerText(question: ReviewQuestion): string {
		return formatAnswer(answers[question.id]);
	}

	function questionAttachments(question: ReviewQuestion) {
		return parseAttachments(answers[attachmentAnswerKey(question.id)]);
	}
</script>

<div class="brief-review">
	{#if editable}
		<header class="review-floating-header">
			<Btn variant="secondary" type="button" disabled={submitting} onclick={() => onfinishlater?.()}>
				Finish later
			</Btn>
			<Btn type="button" class="submit-btn" disabled={submitting} onclick={() => onsubmit?.()}>
				{#if submitting}
					<Spinner size="small" label="Submitting brief" />
				{/if}
				Submit brief
			</Btn>
		</header>
	{/if}

	<div class="review-body">
		{#if questions.length === 0}
			<p class="review-empty">This brief has no questions yet.</p>
		{:else}
			{#each questions as question (question.id)}
				<article class="review-item">
					<h5 class="review-question">{question.label}</h5>
					{#if question.helpText}
						<p class="review-help">{question.helpText}</p>
					{/if}
					<p class="review-answer">{answerText(question)}</p>
					{#if questionAttachments(question).length > 0}
						<div class="review-attachments">
							{#each questionAttachments(question) as item (item.id)}
								<AttachmentPreviewCard {item} compact disabled />
							{/each}
						</div>
					{/if}
				</article>
			{/each}
		{/if}

		{#if editable && allowEditsAfterSubmit}
			<p class="review-note">
				You can return anytime to update your answers — this brief can still be edited after
				submission.
			</p>
		{/if}
	</div>
</div>

<style>
	.brief-review {
		position: relative;
		border: 1px solid var(--color-border);
		background: var(--color-surface);
		border-radius: var(--radius-lg);
		overflow: hidden;
	}

	.review-floating-header {
		position: sticky;
		top: 0;
		z-index: 10;
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		justify-content: space-between;
		gap: 0.75rem;
		padding: 0.875rem 1.25rem;
		background: color-mix(in srgb, var(--color-surface) 92%, transparent);
		border-bottom: 1px solid var(--color-border);
		backdrop-filter: blur(8px);
		box-shadow: 0 4px 16px rgb(15 23 42 / 8%);
	}

	.review-body {
		display: flex;
		flex-direction: column;
		gap: 0;
		max-height: min(70vh, 42rem);
		overflow-y: auto;
		padding: 1.25rem;
	}

	.review-item {
		padding: 1rem 0;
		border-bottom: 1px solid var(--color-border);
	}

	.review-item:first-child {
		padding-top: 0;
	}

	.review-item:last-of-type {
		border-bottom: 0;
	}

	.review-question {
		margin: 0;
	}

	.review-help {
		margin-top: 0.25rem;
		font-size: 0.8125rem;
		color: var(--color-muted);
	}

	.review-answer {
		margin-top: 0.5rem;
		white-space: pre-wrap;
	}

	.review-attachments {
		display: flex;
		flex-wrap: wrap;
		gap: 0.5rem;
		margin-top: 0.75rem;
	}

	.review-note {
		margin-top: 1rem;
		padding-top: 1rem;
		border-top: 1px solid var(--color-border);
		font-size: 0.875rem;
		color: var(--color-muted);
		line-height: 1.45;
	}

	.review-empty {
		color: var(--color-muted);
		font-size: 0.9375rem;
	}

	.review-floating-header :global(.btn) {
		min-width: 7.5rem;
	}

	.review-floating-header :global(.submit-btn) {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		gap: 0.5rem;
	}
</style>
