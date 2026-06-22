<script lang="ts">
	import { page } from '$app/stores';
	import Btn from '$lib/components/Btn.svelte';
	import Alert from '$lib/components/ui/Alert.svelte';
	import Checkbox from '$lib/components/ui/Checkbox.svelte';
	import Select from '$lib/components/ui/Select.svelte';
	import CategoryCheckboxGroup from '$lib/components/admin/CategoryCheckboxGroup.svelte';
	import PageHeader from '$lib/components/layout/PageHeader.svelte';
	import PageShell from '$lib/components/layout/PageShell.svelte';
	import type { ActionData, PageData } from './$types';

	let { data, form }: { data: PageData; form: ActionData } = $props();

	let clientId = $state('');
	let allowEditsAfterSubmit = $state(true);
	let briefCategories = $state<string[]>([]);

	const selectedClient = $derived(data.clients.find((client) => client.id === clientId));

	$effect(() => {
		const presetClientId = $page.url.searchParams.get('client');
		if (presetClientId && data.clients.some((client) => client.id === presetClientId)) {
			clientId = presetClientId;
		}
	});

	$effect(() => {
		const client = selectedClient;
		const validIds = new Set(data.workspace.categories.map((category) => category.id));
		briefCategories = (client?.services ?? []).filter((id) => validIds.has(id));
	});
</script>

<PageShell width="form">
	<PageHeader title="New Brief" lead="Choose a client and the categories this brief should cover." />

	{#if form?.success}
		<Alert
			variant="success"
			title="Brief created"
			subtitle="Share the PIN with the client yourself, or send the brief from the submission page when you're ready."
		/>
		<div class="card">
			<p><strong>Portal:</strong> {form.portalUrl}</p>
			<p><strong>Login email:</strong> {form.clientEmail}</p>
			<p><strong>PIN:</strong> {form.pin}</p>
			{#if form.briefCategories}
				<p><strong>Categories:</strong> {form.briefCategories}</p>
			{/if}
			<div class="form-actions">
				<Btn href="/admin/submissions/{form.assignmentId}">Open submission</Btn>
				<Btn
					variant="secondary"
					href="/admin/submissions/{form.assignmentId}/preview"
					target="_blank"
					rel="noopener"
				>
					Preview brief
				</Btn>
				<Btn variant="secondary" href="/admin/briefs/new">Create another</Btn>
			</div>
		</div>
	{:else}
		<form method="POST" class="form-group">
			<input type="hidden" name="clientId" value={clientId} />
			<fieldset class="form-group">
				<legend class="form-legend">Brief details</legend>
				<Select labelText="Client" bind:value={clientId}>
					<option value="">Select a client</option>
					{#each data.clients as client (client.id)}
						<option value={client.id}>{client.company} ({client.contactName}, {client.email})</option>
					{/each}
				</Select>

				{#if data.workspace.categories.length > 0}
					<CategoryCheckboxGroup
						categories={data.workspace.categories}
						bind:selected={briefCategories}
						legend="Categories for this brief"
						required
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
				/>
			</fieldset>

			{#if form?.error}
				<Alert variant="error" title="Could not create brief" subtitle={form.error} />
			{/if}

			<div class="form-actions">
				<Btn
					type="submit"
					disabled={!clientId || data.workspace.categories.length === 0}
				>
					Create brief
				</Btn>
				<Btn variant="secondary" href="/admin">Cancel</Btn>
			</div>
		</form>
	{/if}
</PageShell>

<style>
	fieldset {
		border: 0;
		padding: 0;
		margin: 0;
	}
</style>
