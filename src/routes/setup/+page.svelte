<script lang="ts">
	import { base } from '$app/paths';
	import Btn from '$lib/components/Btn.svelte';
	import Field from '$lib/components/ui/Field.svelte';
	import AdminProfileFields from '$lib/components/admin/AdminProfileFields.svelte';
	import PageHeader from '$lib/components/layout/PageHeader.svelte';
	import PageShell from '$lib/components/layout/PageShell.svelte';
	import type { ActionData, PageData } from './$types';

	let { data, form }: { data: PageData; form: ActionData } = $props();

	const errors = $derived((form?.errors ?? {}) as Record<string, string>);
	const values = $derived((form?.values ?? {}) as Record<string, string>);
</script>

<svelte:head>
	<title>Set up your admin account · ClienTell</title>
</svelte:head>

<PageShell>
	<PageHeader
		kicker="Admin setup"
		title="Set up your admin account"
		lead="These details fill the Designer slots in your contracts. You can edit them later under Profile."
	/>

	<form method="POST" class="card setup-form" novalidate>
		{#if data.setupKeyRequired}
			<fieldset class="form-section">
				<legend class="form-section__legend">Verify ownership</legend>
				<Field
					labelText="Setup key"
					type="password"
					name="setupKey"
					id="setup-key"
					autocomplete="off"
					required
					helperText="The ADMIN_PASSWORD value configured for this deployment."
					invalidText={errors.setupKey}
				/>
			</fieldset>
		{/if}

		<AdminProfileFields
			{values}
			{errors}
			socialLinks={form?.socialLinks ?? []}
			minPasswordLength={data.minPasswordLength}
		/>

		<div class="form-actions">
			<Btn variant="ghost" href="{base}/">Cancel</Btn>
			<Btn type="submit">Create account</Btn>
		</div>
	</form>
</PageShell>

<style>
	.setup-form {
		display: grid;
		gap: var(--section-gap);
	}

	.setup-form .form-actions {
		justify-content: flex-end;
	}
</style>
