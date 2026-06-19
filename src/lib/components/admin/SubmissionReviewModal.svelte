<script lang="ts">
	import { invalidateAll } from '$app/navigation';
	import Btn from '$lib/components/Btn.svelte';
	import SubmissionDetailPanel from '$lib/components/admin/SubmissionDetailPanel.svelte';
	import { fetchSubmissionDetail, type SubmissionDetail } from '$lib/admin/submission-detail';

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

		try {
			detail = await fetchSubmissionDetail(id);
		} catch (error) {
			detail = null;
			loadError = error instanceof Error ? error.message : 'Could not load submission.';
		} finally {
			loading = false;
		}
	}

	$effect(() => {
		if (open && assignmentId) {
			void loadDetail(assignmentId);
		} else if (!open) {
			detail = null;
			loadError = '';
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
				</div>
				<button type="button" class="close-button" aria-label="Close" onclick={close}>×</button>
			</header>

			<div class="review-body">
				<SubmissionDetailPanel
					{detail}
					{loading}
					loadError={loadError}
					onDismiss={close}
					onActionComplete={async () => {
						if (assignmentId) await loadDetail(assignmentId);
						await invalidateAll();
					}}
				/>
			</div>
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
		flex: 1;
		min-height: 0;
		padding: 1.5rem 1.75rem 1.75rem;
		overflow: hidden;
	}

	@media (max-width: 767px) {
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
