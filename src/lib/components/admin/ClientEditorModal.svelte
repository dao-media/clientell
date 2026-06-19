<script lang="ts">
	import { enhance } from '$app/forms';
	import CategoryTagPicker from '$lib/components/admin/CategoryTagPicker.svelte';
	import Btn from '$lib/components/Btn.svelte';
	import Alert from '$lib/components/ui/Alert.svelte';
	import Field from '$lib/components/ui/Field.svelte';
	import Modal from '$lib/components/ui/Modal.svelte';
	import type { QuestionCategory } from '$lib/categories';

	type ClientDraft = {
		id?: string;
		company: string;
		contactName: string;
		email: string;
		phone: string;
		services: string[];
	};

	let {
		open = $bindable(false),
		client = null,
		serviceOptions = [],
		error = '',
		onclose
	}: {
		open?: boolean;
		client?: ClientDraft | null;
		serviceOptions?: QuestionCategory[];
		error?: string;
		onclose?: () => void;
	} = $props();

	let company = $state('');
	let contactName = $state('');
	let email = $state('');
	let phone = $state('');
	let selectedServices = $state<string[]>([]);

	$effect(() => {
		if (open) {
			company = client?.company ?? '';
			contactName = client?.contactName ?? '';
			email = client?.email ?? '';
			phone = client?.phone ?? '';
			selectedServices = [...(client?.services ?? [])];
		}
	});

	const isEdit = $derived(Boolean(client?.id));
	const title = $derived(isEdit ? 'Edit client' : 'Add client');
	const submitLabel = $derived(isEdit ? 'Save changes' : 'Save client');
</script>

<Modal bind:open {title} size="sm" {onclose}>
	<form
		method="POST"
		action="?/saveClient"
		class="client-form"
		use:enhance={() => {
			return async ({ result, update }) => {
				await update({ reset: false });
				if (result.type === 'success') {
					open = false;
					onclose?.();
				}
			};
		}}
	>
		{#if client?.id}
			<input type="hidden" name="clientId" value={client.id} />
		{/if}

		<Field labelText="Company" name="company" bind:value={company} required />
		<Field labelText="Point of contact" name="contactName" bind:value={contactName} required />
		<Field labelText="Email" name="email" type="email" bind:value={email} required />
		<Field labelText="Phone" name="phone" type="tel" bind:value={phone} helperText="Optional" />

		<CategoryTagPicker
			categories={serviceOptions}
			bind:selected={selectedServices}
			name="services"
			legend="Services"
			placeholder="Search or select services…"
			emptyHint="Create categories in Manage Briefs first. Those become the services you can track here."
		/>
		<p class="services-help">Track the services this client has requested so far.</p>

		{#if error}
			<Alert variant="error" title="Could not save client" subtitle={error} />
		{/if}

		<div class="modal-actions">
			<Btn variant="secondary" type="button" onclick={() => (open = false)}>Cancel</Btn>
			<Btn type="submit">{submitLabel}</Btn>
		</div>
	</form>
</Modal>

<style>
	.client-form {
		display: grid;
		gap: 1rem;
	}

	.services-help {
		margin-top: -0.25rem;
		font-size: 0.8125rem;
		color: var(--color-muted);
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
</style>
