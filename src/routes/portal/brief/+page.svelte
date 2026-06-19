<script lang="ts">
	import { enhance } from '$app/forms';
	import Btn from '$lib/components/Btn.svelte';
	import QuestionField from '$lib/components/QuestionField.svelte';
	import StatusBadge from '$lib/components/StatusBadge.svelte';
	import PageHeader from '$lib/components/layout/PageHeader.svelte';
	import PageShell from '$lib/components/layout/PageShell.svelte';
	import LogOut from '@lucide/svelte/icons/log-out';
	import Send from '@lucide/svelte/icons/send';
	import { attachmentAnswerKey } from '$lib/attachments';
	import type { ActionData, PageData } from './$types';

	let { data, form }: { data: PageData; form: ActionData } = $props();

	let answers = $state<Record<string, unknown>>({});
	let saveState = $state<'idle' | 'saving' | 'saved' | 'error'>('idle');
	let saveTimer: ReturnType<typeof setTimeout> | undefined;
	let readyToAutosave = $state(false);

	$effect.pre(() => {
		answers = { ...(data.response.answers as Record<string, unknown>) };
	});

	const questionIds = $derived(data.questions.map((question) => question.id).join(','));
	const readOnly = $derived(!data.editable);

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

	function scheduleSave() {
		if (readOnly || !readyToAutosave) return;
		saveState = 'saving';
		if (saveTimer) clearTimeout(saveTimer);
		saveTimer = setTimeout(() => {
			const formEl = document.getElementById('brief-form') as HTMLFormElement | null;
			formEl?.requestSubmit(document.getElementById('save-button') as HTMLButtonElement);
		}, 1200);
	}

	$effect(() => {
		for (const question of data.questions) {
			void answers[question.id];
			if (question.allowAttachments) {
				void answers[attachmentAnswerKey(question.id)];
			}
		}
		scheduleSave();
	});

	$effect(() => {
		readyToAutosave = true;
	});
</script>

<PageShell width="content">
	<PageHeader title="Brief" lead={briefLead}>
		{#snippet actions()}
			<StatusBadge status={data.response.status} />
			<form method="POST" action="/portal/logout">
				<Btn variant="secondary" type="submit" icon={LogOut}>Sign out</Btn>
			</form>
		{/snippet}
	</PageHeader>

	{#if data.response.status === 'submitted' && !data.assignment.allowEditsAfterSubmit}
		<div class="card alert-success">
			Your brief has been submitted. Contact your project lead if you need changes.
		</div>
	{/if}

	{#if form?.error}
		<div class="card alert-error">{form.error}</div>
	{/if}

	{#if form?.submitted}
		<div class="card alert-success">Thanks — your brief has been submitted.</div>
	{/if}

	<form
		id="brief-form"
		method="POST"
		class="card form-group bento-tile--full"
		use:enhance={() => {
			return async ({ result, update }) => {
				if (result.type === 'success') {
					saveState = 'saved';
					await update({ reset: false });
				} else if (result.type === 'failure') {
					saveState = 'error';
					await update({ reset: false });
				}
			};
		}}
	>
		<input type="hidden" name="questionIds" value={questionIds} />

		{#each data.questions as question (question.id)}
			<QuestionField {question} bind:answers disabled={readOnly} />
		{/each}

		<div class="form-footer">
			<p class="save-status">
				{#if saveState === 'saving'}
					Saving…
				{:else if saveState === 'saved'}
					All changes saved
				{:else if saveState === 'error'}
					Could not save
				{:else}
					Changes autosave while you work
				{/if}
			</p>

			<div class="form-actions">
				<button
					id="save-button"
					class="hidden"
					type="submit"
					formaction="?/save"
					aria-hidden="true"
					tabindex="-1"
				></button>

				{#if data.editable}
					<Btn type="submit" formaction="?/submit" icon={Send}>
						{data.response.status === 'submitted' ? 'Update submission' : 'Submit brief'}
					</Btn>
				{/if}
			</div>
		</div>
	</form>
</PageShell>

<style>
	.form-footer {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		justify-content: space-between;
		gap: 0.75rem;
		padding-top: 1rem;
		border-top: 1px solid var(--color-border);
	}

	.save-status {
		color: var(--color-muted);
		font-size: 0.875rem;
	}

	.form-actions {
		margin-top: 0;
	}
</style>
