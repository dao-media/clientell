<script lang="ts">
	import { enhance } from '$app/forms';
	import Btn from '$lib/components/Btn.svelte';
	import Alert from '$lib/components/ui/Alert.svelte';
	import AdminProfileFields from '$lib/components/admin/AdminProfileFields.svelte';
	import PageHeader from '$lib/components/layout/PageHeader.svelte';
	import PageShell from '$lib/components/layout/PageShell.svelte';
	import type { ActionData, PageData } from './$types';

	let { data, form }: { data: PageData; form: ActionData } = $props();

	const errors = $derived((form && 'errors' in form ? form.errors : {}) as Record<string, string>);
	const values = $derived<Record<string, string>>(
		data.profile
			? {
					email: data.profile.email,
					firstName: data.profile.firstName,
					lastName: data.profile.lastName,
					businessName: data.profile.businessName,
					phone: data.profile.phone ?? '',
					website: data.profile.website ?? ''
				}
			: {}
	);
</script>

<svelte:head>
	<title>Profile · ClienTell admin</title>
</svelte:head>

<PageShell>
	<PageHeader
		kicker="Admin"
		title="Your profile"
		lead="These details fill the Designer slots in your contracts (name, business, email, phone, website)."
	/>

	{#if !data.profile}
		<Alert
			variant="warning"
			title="Admin setup isn't finished"
			subtitle="You're signed in with the ADMIN_PASSWORD fallback. Sign out, then choose “Setup admin account” to create your profile."
		/>
	{:else}
		{#if form && 'saved' in form && form.saved}
			<Alert
				variant="success"
				title="Profile saved"
				subtitle={form.passwordChanged ? 'Your new password is active.' : ''}
			/>
		{:else if errors.form}
			<Alert variant="error" title="Could not save" subtitle={errors.form} />
		{/if}

		<form
			method="POST"
			class="card profile-form"
			novalidate
			use:enhance={() => async ({ update }) => update({ reset: false })}
		>
			{#key data.profile.updatedAt}
				<AdminProfileFields
					{values}
					{errors}
					socialLinks={data.profile.socialLinks ?? []}
					minPasswordLength={data.minPasswordLength}
					passwordMode="change"
				/>
			{/key}
			<div class="form-actions">
				<Btn type="submit">Save profile</Btn>
			</div>
		</form>
	{/if}
</PageShell>

<style>
	.profile-form {
		display: grid;
		gap: var(--section-gap);
	}

	.form-actions {
		display: flex;
		justify-content: flex-end;
	}
</style>
