<script lang="ts">
	import FileLinkUploader from '$lib/components/FileLinkUploader.svelte';
	import { attachmentAnswerKey, parseAttachments, type AttachmentItem } from '$lib/attachments';
	import type { QuestionType } from '$lib/server/db/schema';

	type Question = {
		id: string;
		type: QuestionType;
		label: string;
		helpText: string | null;
		required: boolean;
		options: string[] | null;
		allowAttachments: boolean;
	};

	let {
		question,
		answers = $bindable<Record<string, unknown>>({}),
		disabled = false
	}: {
		question: Question;
		answers?: Record<string, unknown>;
		disabled?: boolean;
	} = $props();

	const attachmentKey = $derived(attachmentAnswerKey(question.id));
	let attachments = $state<AttachmentItem[]>([]);

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
</script>

<div class="space-y-2">
	<label class="label" for={question.id}>
		{question.label}
		{#if question.required}<span class="text-red-500">*</span>{/if}
	</label>

	{#if question.type === 'textarea'}
		<textarea
			id={question.id}
			class="field min-h-32 resize-y"
			name={question.id}
			value={String(answers[question.id] ?? '')}
			oninput={(event) => {
				answers[question.id] = (event.currentTarget as HTMLTextAreaElement).value;
			}}
			{disabled}
			required={question.required}
		></textarea>
	{:else if question.type === 'select'}
		<select
			id={question.id}
			class="field"
			name={question.id}
			value={String(answers[question.id] ?? '')}
			onchange={(event) => {
				answers[question.id] = (event.currentTarget as HTMLSelectElement).value;
			}}
			{disabled}
			required={question.required}
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
			name={question.id}
			type={question.type === 'number'
				? 'number'
				: question.type === 'email'
					? 'email'
					: question.type === 'url'
						? 'url'
						: 'text'}
			value={String(answers[question.id] ?? '')}
			oninput={(event) => {
				answers[question.id] = (event.currentTarget as HTMLInputElement).value;
			}}
			{disabled}
			required={question.required}
		/>
	{/if}

	{#if question.helpText}
		<p class="help">{question.helpText}</p>
	{/if}

	{#if question.allowAttachments}
		<FileLinkUploader questionId={question.id} bind:attachments {disabled} />
	{/if}
</div>
