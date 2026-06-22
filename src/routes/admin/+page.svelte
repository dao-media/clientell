<script lang="ts">
	import { page } from '$app/state';
	import { adminDataKeys, refreshOnVisible } from '$lib/admin/refresh-data';
	import Btn from '$lib/components/Btn.svelte';
	import StatusBadge from '$lib/components/StatusBadge.svelte';
	import PageHeader from '$lib/components/layout/PageHeader.svelte';
	import PageShell from '$lib/components/layout/PageShell.svelte';
	import { formatRelativeTime } from '$lib/utils';
	import type { PageData } from './$types';

	const stats = $derived((page.data as PageData).stats);
	const recentAssignments = $derived((page.data as PageData).recentAssignments);

	refreshOnVisible(adminDataKeys.dashboard);
</script>

<PageShell>
	<PageHeader
		title="Dashboard"
		lead="Build briefs, manage clients, track submissions."
	/>

	<div class="bento-grid bento-grid--stats">
		<a class="card bento-tile-link stat-tile" href="/admin/clients">
			<p class="stat-label">Clients</p>
			<p class="stat-value">{stats.clients}</p>
		</a>
		<a class="card bento-tile-link stat-tile" href="/admin/question-sets">
			<p class="stat-label">Categories</p>
			<p class="stat-value">{stats.categories}</p>
		</a>
		<a class="card bento-tile-link stat-tile" href="/admin/submissions/unfinished">
			<p class="stat-label">Pending</p>
			<p class="stat-value">{stats.pending}</p>
		</a>
	</div>

	<div class="card bento-tile--full">
		<div class="section-header">
			<div>
				<h2>Recent submissions</h2>
				<p class="section-lead">Submitted in the last 90 days</p>
			</div>
			<Btn href="/admin/briefs/new">New Brief</Btn>
		</div>

		{#if recentAssignments.length === 0}
			<p class="empty-state">No submissions in the last 90 days.</p>
		{:else}
			<ul class="record-list--stack">
				{#each recentAssignments as assignment (assignment.id)}
					<li class="record-card card">
						<div class="record-card-head">
							<a class="row-link" href="/admin/submissions/{assignment.id}">{assignment.clientCompany}</a>
							{#if assignment.status}
								<StatusBadge status={assignment.status} />
							{:else}
								<span class="status-pill status-none">Not started</span>
							{/if}
						</div>
						<dl class="record-card-meta">
							<div>
								<dt>Categories</dt>
								<dd>{assignment.categoriesLabel}</dd>
							</div>
							<div>
								<dt>Submitted</dt>
								<dd>{formatRelativeTime(new Date(assignment.submittedAt!))}</dd>
							</div>
						</dl>
						<div class="record-card-actions">
							<Btn variant="ghost" href="/admin/submissions/{assignment.id}">Open detail</Btn>
						</div>
					</li>
				{/each}
			</ul>
			<div class="table-wrap table-view--desktop">
				<table class="submissions-table">
					<thead>
						<tr>
							<th>Company</th>
							<th class="hide-md">Categories</th>
							<th>Status</th>
							<th>Submitted</th>
						</tr>
					</thead>
					<tbody>
						{#each recentAssignments as assignment (assignment.id)}
							<tr>
								<td>
									<a href="/admin/submissions/{assignment.id}">{assignment.clientCompany}</a>
								</td>
								<td class="hide-md">{assignment.categoriesLabel}</td>
								<td>
									{#if assignment.status}
										<StatusBadge status={assignment.status} />
									{:else}
										Not started
									{/if}
								</td>
								<td>{formatRelativeTime(new Date(assignment.submittedAt!))}</td>
							</tr>
						{/each}
					</tbody>
				</table>
			</div>
		{/if}
	</div>
</PageShell>

<style>
	.section-lead {
		margin-top: 0.15rem;
		font-size: 0.875rem;
		color: var(--color-muted);
	}
</style>
