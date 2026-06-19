<script lang="ts">
	import { enhance } from '$app/forms';
	import { invalidateAll } from '$app/navigation';
	import AttachmentPreviewCard from '$lib/components/AttachmentPreviewCard.svelte';
	import Btn from '$lib/components/Btn.svelte';
	import Chip from '$lib/components/ui/Chip.svelte';
	import Alert from '$lib/components/ui/Alert.svelte';
	import { attachmentAnswerKey, parseAttachments } from '$lib/attachments';
	import { formatCategoryList } from '$lib/categories';
	import { formatAnswer } from '$lib/utils';
	import FileDown from '@lucide/svelte/icons/file-down';
	import Mail from '@lucide/svelte/icons/mail';
	import CircleX from '@lucide/svelte/icons/circle-x';

	type SubmissionDetail = {
		assignment: {
			id: string;
			isActive: boolean;
			createdAt: string;
		};
		client: {
			company: string;
			contactName: string;
			email: string;
			phone: string | null;
		};
		questionSet: {
			title: string;
			description: string | null;
		};
		response: {
			status: 'draft' | 'submitted';
			answers: Record<string, unknown>;
			updatedAt: string | null;
			submittedAt: string | null;
		} | null;
		questions: Array<{
			id: string;
			label: string;
			helpText: string | null;
			allowAttachments: boolean;
		}>;
		briefCategories: string[];
		setCategories: import('$lib/categories').QuestionCategory[];
		progress: number;
	};

	let {
		open = $bindable(false),
		assignmentId = null,
		onclose
	}: {
		open?: boolean;
		assignmentId?: string | null;
		onclose?: () => void;
	} = $props();

	let detail = $state<SubmissionDetail | null>(null);
	let loading = $state(false);
	let loadError = $state('');
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

	function close() {
		open = false;
		onclose?.();
	}

	function onBackdropClick(event: MouseEvent) {
		if (event.target === event.currentTarget) close();
	}

	async function loadDetail(id: string) {
		loading = true;
		loadError = '';
		actionMessage = null;

		try {
			const response = await fetch(`/admin/submissions/${id}/detail`);
			if (!response.ok) {
				throw new Error('Could not load submission.');
			}
			detail = (await response.json()) as SubmissionDetail;
		} catch (error) {
			detail = null;
			loadError = error instanceof Error ? error.message : 'Could not load submission.';
		} finally {
			loading = false;
		}
	}

	$effect(() => {
		if (open && assignmentId) {
			loadDetail(assignmentId);
		} else if (!open) {
			detail = null;
			loadError = '';
			actionMessage = null;
		}
	});

	$effect(() => {
		if (!open) return;

		function onKeydown(event: KeyboardEvent) {
			if (event.key === 'Escape') close();
		}

		window.addEventListener('keydown', onKeydown);
		return () => window.removeEventListener('keydown', onKeydown);
	});

	function handleActionResult(result: import('@sveltejs/kit').ActionResult) {
		if (result.type === 'success' && result.data) {
			const data = result.data as Record<string, unknown>;
			if (data.emailResult && typeof data.emailResult === 'object') {
				const emailResult = data.emailResult as { ok: boolean; message: string };
				actionMessage = {
					variant: emailResult.ok ? 'success' : 'error',
					title: emailResult.ok ? 'Email sent' : 'Email failed',
					subtitle: emailResult.message
				};
			} else if (data.success) {
				actionMessage = {
					variant: 'success',
					title: 'Submission updated'
				};
			}
			if (assignmentId) loadDetail(assignmentId);
			invalidateAll();
			return;
		}

		if (result.type === 'failure') {
			actionMessage = {
				variant: 'error',
				title: 'Action failed',
				subtitle: typeof result.data?.error === 'string' ? result.data.error : undefined
			};
		}
	}
</script>

{#if open}
	<div class="review-overlay" onclick={onBackdropClick} role="presentation">
		<div class="review-card" role="dialog" aria-modal="true" aria-labelledby="submission-review-title">
			<header class="review-card-header">
				<div>
					<p class="review-kicker">{detail?.client.company ?? 'Submission'}</p>
					<h2 id="submission-review-title">
						{detail?.client.contactName ?? 'Client responses'}
					</h2>
					{#if detail}
						<div class="review-meta">
							<Chip variant={statusVariant}>{statusLabel}</Chip>
							<span>{detail.progress}% complete</span>
						</div>
					{/if}
				</div>
				<button type="button" class="close-button" aria-label="Close" onclick={close}>×</button>
			</header>

			<div class="review-body">
				{#if loading}
					<p class="review-status">Loading responses…</p>
				{:else if loadError}
					<Alert variant="error" title="Could not open submission" subtitle={loadError} />
				{:else if detail}
					{#if actionMessage}
						<Alert
							variant={actionMessage.variant}
							title={actionMessage.title}
							subtitle={actionMessage.subtitle}
						/>
					{/if}

					<p class="review-lead">
						{detail.questionSet.title}
						{#if detail.briefCategories.length > 0}
							· {formatCategoryList(detail.briefCategories, detail.setCategories)}
						{/if}
					</p>

					{#if detail.questions.length === 0}
						<p class="review-status">This brief has no questions yet.</p>
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
											<div class="attachment-list">
												{#each items as item (item.id)}
													<AttachmentPreviewCard {item} disabled />
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

			{#if detail && !loading && !loadError}
				<footer class="review-card-footer">
					<Btn variant="secondary" href="{actionBase}/pdf" target="_blank" rel="noopener" icon={FileDown}>
						Export PDF
					</Btn>

					<form
						method="POST"
						action="{actionBase}?/sendReminder"
						use:enhance={() => {
							return async ({ result, update }) => {
								handleActionResult(result);
								await update({ reset: false });
							};
						}}
					>
						<Btn type="submit" variant="secondary" icon={Mail}>Send reminder</Btn>
					</form>

					{#if detail.assignment.isActive}
						<form
							method="POST"
							action="{actionBase}?/toggleActive"
							use:enhance={() => {
								return async ({ result, update }) => {
									handleActionResult(result);
									await update({ reset: false });
								};
							}}
						>
							<Btn type="submit" variant="ghost" icon={CircleX}>Close submission</Btn>
						</form>
					{/if}

					<Btn variant="ghost" type="button" onclick={close}>Dismiss</Btn>
				</footer>
			{/if}
		</div>
	</div>
{/if}

<style>
	.review-overlay {
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

	.review-card {
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

	.review-card-header {
		display: flex;
		align-items: flex-start;
		justify-content: space-between;
		gap: 1rem;
		padding: 1.25rem 1.75rem;
		border-bottom: 1px solid var(--color-border);
		flex-shrink: 0;
	}

	.review-kicker {
		font-size: 0.875rem;
		color: var(--color-muted);
	}

	.review-card-header h2 {
		margin-top: 0.2rem;
		font-size: 1.375rem;
		font-weight: 600;
		line-height: 1.3;
	}

	.review-meta {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		margin-top: 0.65rem;
		font-size: 0.875rem;
		color: var(--color-muted);
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
		flex-shrink: 0;
	}

	.close-button:hover {
		background: var(--color-surface-hover);
	}

	.review-body {
		display: flex;
		flex-direction: column;
		gap: 1rem;
		flex: 1;
		padding: 1.5rem 1.75rem;
		overflow-y: auto;
	}

	.review-lead,
	.review-status,
	.help-text {
		color: var(--color-muted);
		font-size: 0.875rem;
	}

	.answers-grid {
		display: grid;
		gap: 1rem;
	}

	.answer-card {
		padding: 1rem;
		border: 1px solid var(--color-border);
		background: var(--color-surface);
		border-radius: var(--radius-lg);
	}

	.answer-card h3 {
		font-size: 0.95rem;
		font-weight: 600;
	}

	.help-text {
		margin-top: 0.35rem;
	}

	.attachment-list {
		display: grid;
		gap: 0.75rem;
		margin-top: 0.75rem;
	}

	.review-card-footer {
		display: flex;
		justify-content: flex-end;
		gap: 0.75rem;
		flex-wrap: wrap;
		padding: 1rem 1.75rem 1.75rem;
		border-top: 1px solid var(--color-border);
		flex-shrink: 0;
	}

	@media (max-width: 671px) {
		.review-overlay {
			padding: 0;
			align-items: stretch;
		}

		.review-card {
			width: 100%;
			min-height: 100%;
			max-height: none;
			border: 0;
			border-radius: 0;
		}
	}
</style>
