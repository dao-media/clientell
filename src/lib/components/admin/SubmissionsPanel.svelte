<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';
	import Btn from '$lib/components/Btn.svelte';
	import SubmissionReviewModal from '$lib/components/admin/SubmissionReviewModal.svelte';
	import Field from '$lib/components/ui/Field.svelte';
	import Select from '$lib/components/ui/Select.svelte';
	import PageHeader from '$lib/components/layout/PageHeader.svelte';
	import PageShell from '$lib/components/layout/PageShell.svelte';
	import FileText from '@lucide/svelte/icons/file-text';
	import {
		SUBMISSION_STATUS_FILTERS,
		submissionsHrefForView,
		submissionsPageTitle,
		type SubmissionsView
	} from '$lib/admin/submission-filters';
	import type { SubmissionListItem } from '$lib/server/submissions';

	type Filters = {
		search: string;
		clientId: string;
		dateFrom: string;
		dateTo: string;
	};

	let {
		submissions,
		clients,
		filters,
		view
	}: {
		submissions: SubmissionListItem[];
		clients: Array<{ id: string; company: string }>;
		filters: Filters;
		view: SubmissionsView;
	} = $props();

	let search = $state('');
	let clientId = $state('');
	let dateFrom = $state('');
	let dateTo = $state('');
	let reviewOpen = $state(false);
	let reviewAssignmentId = $state<string | null>(null);

	$effect(() => {
		search = filters.search;
		clientId = filters.clientId;
		dateFrom = filters.dateFrom;
		dateTo = filters.dateTo;
	});

	const clientItems = $derived(clients);

	const pageTitle = $derived(submissionsPageTitle(view));

	function currentFilterParams() {
		return {
			search,
			clientId,
			dateFrom,
			dateTo
		};
	}

	function statusFilterHref(targetView: SubmissionsView) {
		return submissionsHrefForView(targetView, currentFilterParams());
	}

	function applyFilters() {
		goto(submissionsHrefForView(view, currentFilterParams()));
	}

	function clearFilters() {
		search = '';
		clientId = '';
		dateFrom = '';
		dateTo = '';
		goto(submissionsHrefForView(view));
	}

	function openReview(submissionId: string) {
		reviewAssignmentId = submissionId;
		reviewOpen = true;
	}

	function statusLabel(status: SubmissionListItem['status']): string {
		if (status === 'submitted') return 'Submitted';
		if (status === 'draft') return 'Pending';
		return 'Not started';
	}

	function formatDate(date: Date | null): string {
		if (!date) return '—';
		return new Intl.DateTimeFormat(undefined, { dateStyle: 'medium' }).format(date);
	}
</script>

<PageShell>
	<PageHeader
		title={pageTitle}
		lead="Filter by brief state, search response content, and open a submission to review answers or take action."
	/>

	<div class="status-filter" role="tablist" aria-label="Brief state">
		{#each SUBMISSION_STATUS_FILTERS as option (option.view)}
			<a
				href={statusFilterHref(option.view)}
				class="status-filter__btn"
				class:active={view === option.view}
				role="tab"
				aria-selected={view === option.view}
			>
				{option.label}
			</a>
		{/each}
	</div>

	<fieldset class="form-group filter-panel">
		<legend class="form-legend">Filters</legend>
		<div class="bento-grid bento-grid--filters">
			<Field
				labelText="Search responses"
				type="search"
				placeholder="Search saved answers, client names, or emails"
				bind:value={search}
				onkeydown={(event: KeyboardEvent) => {
					if (event.key === 'Enter') applyFilters();
				}}
			/>

			<Select labelText="Client" bind:value={clientId}>
				<option value="">All clients</option>
				{#each clientItems as client (client.id)}
					<option value={client.id}>{client.company}</option>
				{/each}
			</Select>

			<Field labelText="From date" type="date" bind:value={dateFrom} />
			<Field labelText="To date" type="date" bind:value={dateTo} />
		</div>

		<div class="filters-actions">
			<Btn onclick={applyFilters}>Apply filters</Btn>
			<Btn variant="ghost" onclick={clearFilters}>Clear</Btn>
		</div>
	</fieldset>

	{#if submissions.length === 0}
		<p class="empty-state">No submissions match your filters.</p>
	{:else}
		<div class="results-meta">{submissions.length} submission{submissions.length === 1 ? '' : 's'}</div>
		<ul class="record-list--stack">
			{#each submissions as submission (submission.id)}
				<li class="record-card card">
					<div class="record-card-head">
						<a class="row-link" href="/admin/submissions/{submission.id}">{submission.clientCompany}</a>
						<span class="status-pill status-{submission.status ?? 'none'}">
							{statusLabel(submission.status)}
						</span>
					</div>
					<p class="row-subtle text-break">
						{submission.clientContact} · {submission.clientEmail}
						{#if submission.clientPhone}
							· {submission.clientPhone}
						{/if}
					</p>
					<dl class="record-card-meta">
						<div>
							<dt>Categories</dt>
							<dd>{submission.categoriesLabel}</dd>
						</div>
						<div>
							<dt>Progress</dt>
							<dd>{submission.progress}%</dd>
						</div>
						<div>
							<dt>Updated</dt>
							<dd>{formatDate(submission.updatedAt ?? submission.createdAt)}</dd>
						</div>
					</dl>
					{#if submission.answerPreview}
						<p class="preview-cell text-break">{submission.answerPreview}</p>
					{/if}
					<div class="record-card-actions">
						<Btn variant="secondary" onclick={() => openReview(submission.id)}>View responses</Btn>
						<Btn variant="ghost" href="/admin/submissions/{submission.id}">Open detail</Btn>
					</div>
				</li>
			{/each}
		</ul>
		<div class="table-wrap table-view--desktop bento-tile--full">
			<table class="submissions-table">
				<thead>
					<tr>
						<th>Company</th>
						<th class="hide-md">Categories</th>
						<th>Status</th>
						<th class="hide-md">Progress</th>
						<th>Updated</th>
						<th class="hide-md">Preview</th>
						<th class="actions-col hide-md"><span class="sr-only">Open responses</span></th>
					</tr>
				</thead>
				<tbody>
					{#each submissions as submission (submission.id)}
						<tr class:selected={$page.url.pathname === `/admin/submissions/${submission.id}`}>
							<td>
								<a class="row-link" href="/admin/submissions/{submission.id}">{submission.clientCompany}</a>
								<div class="row-subtle text-break">
									{submission.clientContact} · {submission.clientEmail}
									{#if submission.clientPhone}
										· {submission.clientPhone}
									{/if}
								</div>
							</td>
							<td class="hide-md">{submission.categoriesLabel}</td>
							<td>
								<span class="status-pill status-{submission.status ?? 'none'}">
									{statusLabel(submission.status)}
								</span>
							</td>
							<td class="hide-md">{submission.progress}%</td>
							<td>{formatDate(submission.updatedAt ?? submission.createdAt)}</td>
							<td class="preview-cell hide-md">{submission.answerPreview || '—'}</td>
							<td class="actions-col hide-md">
								<button
									type="button"
									class="review-button"
									aria-label="View responses for {submission.clientCompany}"
									onclick={() => openReview(submission.id)}
								>
									<FileText size={18} strokeWidth={2} aria-hidden="true" />
								</button>
							</td>
						</tr>
					{/each}
				</tbody>
			</table>
		</div>
	{/if}
</PageShell>

<SubmissionReviewModal
	bind:open={reviewOpen}
	assignmentId={reviewAssignmentId}
	onclose={() => (reviewAssignmentId = null)}
/>

<style>
	fieldset {
		border: 0;
		padding: 0;
		margin: 0;
	}

	.status-filter {
		display: inline-flex;
		flex-wrap: wrap;
		gap: 0.35rem;
		padding: 0.35rem;
		border: 1px solid var(--color-border);
		border-radius: var(--radius-lg);
		background: var(--color-surface-muted);
		width: fit-content;
		max-width: 100%;
	}

	.status-filter__btn {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		min-height: 2.25rem;
		padding: 0.45rem 0.9rem;
		border: 0;
		border-radius: calc(var(--radius-lg) - 2px);
		background: transparent;
		color: var(--color-muted);
		font: inherit;
		font-size: 0.875rem;
		font-weight: 500;
		text-decoration: none;
		cursor: pointer;
	}

	.status-filter__btn:hover {
		color: var(--color-ink);
		background: var(--color-surface-hover);
	}

	.status-filter__btn.active {
		background: var(--color-surface);
		color: var(--color-ink);
		box-shadow: 0 1px 2px rgb(15 23 42 / 0.08);
		font-weight: 600;
	}

	.filter-panel {
		padding: 1rem;
		border: 1px solid var(--color-border);
		border-radius: var(--radius-lg);
		background: var(--color-surface);
	}

	.results-meta {
		color: var(--color-muted);
		font-size: 0.875rem;
	}

	.actions-col {
		width: 3rem;
		text-align: center;
	}

	.review-button {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		width: 2.25rem;
		height: 2.25rem;
		border: 0;
		border-radius: var(--radius-md);
		background: transparent;
		color: var(--color-muted);
		cursor: pointer;
	}

	.review-button:hover {
		color: var(--color-accent);
		background: var(--color-surface-hover);
	}

	.preview-cell {
		color: var(--color-muted);
		font-size: 0.875rem;
		line-height: 1.45;
	}

	.sr-only {
		position: absolute;
		width: 1px;
		height: 1px;
		padding: 0;
		margin: -1px;
		overflow: hidden;
		clip: rect(0, 0, 0, 0);
		white-space: nowrap;
		border: 0;
	}
</style>
