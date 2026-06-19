<script lang="ts">
	import { enhance } from '$app/forms';
	import {
		adminDataKeys,
		refreshAfterClientChange,
		refreshOnVisible
	} from '$lib/admin/refresh-data';
	import ClientCard from '$lib/components/admin/ClientCard.svelte';
	import ClientEditorModal from '$lib/components/admin/ClientEditorModal.svelte';
	import Btn from '$lib/components/Btn.svelte';
	import Alert from '$lib/components/ui/Alert.svelte';
	import PageHeader from '$lib/components/layout/PageHeader.svelte';
	import PageShell from '$lib/components/layout/PageShell.svelte';
	import type { ActionData, PageData } from './$types';

	let { data, form }: { data: PageData; form: ActionData } = $props();

	const clients = $derived(data.clients);
	const serviceOptions = $derived(data.serviceOptions);
	const clientCount = $derived(clients.length);
	const clientCountLabel = $derived(
		clientCount === 1 ? '1 client' : `${clientCount} clients`
	);

	refreshOnVisible(adminDataKeys.clients, adminDataKeys.dashboard);

	let modalOpen = $state(false);
	let selectMode = $state(false);
	let selectedClientIds = $state<string[]>([]);
	let editingClient = $state<{
		id?: string;
		company: string;
		contactName: string;
		email: string;
		phone: string;
		services: string[];
	} | null>(null);

	const selectedCount = $derived(selectedClientIds.length);

	function openAddClient() {
		editingClient = null;
		modalOpen = true;
	}

	function openEditClient(client: (typeof clients)[number]) {
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

	function toggleSelectMode() {
		selectMode = !selectMode;
		if (!selectMode) selectedClientIds = [];
	}

	function toggleClientSelection(clientId: string, checked: boolean) {
		if (checked) {
			if (!selectedClientIds.includes(clientId)) {
				selectedClientIds = [...selectedClientIds, clientId];
			}
		} else {
			selectedClientIds = selectedClientIds.filter((id) => id !== clientId);
		}
	}

	function closeModal() {
		editingClient = null;
	}

	async function afterClientMutation(resultType: string) {
		if (resultType === 'success') {
			await refreshAfterClientChange();
		}
	}

	function confirmBulkDelete(event: SubmitEvent) {
		if (
			!confirm(
				selectedCount === 1
					? 'Delete this client and all of their briefs?'
					: `Delete ${selectedCount} clients and all of their briefs?`
			)
		) {
			event.preventDefault();
		}
	}
</script>

<PageShell>
	<PageHeader
		title="Clients"
		kicker={selectMode && selectedCount > 0
			? `${selectedCount} selected`
			: clientCountLabel}
		lead="Contact email is used for portal login. Track requested services on each client."
	>
		{#snippet actions()}
			{#if selectMode}
				<form
					method="POST"
					action="?/bulkDeleteClients"
					class="page-header-actions-form"
					use:enhance={() => {
						return async ({ result, update }) => {
							await update({ reset: false, invalidateAll: false });
							await afterClientMutation(result.type);
							if (result.type === 'success') {
								selectedClientIds = [];
								selectMode = false;
							}
						};
					}}
					onsubmit={confirmBulkDelete}
				>
					{#each selectedClientIds as clientId (clientId)}
						<input type="hidden" name="clientIds" value={clientId} />
					{/each}

					<Btn type="button" variant="secondary" onclick={toggleSelectMode}>Done</Btn>
					{#if selectedCount > 0}
						<Btn type="submit" variant="danger">Delete</Btn>
					{/if}
				</form>
			{:else}
				<Btn onclick={openAddClient}>Add client</Btn>
				<Btn variant="secondary" onclick={toggleSelectMode} disabled={clientCount === 0}>
					Select
				</Btn>
			{/if}
		{/snippet}
	</PageHeader>

	{#if form?.success && typeof form.deletedCount === 'number'}
		<Alert
			variant="success"
			title={form.deletedCount === 1 ? 'Client deleted' : `${form.deletedCount} clients deleted`}
		/>
	{:else if form?.success && form.deleted}
		<Alert variant="success" title="Client deleted" />
	{:else if form?.success}
		<Alert variant="success" title="Client saved" />
	{/if}

	{#if form?.bulkDeleteError}
		<Alert variant="error" title="Could not delete clients" subtitle={form.bulkDeleteError} />
	{/if}

	{#if form?.deleteError}
		<Alert variant="error" title="Could not delete client" subtitle={form.deleteError} />
	{/if}

	{#if clientCount === 0}
		<div class="card">
			<p class="empty-state">No clients yet.</p>
			<Btn onclick={openAddClient}>Add your first client</Btn>
		</div>
	{:else}
		<div class="admin-card-grid">
			{#each clients as client (client.id)}
				<ClientCard
					{client}
					{serviceOptions}
					{selectMode}
					selected={selectedClientIds.includes(client.id)}
					ontoggle={toggleClientSelection}
					onedit={openEditClient}
				/>
			{/each}
		</div>
	{/if}
</PageShell>

<ClientEditorModal
	bind:open={modalOpen}
	client={editingClient}
	{serviceOptions}
	error={form?.clientError ?? ''}
	deleteError={form?.deleteError ?? ''}
	onclose={closeModal}
	onsaved={refreshAfterClientChange}
/>

<style>
	.page-header-actions-form {
		display: flex;
		flex-wrap: wrap;
		gap: 0.75rem;
		align-items: center;
	}

	.empty-state {
		margin-bottom: 1rem;
		color: var(--color-muted);
	}
</style>
