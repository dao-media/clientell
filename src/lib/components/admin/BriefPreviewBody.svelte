<script lang="ts">
	import QuestionField from '$lib/components/QuestionField.svelte';
	import type { QuestionType } from '$lib/server/db/schema';
	import type { QuestionInputRestriction } from '$lib/question-restrictions';

	type PreviewQuestion = {
		id: string;
		type: QuestionType;
		label: string;
		helpText: string | null;
		required: boolean;
		options: string[] | null;
		allowAttachments: boolean;
		inputRestriction?: QuestionInputRestriction | null;
	};

	let {
		questions
	}: {
		questions: PreviewQuestion[];
	} = $props();

	let answers = $state<Record<string, unknown>>({});
</script>

{#if questions.length === 0}
	<p class="preview-empty">This brief has no active questions for the selected categories.</p>
{:else}
	<div class="preview-form card form-group">
		{#each questions as question (question.id)}
			<QuestionField {question} bind:answers preview />
		{/each}
	</div>
{/if}

<style>
	.preview-form {
		margin-top: 0;
	}

	.preview-empty {
		color: var(--color-muted);
		font-size: 0.9375rem;
	}
</style>
