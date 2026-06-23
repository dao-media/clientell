<script lang="ts">
	import { enhance } from '$app/forms';
	import { invalidateAll } from '$app/navigation';
	import AttachmentPill from '$lib/components/AttachmentPill.svelte';
	import Btn from '$lib/components/Btn.svelte';
	import Chip from '$lib/components/ui/Chip.svelte';
	import Alert from '$lib/components/ui/Alert.svelte';
	import type { SubmissionDetail } from '$lib/admin/submission-detail';
	import { attachmentAnswerKey, parseAttachments } from '$lib/attachments';
	import { formatCategoryList } from '$lib/categories';
	import { formatAnswer } from '$lib/utils';
	import FileDown from '@lucide/svelte/icons/file-down';
	import Eye from '@lucide/svelte/icons/eye';
	import Mail from '@lucide/svelte/icons/mail';
	import CircleX from '@lucide/svelte/icons/circle-x';

	let {
		detail = null,
		loading = false,
		loadError = '',
		clientCompany = '',
		onClientClick,
		showFooter = true,
		onDismiss,
		onActionComplete
	}: {
		detail?: SubmissionDetail | null;
		loading?: boolean;
		loadError?: string;
		clientCompany?: string;
		onClientClick?: () => void;
		showFooter?: boolean;
		onDismiss?: () => void;
		onActionComplete?: () => void | Promise<void>;
	} = $props();

	let actionMessage = $state<{ variant: 'success' | 'error'; title: string; subtitle?: string } | null>(
		null
	);

	const answers = $derived((detail?.response?.answers ?? {}) as Record<string, unknown>);
	const statusLabel = $derived(
		detail?.response?.status === 'submitted' ? 'Completed' : detail?.response ? 'Unfinished' : 'Not started'
	);
	const statusVariant = $derived(
		detail?.response?.status === 'submitted' ? 'submitted' : 'gray'
	);
	const actionBase = $derived(detail ? `/admin/submissions/${detail.assignment.id}` : '');
	const companyLabel = $derived(clientCompany || detail?.client.company || '');

	$effect(() => {
		detail;
		actionMessage = null;
	});

	function parseActionResult(result: import('@sveltejs/kit').ActionResult) {
		if (result.type === 'success' && result.data) {
			const data = result.data as Record<string, unknown>;
			if (data.emailResult && typeof data.emailResult === 'object') {
				const emailResult = data.emailResult as { ok: boolean; message: string };
				return {
					variant: emailResult.ok ? 'success' : 'error',
					title: emailResult.ok ? 'Email sent' : 'Email failed',
					subtitle: emailResult.message
				} as const;
			}
			if (data.success) {
				return { variant: 'success', title: 'Submission updated' } as const;
			}
			return null;
		}

		if (result.type === 'failure') {
			return {
				variant: 'error',
				title: 'Action failed',
				subtitle: typeof result.data?.error === 'string' ? result.data.error : undefined
			} as const;
		}

		return null;
	}

	async function afterAction(
		result: import('@sveltejs/kit').ActionResult,
		update: (options?: { reset?: boolean }) => Promise<void>
	) {
		const message = parseActionResult(result);
		if (message) actionMessage = message;
		await update({ reset: false });
		await onActionComplete?.();
		invalidateAll();
	}
</script>

<div class="submission-detail-panel">
	<div class="submission-detail-body">
		{#if loading}
			<p class="detail-status">Loading responses…</p>
		{:else if loadError}
			<Alert variant="error" title="Could not open submission" subtitle={loadError} />
		{:else if detail}
			<div class="detail-summary">
				<div class="detail-meta">
					{#if companyLabel && onClientClick}
						<button type="button" class="client-company-chip" onclick={onClientClick}>
							{companyLabel}
						</button>
					{:else if companyLabel}
						<span class="client-company-label">{companyLabel}</span>
					{/if}
					<Chip variant={statusVariant}>{statusLabel}</Chip>
					<span>{detail.progress}% complete</span>
				</div>
				<p class="detail-lead">
					{detail.questionSet.title}
					{#if detail.briefCategories.length > 0}
						· {formatCategoryList(detail.briefCategories, detail.setCategories)}
					{/if}
				</p>
			</div>

			{#if actionMessage}
				<Alert
					variant={actionMessage.variant}
					title={actionMessage.title}
					subtitle={actionMessage.subtitle}
				/>
			{/if}

			{#if detail.questions.length === 0}
				<p class="detail-status">This brief has no questions yet.</p>
			{:else}
				<div class="answers-grid">
					{#each detail.questions as question (question.id)}
						<article class="answer-card">
							<h3>{question.label}</h3>
							{#if question.helpText}
								<p class="help-text">{question.helpText}</p>
							{/if}
							<p>{formatAnswer(answers[question.id])}</p>
							{#if question.allowAttachments}
								{@const items = parseAttachments(answers[attachmentAnswerKey(question.id)])}
								{#if items.length > 0}
									<div class="attachment-pills">
										{#each items as item (item.id)}
											<AttachmentPill {item} />
										{/each}
									</div>
								{/if}
							{/if}
						</article>
					{/each}
				</div>
			{/if}
		{/if}
	</div>

	{#if showFooter && detail && !loading && !loadError}
		<footer class="submission-detail-footer">
			{#if detail.assignment.canSendBrief}
				<form
					method="POST"
					action="{actionBase}?/sendBrief"
					use:enhance={() => {
						return async ({ result, update }) => {
							await afterAction(result, update);
						};
					}}
				>
					<Btn type="submit" icon={Mail}>Send brief</Btn>
				</form>
			{/if}

			<Btn variant="secondary" href="{actionBase}/preview" target="_blank" rel="noopener" icon={Eye}>
				Preview brief
			</Btn>

			<Btn variant="secondary" href="{actionBase}/pdf" target="_blank" rel="noopener" icon={FileDown}>
				Export PDF
			</Btn>

			{#if detail.assignment.sentAt}
				<form
					method="POST"
					action="{actionBase}?/sendReminder"
					use:enhance={() => {
						return async ({ result, update }) => {
							await afterAction(result, update);
						};
					}}
				>
					<Btn type="submit" variant="secondary" icon={Mail}>Send reminder</Btn>
				</form>
			{/if}

			{#if detail.assignment.isActive}
				<form
					method="POST"
					action="{actionBase}?/toggleActive"
					use:enhance={() => {
						return async ({ result, update }) => {
							await afterAction(result, update);
						};
					}}
				>
					<Btn type="submit" variant="ghost" icon={CircleX}>Close submission</Btn>
				</form>
			{/if}

			{#if onDismiss}
				<Btn variant="ghost" type="button" onclick={onDismiss}>Dismiss</Btn>
			{/if}
		</footer>
	{/if}
</div>

<style>
	.submission-detail-panel {
		display: flex;
		flex-direction: column;
		flex: 1;
		min-height: 0;
	}

	.submission-detail-body {
		display: flex;
		flex-direction: column;
		gap: 1rem;
		flex: 1;
		min-height: 0;
		overflow-y: auto;
	}

	.detail-summary {
		display: grid;
		gap: 0.5rem;
	}

	.detail-meta {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		flex-wrap: wrap;
		font-size: 0.875rem;
		color: var(--color-muted);
	}

	.client-company-chip {
		display: inline-flex;
		align-items: center;
		padding: 0.2rem 0.65rem;
		border: 1px solid var(--color-border);
		border-radius: 999px;
		background: var(--color-surface-hover);
		color: var(--color-text);
		font-size: 0.8125rem;
		font-weight: 500;
		cursor: pointer;
	}

	.client-company-chip:hover {
		border-color: var(--color-accent);
		color: var(--color-accent);
	}

	.client-company-label {
		font-weight: 500;
		color: var(--color-text);
	}

	.detail-lead,
	.detail-status,
	.help-text {
		color: var(--color-muted);
		font-size: 0.875rem;
	}

	.answers-grid {
		display: grid;
		gap: 1rem;
	}

	.answer-card h3 {
		font-size: 0.95rem;
		font-weight: 600;
	}

	.help-text {
		margin-top: 0.35rem;
	}

	.attachment-pills {
		display: flex;
		flex-wrap: wrap;
		gap: 0.5rem;
		margin-top: 0.5rem;
	}

	.submission-detail-footer {
		display: flex;
		justify-content: flex-end;
		gap: 0.75rem;
		flex-wrap: wrap;
		padding-top: 1rem;
		margin-top: 1rem;
		border-top: 1px solid var(--color-border);
		flex-shrink: 0;
	}
</style>
