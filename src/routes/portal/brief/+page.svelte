<script lang="ts">
	import { deserialize } from '$app/forms';
	import { invalidateAll } from '$app/navigation';
	import Btn from '$lib/components/Btn.svelte';
	import BriefReviewPanel from '$lib/components/portal/BriefReviewPanel.svelte';
	import QuestionField from '$lib/components/QuestionField.svelte';
	import Spinner from '$lib/components/ui/Spinner.svelte';
	import StatusBadge from '$lib/components/StatusBadge.svelte';
	import PageHeader from '$lib/components/layout/PageHeader.svelte';
	import PageShell from '$lib/components/layout/PageShell.svelte';
	import { buildBriefFormData } from '$lib/portal/brief-form';
	import { isQuestionAnswered } from '$lib/utils';
	import LogOut from '@lucide/svelte/icons/log-out';
	import type { ActionData, PageData } from './$types';
	import '$lib/styles/client-brief.css';

	let { data, form }: { data: PageData; form: ActionData } = $props();

	let answers = $state<Record<string, unknown>>({});
	let step = $state(0);
	let stepReady = $state(false);
	let saveState = $state<'idle' | 'saving' | 'saved' | 'error'>('idle');
	let submitting = $state(false);
	let submitSuccess = $state(false);
	let actionError = $state('');

	const questions = $derived(data.questions);
	const readOnly = $derived(!data.editable);
	const onReview = $derived(step >= questions.length);
	const currentQuestion = $derived(questions[step] ?? null);
	const isFirstStep = $derived(step === 0);
	const isLastQuestionStep = $derived(step === questions.length - 1);
	const isBusy = $derived(saveState === 'saving' || submitting);

	const briefLead = $derived(
		[
			data.client.company,
			data.client.contactName,
			data.questionSet.description,
			data.briefCategories.length > 0 ? `Categories: ${data.categoriesLabel}` : ''
		]
			.filter(Boolean)
			.join(' · ')
	);

	const stepLabel = $derived(
		onReview
			? 'Review your brief'
			: questions.length > 0
				? `Question ${step + 1} of ${questions.length}`
				: 'Brief'
	);

	$effect.pre(() => {
		answers = { ...(data.response.answers as Record<string, unknown>) };
	});

	$effect(() => {
		if (stepReady) return;
		stepReady = true;

		if (readOnly || questions.length === 0) {
			step = questions.length;
			return;
		}

		if (data.response.status === 'submitted') {
			step = questions.length;
			return;
		}

		const firstUnanswered = questions.findIndex(
			(question) => !isQuestionAnswered(question, answers)
		);
		step = firstUnanswered === -1 ? questions.length : firstUnanswered;
	});

	function setError(message: string) {
		actionError = message;
	}

	async function saveBrief(partial = true): Promise<boolean> {
		if (readOnly || questions.length === 0) return true;

		saveState = 'saving';
		actionError = '';

		const formData = buildBriefFormData(questions, answers, { partial });
		const response = await fetch('?/save', { method: 'POST', body: formData });
		const result = deserialize(await response.text());

		if (result.type === 'success') {
			saveState = 'saved';
			return true;
		}

		saveState = 'error';
		setError(
			result.type === 'failure' && typeof result.data?.error === 'string'
				? result.data.error
				: 'Could not save your brief.'
		);
		return false;
	}

	async function goBack() {
		if (isBusy || isFirstStep || onReview) return;
		const saved = await saveBrief(true);
		if (!saved) return;
		step -= 1;
	}

	async function goNext() {
		if (isBusy || onReview) return;
		const saved = await saveBrief(true);
		if (!saved) return;
		step += 1;
	}

	async function handleSave() {
		if (isBusy || readOnly) return;
		await saveBrief(true);
	}

	async function handleSubmit() {
		if (isBusy || readOnly) return;

		submitting = true;
		actionError = '';

		const formData = buildBriefFormData(questions, answers);
		const response = await fetch('?/submit', { method: 'POST', body: formData });
		const result = deserialize(await response.text());

		submitting = false;

		if (result.type === 'success') {
			submitSuccess = true;
			await invalidateAll();
			return;
		}

		setError(
			result.type === 'failure' && typeof result.data?.error === 'string'
				? result.data.error
				: 'Could not submit your brief.'
		);
	}

	async function finishLater() {
		if (isBusy || readOnly) return;
		const saved = await saveBrief(true);
		if (!saved) return;

		const logoutForm = document.getElementById('portal-logout-form') as HTMLFormElement | null;
		logoutForm?.requestSubmit();
	}
</script>

<PageShell width="content">
	<PageHeader title="Brief" lead={briefLead}>
		{#snippet actions()}
			<StatusBadge status={data.response.status} />
			<form id="portal-logout-form" method="POST" action="/portal/logout">
				<Btn variant="secondary" type="submit" icon={LogOut}>Sign out</Btn>
			</form>
		{/snippet}
	</PageHeader>

	{#if data.response.status === 'submitted' && !data.assignment.allowEditsAfterSubmit}
		<div class="card alert-success">
			Your brief has been submitted. Contact your project lead if you need changes.
		</div>
	{/if}

	{#if submitSuccess || form?.submitted}
		<div class="card alert-success">Thanks — your brief has been submitted.</div>
	{/if}

	{#if data.response.status === 'submitted' && data.assignment.allowEditsAfterSubmit && onReview && !submitSuccess}
		<div class="card alert-success">
			Your brief has been submitted. You can still update your answers below and submit again.
		</div>
	{/if}

	{#if actionError || form?.error}
		<div class="card alert-error">{actionError || form?.error}</div>
	{/if}

	{#if questions.length === 0}
		<div class="card">
			<p class="empty-state">This brief has no questions yet. Check back soon.</p>
		</div>
	{:else if onReview || readOnly}
		<BriefReviewPanel
			{questions}
			{answers}
			editable={data.editable && onReview}
			{submitting}
			allowEditsAfterSubmit={data.assignment.allowEditsAfterSubmit}
			onfinishlater={finishLater}
			onsubmit={handleSubmit}
		/>
	{:else if currentQuestion}
		<div class="brief-wizard card">
			<header class="wizard-header">
				<p class="wizard-kicker">{stepLabel}</p>
				<div class="wizard-progress" aria-hidden="true">
					<span
						class="wizard-progress-fill"
						style:width="{((step + 1) / questions.length) * 100}%"
					></span>
				</div>
			</header>

			<div class="wizard-question">
				<QuestionField question={currentQuestion} bind:answers disabled={readOnly} client />
			</div>

			<footer class="wizard-footer">
				<div class="wizard-status">
					{#if isBusy}
						<Spinner size="small" label={submitting ? 'Submitting' : 'Saving'} />
						<span>{submitting ? 'Submitting…' : 'Saving…'}</span>
					{:else if saveState === 'saved'}
						<span>Saved</span>
					{:else if saveState === 'error'}
						<span class="wizard-status-error">Save failed</span>
					{/if}
				</div>

				<div class="wizard-actions">
					<Btn variant="secondary" type="button" disabled={isBusy || isFirstStep} onclick={goBack}>
						Back
					</Btn>
					<Btn variant="secondary" type="button" disabled={isBusy} onclick={handleSave}>
						Save
					</Btn>
					<Btn type="button" disabled={isBusy} onclick={goNext}>
						{isLastQuestionStep ? 'Review' : 'Next'}
					</Btn>
				</div>
			</footer>
		</div>
	{/if}
</PageShell>

<style>
	.brief-wizard {
		display: flex;
		flex-direction: column;
		gap: 1.25rem;
		padding: 1.25rem;
	}

	.wizard-header {
		display: grid;
		gap: 0.65rem;
	}

	.wizard-kicker {
		font-size: 0.875rem;
		font-weight: 600;
		color: var(--color-muted);
	}

	.wizard-progress {
		height: 0.35rem;
		border-radius: var(--radius-lg);
		background: var(--color-border);
		overflow: hidden;
	}

	.wizard-progress-fill {
		display: block;
		height: 100%;
		background: var(--color-accent);
		border-radius: inherit;
		transition: width 0.25s ease;
	}

	.wizard-question {
		padding: 0.25rem 0 0.5rem;
	}

	.wizard-footer {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		justify-content: space-between;
		gap: 0.75rem;
		padding-top: 1rem;
		border-top: 1px solid var(--color-border);
	}

	.wizard-status {
		display: inline-flex;
		align-items: center;
		gap: 0.5rem;
		min-height: 1.25rem;
		font-size: 0.875rem;
		color: var(--color-muted);
	}

	.wizard-status-error {
		color: var(--color-danger, #b42318);
	}

	.wizard-actions {
		display: flex;
		flex-wrap: wrap;
		gap: 0.75rem;
		margin-left: auto;
	}

	.empty-state {
		color: var(--color-muted);
	}

	@media (max-width: 767px) {
		.wizard-footer {
			flex-direction: column;
			align-items: stretch;
		}

		.wizard-actions {
			margin-left: 0;
		}

		.wizard-actions :global(.btn) {
			flex: 1;
		}
	}
</style>
