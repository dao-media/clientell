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
