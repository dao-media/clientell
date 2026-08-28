<script lang="ts">
	import { enhance } from '$app/forms';
	import ContractForm from '$lib/components/admin/ContractForm.svelte';
	import ContractPreview from '$lib/components/admin/ContractPreview.svelte';
	import Alert from '$lib/components/ui/Alert.svelte';
	import Btn from '$lib/components/Btn.svelte';
	import PageHeader from '$lib/components/layout/PageHeader.svelte';
	import PageShell from '$lib/components/layout/PageShell.svelte';
	import { assembleContract } from '$lib/contract/assemble';
	import { emptyEditorState, editorStateToContext } from '$lib/contract/editor-state';
	import { computePricing } from '$lib/contract/pricing';
	import { formatCents } from '$lib/contract/money';
	import type { ActionData, PageData } from './$types';

	let { data, form }: { data: PageData; form: ActionData } = $props();

	// svelte-ignore state_referenced_locally
	let state = $state({ ...emptyEditorState(), clientId: data.preselectedClientId });
	const clauses = $derived(data.clauses);

	const selectedClient = $derived(data.clients.find((client) => client.id === state.clientId) ?? null);
	const ctx = $derived(editorStateToContext(state, selectedClient));
	const pricing = $derived(
		computePricing({
			baseFee: ctx.baseFee,
			confidentiality: ctx.confidentiality,
			confidentialityTier: ctx.confidentialityTier,
			premiumPct: ctx.premiumPct,
			premiumFloor: ctx.premiumFloor
		})
	);
	const assembly = $derived(
		assembleContract(clauses, ctx, {
			personalGuarantee: state.personalGuarantee,
			confidentiality: state.confidentiality,
			thirdPartyOption: state.thirdPartyOption || null
		})
	);
</script>

<PageShell width="wide">
	<PageHeader title="New contract" lead="Pick a client, set fees and modules, then save a draft." />

	{#if form?.error}
		<Alert variant="error" title="Could not create contract" message={form.error} />
	{/if}

	<div class="pricing-bar">
		<p>Premium {formatCents(pricing.confidentialityPremium)}</p>
		<p>Total {formatCents(pricing.total)}</p>
		<p>Deposit {formatCents(pricing.deposit)}</p>
		<p>Remaining {formatCents(pricing.remaining)}</p>
	</div>

	<form method="POST" use:enhance class="split">
		<div>
			<ContractForm clients={data.clients} bind:state />
			<div class="actions">
				<Btn variant="ghost" href="/admin/contracts">Cancel</Btn>
				<Btn type="submit">Save draft</Btn>
			</div>
		</div>
		<ContractPreview {assembly} />
	</form>
</PageShell>

<style>
	.split {
		display: grid;
		grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
		gap: 2rem;
		align-items: start;
	}

	.pricing-bar {
		display: flex;
		flex-wrap: wrap;
		gap: 1rem;
		margin-bottom: 1rem;
		font-size: 0.9rem;
	}

	.actions {
		display: flex;
		justify-content: flex-end;
		gap: 0.5rem;
		margin-top: 1rem;
	}

	@media (max-width: 960px) {
		.split {
			grid-template-columns: 1fr;
		}
	}
</style>
