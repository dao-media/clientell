<script lang="ts">
	import { enhance } from '$app/forms';
	import {
		clientsFromActionData,
		normalizeClients,
		reloadClientsPageData,
		type ClientListRow
	} from '$lib/admin/clients-sync';
	import type { ClientListItem } from '$lib/admin/clients-list';
	import AddClientModal from '$lib/components/admin/AddClientModal.svelte';
	import ClientCard from '$lib/components/admin/ClientCard.svelte';
	import ClientEditorModal from '$lib/components/admin/ClientEditorModal.svelte';
	import Btn from '$lib/components/Btn.svelte';
	import Alert from '$lib/components/ui/Alert.svelte';
	import AdminCardGrid from '$lib/components/layout/AdminCardGrid.svelte';
	import PageHeader from '$lib/components/layout/PageHeader.svelte';
	import PageShell from '$lib/components/layout/PageShell.svelte';
	import type { ActionData, PageData } from './$types';

	let { data, form }: { data: PageData; form: ActionData } = $props();

	let clientsOverride = $state<ClientListItem[] | null>(null);
	let addModalOpen = $state(false);
	let addSession = $state(0);
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
	let editModalOpen = $state(false);

	const serviceOptions = $derived(data.serviceOptions);
	const clients = $derived(clientsOverride ?? normalizeClients(data.clients));
	const clientCount = $derived(clients.length);
	const clientCountLabel = $derived(
		clientCount === 1 ? '1 client' : `${clientCount} clients`
	);
	const selectedCount = $derived(selectedClientIds.length);

	function applyClients(rows: ClientListRow[]) {
		clientsOverride = normalizeClients(rows);
	}

	async function afterClientSaved(result: import('@sveltejs/kit').ActionResult) {
		const fromAction = result.type === 'success' ? clientsFromActionData(result.data) : null;
		if (fromAction) {
			clientsOverride = fromAction;
		}

		await reloadClientsPageData();
		clientsOverride = null;
	}

	function openAddClient() {
		editingClient = null;
		addSession += 1;
		addModalOpen = true;
	}

	function openEditClient(client: ClientListItem) {
		editingClient = {
			id: client.id,
			company: client.company,
			contactName: client.contactName,
			email: client.email,
			phone: client.phone ?? '',
			services: [...client.services]
		};
		editModalOpen = true;
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

	function closeEditModal() {
		editModalOpen = false;
		editingClient = null;
	}

	async function afterClientMutation(
		result: import('@sveltejs/kit').ActionResult,
		update: (options?: { reset?: boolean; invalidateAll?: boolean }) => Promise<void>
	) {
		if (result.type === 'success') {
			await afterClientSaved(result);
		}

		await update({ reset: false, invalidateAll: false });
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
		lead="Each client has one portal email. Clients sign in with that email and their PIN. Track requested services on each client."
	>
		{#snippet actions()}
			{#if selectMode}
				<form
					method="POST"
					action="?/bulkDeleteClients"
					class="page-header-actions-form"
					use:enhance={() => {
						return async ({ result, update }) => {
							if (result.type === 'success') {
								selectedClientIds = [];
								selectMode = false;
							}

							await afterClientMutation(result, update);
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

	{#if form?.clientError}
		<Alert
			variant="error"
			title={'emailTaken' in form && form.emailTaken ? 'Email already in use' : 'Could not save client'}
			subtitle={form.clientError}
		/>
		{#if 'emailTaken' in form && form.emailTaken}
			<p class="email-taken-actions">
				<Btn variant="secondary" href="/portal">Sign in to portal</Btn>
				<Btn variant="ghost" href="/portal/forgot-pin">Forgot PIN</Btn>
			</p>
		{/if}
	{/if}

	{#if form?.bulkDeleteError}
		<Alert variant="error" title="Could not delete clients" subtitle={form.bulkDeleteError} />
	{/if}

	{#if form?.deleteError}
		<Alert variant="error" title="Could not delete client" subtitle={form.deleteError} />
	{/if}

	<AdminCardGrid>
		{#if clientCount === 0}
			<div class="card empty-panel">
				<p class="empty-state">No clients yet.</p>
				<Btn onclick={openAddClient}>Add your first client</Btn>
			</div>
		{:else}
			{#each clients as client (client.id)}
				<ClientCard
					{client}
					{selectMode}
					selected={selectedClientIds.includes(client.id)}
					ontoggle={toggleClientSelection}
					onedit={openEditClient}
				/>
			{/each}
		{/if}
	</AdminCardGrid>
</PageShell>

<AddClientModal
	bind:open={addModalOpen}
	session={addSession}
	{serviceOptions}
	onclients={applyClients}
	onsaved={afterClientSaved}
/>

{#if editingClient}
	<ClientEditorModal
		bind:open={editModalOpen}
		client={editingClient}
		{serviceOptions}
		clientError={form?.clientError ?? ''}
		deleteError={form?.deleteError ?? ''}
		onsaved={afterClientSaved}
		onclose={closeEditModal}
	/>
{/if}

<style>
	.page-header-actions-form {
		display: flex;
		flex-wrap: wrap;
		gap: 0.75rem;
		align-items: center;
	}

	.empty-panel {
		grid-column: 1 / -1;
	}

	.empty-state {
		margin-bottom: 1rem;
		color: var(--color-muted);
	}

	.email-taken-actions {
		display: flex;
		flex-wrap: wrap;
		gap: 0.75rem;
		margin: 0 0 1rem;
	}
</style>
