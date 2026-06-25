<script lang="ts">
	import { enhance } from '$app/forms';
	import CategoryTagPicker from '$lib/components/admin/CategoryTagPicker.svelte';
	import Btn from '$lib/components/Btn.svelte';
	import Alert from '$lib/components/ui/Alert.svelte';
	import Field from '$lib/components/ui/Field.svelte';
	import Modal from '$lib/components/ui/Modal.svelte';
	import Spinner from '$lib/components/ui/Spinner.svelte';
	import { clientsFromActionData, type ClientListRow } from '$lib/admin/clients-sync';
	import type { QuestionCategory } from '$lib/categories';

	let {
		open = $bindable(false),
		session = 0,
		serviceOptions = [],
		action = '/admin/clients?/saveClient',
		onclients,
		onsaved,
		onclose
	}: {
		open?: boolean;
		session?: number;
		serviceOptions?: QuestionCategory[];
		action?: string;
		onclients?: (clients: ClientListRow[]) => void;
		onsaved?: (result: import('@sveltejs/kit').ActionResult) => void | Promise<void>;
		onclose?: () => void;
	} = $props();

	let company = $state('');
	let contactName = $state('');
	let email = $state('');
	let phone = $state('');
	let selectedServices = $state<string[]>([]);
	let saving = $state(false);
	let error = $state('');
	let emailTaken = $state(false);
	let wasOpen = $state(false);

	$effect(() => {
		const justOpened = open && !wasOpen;
		wasOpen = open;

		if (!justOpened) return;

		company = '';
		contactName = '';
		email = '';
		phone = '';
		selectedServices = [];
		error = '';
		emailTaken = false;
		saving = false;
	});

	function handleClose() {
		open = false;
		onclose?.();
	}
</script>

{#if open}
	{#key session}
		<Modal bind:open title="Add client" size="sm" onclose={handleClose}>
			<form
				method="POST"
				{action}
				class="client-form"
				use:enhance={() => {
					saving = true;
					error = '';
					emailTaken = false;

					return async ({ result, update }) => {
						try {
							if (result.type === 'success') {
								const savedClients = clientsFromActionData(result.data);
								if (savedClients) {
									onclients?.(
										savedClients.map((client) => ({
											...client,
											createdAt: client.createdAt.toISOString()
										}))
									);
								}

								await onsaved?.(result);
								await update({ reset: false, invalidateAll: false });
								handleClose();
								return;
							}

							if (result.type === 'failure') {
								const data = result.data ?? {};
								error =
									typeof data.clientError === 'string'
										? data.clientError
										: 'Could not save client.';
								emailTaken = Boolean(data.emailTaken);
							} else if (result.type === 'error') {
								error = 'Could not save client.';
							}

							await update({ reset: false, invalidateAll: false });
						} finally {
							saving = false;
						}
					};
				}}
			>
				<Field labelText="Company" name="company" bind:value={company} required disabled={saving} />
				<Field
					labelText="Point of contact"
					name="contactName"
					bind:value={contactName}
					required
					disabled={saving}
				/>
				<Field labelText="Email" name="email" type="email" bind:value={email} required disabled={saving} />
				<Field
					labelText="Phone"
					name="phone"
					type="tel"
					bind:value={phone}
					helperText="Optional"
					disabled={saving}
				/>

				<CategoryTagPicker
					categories={serviceOptions}
					bind:selected={selectedServices}
					name="services"
					legend="Services"
					placeholder="Search or select services…"
					emptyHint="Create categories in Manage Briefs first. Those become the services you can track here."
					disabled={saving}
				/>
				<p class="services-help">Track the services this client has requested so far.</p>

				{#if error}
					<Alert
						variant="error"
						title={emailTaken ? 'Email already in use' : 'Could not save client'}
						subtitle={error}
					/>
					{#if emailTaken}
						<div class="email-taken-actions">
							<Btn variant="secondary" href="/portal">Sign in to portal</Btn>
							<Btn variant="ghost" href="/portal/forgot-pin">Forgot PIN</Btn>
						</div>
					{/if}
				{/if}

				<div class="modal-actions">
					<Btn variant="secondary" type="button" disabled={saving} onclick={handleClose}>Cancel</Btn>
					<Btn type="submit" disabled={saving}>
						{#if saving}
							<Spinner size="small" label="Saving client" />
						{/if}
						Save client
					</Btn>
				</div>
			</form>
		</Modal>
	{/key}
{/if}

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

	.modal-actions :global(.btn) {
		display: inline-flex;
		align-items: center;
		gap: 0.5rem;
	}

	.email-taken-actions {
		display: flex;
		flex-wrap: wrap;
		gap: 0.75rem;
	}
</style>
