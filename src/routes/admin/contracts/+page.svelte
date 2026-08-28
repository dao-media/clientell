<script lang="ts">
	import { goto } from '$app/navigation';
	import {
		CONTRACT_STATUS_FILTERS,
		contractsHref,
		parseContractListView
	} from '$lib/admin/contract-filters';
	import Btn from '$lib/components/Btn.svelte';
	import Field from '$lib/components/ui/Field.svelte';
	import Select from '$lib/components/ui/Select.svelte';
	import PageHeader from '$lib/components/layout/PageHeader.svelte';
	import PageShell from '$lib/components/layout/PageShell.svelte';
	import { formatCents } from '$lib/contract/money';
	import { formatRelativeTime } from '$lib/utils';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	// svelte-ignore state_referenced_locally
	let search = $state(data.filters.search);
	// svelte-ignore state_referenced_locally
	let clientId = $state(data.filters.clientId);
	// svelte-ignore state_referenced_locally
	let dateFrom = $state(data.filters.dateFrom);
	// svelte-ignore state_referenced_locally
	let dateTo = $state(data.filters.dateTo);

	function apply() {
		goto(
			contractsHref(parseContractListView(data.filters.status), {
				search,
				clientId,
				dateFrom,
				dateTo
			})
		);
	}
</script>

<PageShell>
	<PageHeader title="Contracts" lead="Generate agreement + SOW packets from a shared client record.">
		{#snippet actions()}
			<Btn href="/admin/contracts/new">New contract</Btn>
		{/snippet}
	</PageHeader>

	<nav class="filter-tabs" aria-label="Contract status">
		{#each CONTRACT_STATUS_FILTERS as item (item.view)}
			<a
				href={contractsHref(item.view, { search, clientId, dateFrom, dateTo })}
				class:active={data.filters.status === item.view || (item.view === 'all' && data.filters.status === 'all')}
			>
				{item.label}
			</a>
		{/each}
	</nav>

	<form
		class="filters"
		onsubmit={(event) => {
			event.preventDefault();
			apply();
		}}
	>
		<Field label="Search" bind:value={search} />
		<Select
			label="Client"
			bind:value={clientId}
			options={[
				{ value: '', text: 'All clients' },
				...data.clients.map((client) => ({ value: client.id, text: client.company }))
			]}
		/>
		<Field label="From" type="date" bind:value={dateFrom} />
		<Field label="To" type="date" bind:value={dateTo} />
		<Btn type="submit">Filter</Btn>
	</form>

	{#if data.contracts.length === 0}
		<p class="empty-state">No contracts match these filters.</p>
	{:else}
		<ul class="record-list--stack">
			{#each data.contracts as row (row.id)}
				<li class="record-card card">
					<div class="record-card-head">
						<a class="row-link" href="/admin/contracts/{row.id}">{row.projectName}</a>
						<span class="status-pill">{row.status}</span>
					</div>
					<dl class="record-card-meta">
						<div>
							<dt>Client</dt>
							<dd>{row.clientCompany}</dd>
						</div>
						<div>
							<dt>Base fee</dt>
							<dd>{formatCents(row.baseFee)}</dd>
						</div>
						<div>
							<dt>Created</dt>
							<dd>{formatRelativeTime(new Date(row.createdAt))}</dd>
						</div>
					</dl>
					<div class="record-card-actions">
						<Btn variant="ghost" href="/admin/contracts/{row.id}">Open</Btn>
					</div>
				</li>
			{/each}
		</ul>
	{/if}
</PageShell>

<style>
	.filter-tabs {
		display: flex;
		gap: 0.75rem;
		margin-bottom: 1rem;
	}

	.filter-tabs a {
		text-decoration: none;
		opacity: 0.7;
	}

	.filter-tabs a.active {
		opacity: 1;
		font-weight: 600;
	}

	.filters {
		display: grid;
		grid-template-columns: 2fr 1fr 1fr 1fr auto;
		gap: 0.75rem;
		align-items: end;
		margin-bottom: 1.25rem;
	}

	.status-pill {
		text-transform: capitalize;
		font-size: 0.8rem;
	}
</style>
