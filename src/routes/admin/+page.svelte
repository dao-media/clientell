<script lang="ts">
	import Btn from '$lib/components/Btn.svelte';
	import StatusBadge from '$lib/components/StatusBadge.svelte';
	import PageHeader from '$lib/components/layout/PageHeader.svelte';
	import PageShell from '$lib/components/layout/PageShell.svelte';
	import { formatRelativeTime } from '$lib/utils';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();
</script>

<PageShell>
	<PageHeader
		title="Dashboard"
		lead="Build briefs, manage clients, track submissions."
	/>

	<div class="bento-grid bento-grid--stats">
		<div class="card">
			<p class="stat-label">Clients</p>
			<p class="stat-value">{data.stats.clients}</p>
		</div>
		<div class="card">
			<p class="stat-label">Categories</p>
			<p class="stat-value">{data.stats.categories}</p>
		</div>
		<div class="card">
			<p class="stat-label">Outstanding</p>
			<p class="stat-value">{data.stats.assignments}</p>
		</div>
	</div>

	<div class="card bento-tile--full">
		<div class="section-header">
			<h2>Recent submissions</h2>
			<Btn href="/admin/briefs/new">New Brief</Btn>
		</div>

		{#if data.recentAssignments.length === 0}
			<p class="empty-state">No submissions yet.</p>
		{:else}
			<div class="table-wrap">
				<table class="submissions-table">
					<thead>
						<tr>
							<th>Company</th>
							<th>Categories</th>
							<th>Status</th>
							<th>Created</th>
						</tr>
					</thead>
					<tbody>
						{#each data.recentAssignments as assignment (assignment.id)}
							<tr>
								<td>
									<a href="/admin/submissions/{assignment.id}">{assignment.clientCompany}</a>
								</td>
								<td>{assignment.categoriesLabel}</td>
								<td>
									{#if assignment.status}
										<StatusBadge status={assignment.status} />
									{:else}
										Not started
									{/if}
								</td>
								<td>{formatRelativeTime(new Date(assignment.createdAt))}</td>
							</tr>
						{/each}
					</tbody>
				</table>
			</div>
		{/if}
	</div>
</PageShell>
