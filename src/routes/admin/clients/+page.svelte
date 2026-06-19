<script lang="ts">
	import ClientEditorModal from '$lib/components/admin/ClientEditorModal.svelte';
	import { categoryById } from '$lib/categories';
	import Btn from '$lib/components/Btn.svelte';
	import Alert from '$lib/components/ui/Alert.svelte';
	import PageHeader from '$lib/components/layout/PageHeader.svelte';
	import PageShell from '$lib/components/layout/PageShell.svelte';
	import { formatRelativeTime } from '$lib/utils';
	import type { ActionData, PageData } from './$types';

	let { data, form }: { data: PageData; form: ActionData } = $props();

	let modalOpen = $state(false);
	let editingClient = $state<{
		id?: string;
		company: string;
		contactName: string;
		email: string;
		phone: string;
		services: string[];
	} | null>(null);

	function openAddClient() {
		editingClient = null;
		modalOpen = true;
	}

	function openEditClient(client: (typeof data.clients)[number]) {
		editingClient = {
			id: client.id,
			company: client.company,
			contactName: client.contactName,
			email: client.email,
			phone: client.phone ?? '',
			services: [...client.services]
		};
		modalOpen = true;
	}
</script>

<PageShell>
	<PageHeader
		title="Clients"
		lead="Contact email is used for portal login. Track requested services on each client."
	>
		{#snippet actions()}
			<Btn onclick={openAddClient}>Add client</Btn>
		{/snippet}
	</PageHeader>

	{#if form?.success}
		<Alert variant="success" title="Client saved" />
	{/if}

	{#if data.clients.length === 0}
		<div class="card">
			<p class="empty-state">No clients yet.</p>
			<Btn onclick={openAddClient}>Add your first client</Btn>
		</div>
	{:else}
		<div class="bento-grid bento-grid--cards">
			{#each data.clients as client (client.id)}
				<button type="button" class="card card-clickable client-tile" onclick={() => openEditClient(client)}>
					<p class="client-company">{client.company}</p>
					<p class="client-contact">{client.contactName}</p>
					<p class="client-meta">{client.email}</p>
					{#if client.phone}
						<p class="client-meta">{client.phone}</p>
					{/if}
					{#if client.services.length > 0}
						<div class="client-services" aria-label="Requested services">
							{#each client.services as serviceId (serviceId)}
								{@const service = categoryById(data.serviceOptions, serviceId)}
								{#if service}
									<span class="service-tag" style:--service-color={service.color}>{service.name}</span>
								{/if}
							{/each}
						</div>
					{/if}
					<p class="client-added">Added {formatRelativeTime(new Date(client.createdAt))}</p>
				</button>
			{/each}
		</div>
	{/if}
</PageShell>

<ClientEditorModal
	bind:open={modalOpen}
	client={editingClient}
	serviceOptions={data.serviceOptions}
	error={form?.clientError ?? ''}
	onclose={() => (editingClient = null)}
/>

<style>
	.client-tile {
		width: 100%;
		text-align: left;
	}

	.client-company {
		font-size: 1rem;
		font-weight: 600;
	}

	.client-contact {
		margin-top: 0.35rem;
		font-size: 0.875rem;
	}

	.client-meta,
	.client-added {
		margin-top: 0.25rem;
		color: var(--color-muted);
		font-size: 0.8125rem;
	}

	.client-services {
		display: flex;
		flex-wrap: wrap;
		gap: 0.35rem;
		margin-top: 0.65rem;
	}

	.service-tag {
		display: inline-flex;
		align-items: center;
		padding: 0.15rem 0.55rem;
		border-radius: var(--radius);
		font-size: 0.75rem;
		background: color-mix(in srgb, var(--service-color) 16%, transparent);
		border: 1px solid color-mix(in srgb, var(--service-color) 42%, transparent);
	}

	.client-added {
		margin-top: 0.75rem;
	}

	.empty-state {
		margin-bottom: 1rem;
	}
</style>
