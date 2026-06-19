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
		view: 'all' | 'unfinished' | 'completed';
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

	const titles: Record<typeof view, string> = {
		all: 'All submissions',
		unfinished: 'Unfinished submissions',
		completed: 'Completed submissions'
	};

	function applyFilters() {
		const params = new URLSearchParams();
		if (search.trim()) params.set('q', search.trim());
		if (clientId) params.set('client', clientId);
		if (dateFrom) params.set('from', dateFrom);
		if (dateTo) params.set('to', dateTo);

		const base =
			view === 'all'
				? '/admin/submissions'
				: view === 'unfinished'
					? '/admin/submissions/unfinished'
					: '/admin/submissions/completed';

		const query = params.toString();
		goto(query ? `${base}?${query}` : base);
	}

	function clearFilters() {
		search = '';
		clientId = '';
		dateFrom = '';
		dateTo = '';
		const base =
			view === 'all'
				? '/admin/submissions'
				: view === 'unfinished'
					? '/admin/submissions/unfinished'
					: '/admin/submissions/completed';
		goto(base);
	}

	function openReview(submissionId: string) {
		reviewAssignmentId = submissionId;
		reviewOpen = true;
	}

	function statusLabel(status: SubmissionListItem['status']): string {
		if (status === 'submitted') return 'Completed';
		if (status === 'draft') return 'Unfinished';
		return 'Not started';
	}

	function formatDate(date: Date | null): string {
		if (!date) return '—';
		return new Intl.DateTimeFormat(undefined, { dateStyle: 'medium' }).format(date);
	}
</script>

<PageShell>
	<PageHeader
		title={titles[view]}
		lead="Search response content and open a submission to review answers or take action."
	/>

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
