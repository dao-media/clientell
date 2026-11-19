<script lang="ts">
	import Btn from '$lib/components/Btn.svelte';
	import Alert from '$lib/components/ui/Alert.svelte';
	import Field from '$lib/components/ui/Field.svelte';
	import PageHeader from '$lib/components/layout/PageHeader.svelte';
	import PageShell from '$lib/components/layout/PageShell.svelte';
	import { enhance } from '$app/forms';
	import type { ActionData, PageData } from './$types';

	let { data, form }: { data: PageData; form: ActionData } = $props();
	type ProfileValues = typeof data.profile;
	const values = $derived<ProfileValues>(
		form && 'values' in form && form.values ? (form.values as ProfileValues) : data.profile
	);
</script>

<svelte:head>
	<title>Profile · ClienTell</title>
</svelte:head>

<PageShell>
	<PageHeader
		kicker="Client portal"
		title="Your profile"
		lead="Keep your company and contact details current. Updates show up on new briefs and contracts."
	/>

	{#if form && 'saved' in form && form.saved}
		<Alert
			variant="success"
			title="Profile saved"
			subtitle={form.emailChanged ? 'Use your new email address the next time you sign in.' : ''}
		/>
	{:else if form && 'error' in form && form.error}
		<Alert variant="error" title="Could not save profile" subtitle={form.error} />
	{/if}

	<form method="POST" class="card profile-form" use:enhance={() => async ({ update }) => update({ reset: false })}>
		<div class="form-row">
			<Field labelText="Company name" name="company" id="profile-company" required value={values.company} autocomplete="organization" />
			<Field
				labelText="Legal entity name"
				name="legalName"
				id="profile-legal"
				value={values.legalName}
				helperText="As it should appear on contracts, if different."
			/>
		</div>
		<div class="form-row">
			<Field labelText="Contact name" name="contactName" id="profile-contact" required value={values.contactName} autocomplete="name" />
			<Field labelText="Phone" type="tel" name="phone" id="profile-phone" value={values.phone} autocomplete="tel" />
		</div>
		<Field
			labelText="Email"
			type="email"
			name="email"
			id="profile-email"
			required
			value={values.email}
			autocomplete="email"
			helperText="This is also your sign-in email."
		/>
		<div class="form-actions">
			<Btn type="submit">Save changes</Btn>
		</div>
	</form>
</PageShell>

<style>
	.profile-form {
		display: grid;
		gap: var(--field-gap);
	}

	.form-actions {
		justify-content: flex-end;
	}
</style>
