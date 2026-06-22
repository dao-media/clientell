<script lang="ts">
	import Btn from '$lib/components/Btn.svelte';
	import Alert from '$lib/components/ui/Alert.svelte';
	import Field from '$lib/components/ui/Field.svelte';
	import PageHeader from '$lib/components/layout/PageHeader.svelte';
	import PageShell from '$lib/components/layout/PageShell.svelte';
	import type { ActionData } from './$types';

	let { form }: { form: ActionData } = $props();
</script>

<PageShell width="form">
	<PageHeader title="Add client" lead="The contact email is used for portal sign-in. The same email can be used for multiple clients." />

	<div class="card">
		<form method="POST" class="form-group">
			<fieldset class="form-group">
				<legend class="form-legend">Client details</legend>
				<Field labelText="Company" name="company" required />
				<Field labelText="Point of contact" name="contactName" required />
				<Field labelText="Email" name="email" type="email" required />
				<Field labelText="Phone" name="phone" type="tel" helperText="Optional" />
			</fieldset>

			{#if form?.error}
				<Alert variant="error" title="Could not save client" subtitle={form.error} />
			{/if}

			<div class="form-actions">
				<Btn type="submit">Save client</Btn>
				<Btn variant="secondary" href="/admin/clients">Cancel</Btn>
			</div>
		</form>
	</div>
</PageShell>

<style>
	fieldset {
		border: 0;
		padding: 0;
		margin: 0;
	}
</style>
