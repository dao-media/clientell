<script lang="ts">
	import { enhance } from '$app/forms';
	import ContractDocument from '$lib/components/contract/ContractDocument.svelte';
	import Alert from '$lib/components/ui/Alert.svelte';
	import Btn from '$lib/components/Btn.svelte';
	import type { ActionData, PageData } from './$types';

	let { data, form }: { data: PageData; form: ActionData } = $props();
	// svelte-ignore state_referenced_locally
	let clientPng = $state(data.signatures.clientPng);
</script>

<svelte:head>
	<title>{data.contract.projectName} · Contract</title>
</svelte:head>

<div class="sign-page">
	<header class="lead">
		<h1>{data.contract.projectName}</h1>
		<p>
			Review the agreement, then sign in the Client box with your cursor or finger. Saving your
			signature is legally binding under Section 19.6.
		</p>
	</header>

	{#if form?.error}
		<Alert variant="error" title="Could not save signature" message={form.error} />
	{/if}
	{#if form?.signed || data.signatures.clientPng}
		<Alert
			variant="success"
			title="Signed"
			message="Your signature is on the contract. You can download a PDF copy below."
		/>
	{/if}

	<ContractDocument
		assembly={data.assembly}
		signatures={data.signatures}
		role="client"
		bind:clientPng
	/>

	<form method="POST" action="?/sign" use:enhance class="sign-actions">
		<input type="hidden" name="signature" value={clientPng ?? ''} />
		<Btn type="submit" disabled={!clientPng || Boolean(data.signatures.clientPng)}>
			Save my signature
		</Btn>
		<Btn variant="ghost" href="/api/contracts/download/{data.token}">Download PDF</Btn>
	</form>
</div>

<style>
	.sign-page {
		display: grid;
		gap: 1.5rem;
		justify-items: center;
		padding-bottom: 3rem;
	}

	.lead {
		width: min(595px, 100%);
	}

	.lead h1 {
		margin: 0 0 0.5rem;
		font-size: 1.5rem;
	}

	.lead p {
		margin: 0;
		color: var(--color-muted);
		line-height: 1.45;
	}

	.sign-actions {
		display: flex;
		flex-wrap: wrap;
		gap: 0.75rem;
		position: sticky;
		bottom: 1rem;
		padding: 0.75rem 1rem;
		background: var(--color-surface);
		border: 1px solid var(--color-border);
		border-radius: 8px;
		box-shadow: 0 8px 24px rgba(15, 23, 42, 0.08);
	}
</style>
