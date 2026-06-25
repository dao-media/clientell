<script lang="ts">
	import FileLinkUploader from '$lib/components/FileLinkUploader.svelte';
	import { attachmentAnswerKey, parseAttachments, type AttachmentItem } from '$lib/attachments';
	import {
		inputRestrictionStats,
		restrictionLabel,
		type QuestionInputRestriction,
		validateInputRestriction
	} from '$lib/question-restrictions';
	import type { QuestionType } from '$lib/server/db/schema';

	type Question = {
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
		question,
		answers = $bindable<Record<string, unknown>>({}),
		disabled = false,
		preview = false,
		client = false
	}: {
		question: Question;
		answers?: Record<string, unknown>;
		disabled?: boolean;
		preview?: boolean;
		client?: boolean;
	} = $props();

	const attachmentKey = $derived(attachmentAnswerKey(question.id));
	let attachments = $state<AttachmentItem[]>([]);
	let restrictionError = $state('');

	const restrictionHint = $derived(restrictionLabel(question.inputRestriction));
	const answerValue = $derived(String(answers[question.id] ?? ''));
	const restrictionStats = $derived(inputRestrictionStats(question.inputRestriction, answerValue));
	const nativeRequired = $derived(question.required && !question.allowAttachments && !preview);
	const splitWithUpload = $derived(
		question.allowAttachments &&
			(question.type === 'textarea' ||
				question.type === 'text' ||
				question.type === 'email' ||
				question.type === 'url' ||
				question.type === 'number')
	);

	function validateCurrentAnswer(value: string) {
		restrictionError =
			validateInputRestriction(question.inputRestriction, value) ??
			'';
	}

	function updateAnswer(value: string) {
		answers[question.id] = value;
		validateCurrentAnswer(value);
	}

	$effect.pre(() => {
		attachments = parseAttachments(answers[attachmentKey]);
	});

	$effect(() => {
		if (!question.allowAttachments) return;
		if (attachments.length > 0) {
			answers[attachmentKey] = attachments;
		} else {
			delete answers[attachmentKey];
		}
	});

	$effect(() => {
		question.inputRestriction;
		validateCurrentAnswer(answerValue);
	});
</script>

{#snippet answerInput(split = false)}
	{#if question.type === 'textarea'}
		<textarea
			id={question.id}
			class="field"
			class:client-brief-answer={client}
			class:field-split={split}
			class:min-h-32={!split}
			class:field-invalid={!!restrictionError}
			name={question.id}
			value={answerValue}
			oninput={(event) => {
				updateAnswer((event.currentTarget as HTMLTextAreaElement).value);
			}}
			{disabled}
			required={nativeRequired}
			aria-invalid={restrictionError ? 'true' : undefined}
			aria-describedby={restrictionError ? `${question.id}-restriction-error` : undefined}
		></textarea>
	{:else if question.type === 'select'}
		<select
			id={question.id}
			class="field"
			class:client-brief-answer={client}
			name={question.id}
			value={answerValue}
			onchange={(event) => {
				updateAnswer((event.currentTarget as HTMLSelectElement).value);
			}}
			{disabled}
			required={nativeRequired}
		>
			<option value="">Select an option</option>
			{#each question.options ?? [] as option (option)}
				<option value={option}>{option}</option>
			{/each}
		</select>
	{:else if question.type === 'checkbox'}
		<label class="flex items-center gap-3 rounded-md border border-[var(--color-border)] bg-white px-3 py-3">
			<input
				id={question.id}
				name={question.id}
				type="checkbox"
				class="size-4 rounded border-slate-300"
				checked={answers[question.id] === true}
				onchange={(event) => {
					answers[question.id] = (event.currentTarget as HTMLInputElement).checked;
				}}
				{disabled}
			/>
			<span class="text-sm">Yes</span>
		</label>
	{:else}
		<input
			id={question.id}
			class="field"
			class:client-brief-answer={client}
			class:field-split={split}
			class:field-invalid={!!restrictionError}
			name={question.id}
			type={question.type === 'number'
				? 'number'
				: question.type === 'email'
					? 'email'
					: question.type === 'url'
						? 'url'
						: 'text'}
			value={answerValue}
			oninput={(event) => {
				updateAnswer((event.currentTarget as HTMLInputElement).value);
			}}
			{disabled}
			required={nativeRequired}
			aria-invalid={restrictionError ? 'true' : undefined}
			aria-describedby={restrictionError ? `${question.id}-restriction-error` : undefined}
		/>
	{/if}
{/snippet}

<div class="question-field" class:question-field--client={client}>
	<label class="label" for={question.id}>
		{#if client}
			<h5 class="question-heading">
				{question.label}
				{#if question.required}<span class="text-red-500">*</span>{/if}
			</h5>
		{:else}
			{question.label}
			{#if question.required}<span class="text-red-500">*</span>{/if}
		{/if}
	</label>

	{#if splitWithUpload}
		<div class="answer-split">
			<div class="answer-split__text">
				{@render answerInput(true)}
			</div>
			<div class="answer-split__media">
				<FileLinkUploader
					questionId={question.id}
					bind:attachments
					{disabled}
					{preview}
					layout="split"
				/>
			</div>
		</div>
	{:else}
		{@render answerInput(false)}

		{#if question.allowAttachments}
			<FileLinkUploader questionId={question.id} bind:attachments {disabled} {preview} />
		{/if}
	{/if}

	{#if restrictionHint}
		<p class="help">{restrictionHint}</p>
	{/if}

	{#if restrictionStats}
		<p class="help">{restrictionStats}</p>
	{/if}

	{#if restrictionError}
		<p class="form-error" id="{question.id}-restriction-error">{restrictionError}</p>
	{/if}

	{#if question.helpText}
		<p class="help">{question.helpText}</p>
	{/if}
</div>

<style>
	.question-field {
		display: grid;
		gap: 0.5rem;
	}

	.question-field--client .label {
		display: block;
		font-size: inherit;
		font-weight: inherit;
	}

	.question-field--client .question-heading {
		margin: 0;
	}

	.answer-split {
		display: grid;
		grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
		gap: 0.75rem;
		align-items: stretch;
	}

	.answer-split__text {
		display: flex;
		flex-direction: column;
		min-width: 0;
		min-height: 8rem;
		align-self: stretch;
	}

	.answer-split__media {
		display: flex;
		flex-direction: column;
		min-width: 0;
		align-self: stretch;
	}

	.answer-split__text :global(.field-split) {
		flex: 1 1 auto;
		min-height: 8rem;
		height: 100%;
		width: 100%;
		box-sizing: border-box;
	}

	.answer-split__text :global(textarea.field-split) {
		resize: none;
		overflow-y: auto;
	}

	@media (max-width: 640px) {
		.answer-split {
			grid-template-columns: 1fr;
		}

		.answer-split__text :global(.field-split) {
			min-height: 6rem;
		}
	}
</style>
