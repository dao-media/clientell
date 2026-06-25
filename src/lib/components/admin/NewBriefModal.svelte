<script lang="ts">
	import { enhance } from '$app/forms';
	import {
		clientsFromActionData,
		normalizeClients,
		reloadClientsPageData,
		type ClientListRow
	} from '$lib/admin/clients-sync';
	import type { QuestionCategory } from '$lib/categories';
	import AddClientModal from '$lib/components/admin/AddClientModal.svelte';
	import CategoryCheckboxGroup from '$lib/components/admin/CategoryCheckboxGroup.svelte';
	import ClientTagPicker from '$lib/components/admin/ClientTagPicker.svelte';
	import Btn from '$lib/components/Btn.svelte';
	import Alert from '$lib/components/ui/Alert.svelte';
	import Checkbox from '$lib/components/ui/Checkbox.svelte';
	import Modal from '$lib/components/ui/Modal.svelte';
	import Spinner from '$lib/components/ui/Spinner.svelte';
	import type { BriefClientOption } from '$lib/server/submissions-page';

	let {
		open = $bindable(false),
		briefClients: initialBriefClients,
		serviceOptions,
		onclose
	}: {
		open?: boolean;
		briefClients: BriefClientOption[];
		serviceOptions: QuestionCategory[];
		onclose?: () => void;
	} = $props();

	let clientId = $state('');
	let allowEditsAfterSubmit = $state(true);
	let briefCategories = $state<string[]>([]);
	let saving = $state(false);
	let briefError = $state('');
	let briefClientsOverride = $state<BriefClientOption[] | null>(null);
	let addModalOpen = $state(false);
	let addSession = $state(0);
	let wasOpen = $state(false);

	const briefClients = $derived(briefClientsOverride ?? initialBriefClients);
	const selectedClient = $derived(briefClients.find((client) => client.id === clientId) ?? null);
	const canSubmit = $derived(
		Boolean(clientId) && serviceOptions.length > 0 && briefCategories.length > 0
	);

	$effect(() => {
		const justOpened = open && !wasOpen;
		wasOpen = open;

		if (!justOpened) return;

		clientId = '';
		allowEditsAfterSubmit = true;
		briefCategories = [];
		saving = false;
		briefError = '';
		briefClientsOverride = null;
	});

	$effect(() => {
		const client = selectedClient;
		if (!client) return;

		const validIds = new Set(serviceOptions.map((category) => category.id));
		briefCategories = client.services.filter((id) => validIds.has(id));
	});

	function handleClose() {
		open = false;
		onclose?.();
	}

	function openAddClient() {
		addSession += 1;
		addModalOpen = true;
	}

	function briefClientFromRow(client: ClientListRow): BriefClientOption {
		return {
			id: client.id,
			company: client.company,
			contactName: client.contactName,
			email: client.email,
			services: client.services
		};
	}

	function handleClientsUpdated(rows: ClientListRow[]) {
		const normalized = normalizeClients(rows).map(briefClientFromRow);
		const previousIds = new Set(briefClients.map((client) => client.id));
		briefClientsOverride = normalized;

		const added = normalized.find((client) => !previousIds.has(client.id));
		if (added) {
			clientId = added.id;
		}
	}
</script>

{#if open}
	<Modal bind:open title="New Brief" onclose={handleClose}>
		<p class="modal-lead">Choose a client and the categories this brief should cover.</p>

		<form
			method="POST"
			action="?/createBrief"
			class="brief-form"
			use:enhance={() => {
				saving = true;
				briefError = '';

				return async ({ result, update }) => {
					try {
						if (result.type === 'redirect') {
							handleClose();
							await update();
							return;
						}

						if (result.type === 'failure') {
							const data = result.data ?? {};
							briefError =
								typeof data.briefError === 'string'
									? data.briefError
									: 'Could not create brief.';
						}

						await update({ reset: false });
					} finally {
						saving = false;
					}
				};
			}}
		>
			<ClientTagPicker
				clients={briefClients}
				bind:selectedId={clientId}
				name="clientId"
				required
				disabled={saving}
				onaddclient={openAddClient}
			/>

			{#if serviceOptions.length > 0}
				<CategoryCheckboxGroup
					categories={serviceOptions}
					bind:selected={briefCategories}
					legend="Categories for this brief"
					required
					disabled={saving}
				/>
			{:else}
				<Alert
					variant="info"
					title="Add categories first"
					subtitle="Create categories in Manage Briefs before sending a client brief."
				/>
			{/if}

			<Checkbox
				labelText="Allow edits after submit"
				name="allowEditsAfterSubmit"
				bind:checked={allowEditsAfterSubmit}
				disabled={saving}
			/>

			{#if briefError}
				<Alert variant="error" title="Could not create brief" subtitle={briefError} />
			{/if}

			<div class="modal-actions">
				<Btn variant="secondary" type="button" disabled={saving} onclick={handleClose}>Cancel</Btn>
				<Btn type="submit" disabled={saving || !canSubmit}>
					{#if saving}
						<Spinner size="small" label="Creating brief" />
					{/if}
					Create brief
				</Btn>
			</div>
		</form>
	</Modal>
{/if}

<AddClientModal
	bind:open={addModalOpen}
	session={addSession}
	{serviceOptions}
	onclients={handleClientsUpdated}
	onsaved={async (result) => {
		if (result.type === 'success') {
			const savedClients = clientsFromActionData(result.data);
			if (savedClients) {
				handleClientsUpdated(
					savedClients.map((client) => ({
						...client,
						createdAt: client.createdAt.toISOString()
					}))
				);
			}

			await reloadClientsPageData();
		}
	}}
/>

<style>
	.modal-lead {
		margin: 0 0 1rem;
		font-size: 0.9375rem;
		color: var(--color-muted);
	}

	.brief-form {
		display: grid;
		gap: 1rem;
	}

	.modal-actions {
		display: flex;
		justify-content: flex-end;
		gap: 0.75rem;
		flex-wrap: wrap;
		padding-top: 0.5rem;
		border-top: 1px solid var(--color-border);
		margin-top: 0.5rem;
	}

	.modal-actions :global(.btn) {
		display: inline-flex;
		align-items: center;
		gap: 0.5rem;
	}
</style>
