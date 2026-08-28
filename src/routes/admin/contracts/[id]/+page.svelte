<script lang="ts">
	import { enhance } from '$app/forms';
	import ContractForm from '$lib/components/admin/ContractForm.svelte';
	import ContractPreview from '$lib/components/admin/ContractPreview.svelte';
	import Alert from '$lib/components/ui/Alert.svelte';
	import Btn from '$lib/components/Btn.svelte';
	import PageHeader from '$lib/components/layout/PageHeader.svelte';
	import PageShell from '$lib/components/layout/PageShell.svelte';
	import { assembleContract } from '$lib/contract/assemble';
	import {
		emptyEditorState,
		editorStateToContext,
		isoDateInput
	} from '$lib/contract/editor-state';
	import { centsToDollarInput, formatCents } from '$lib/contract/money';
	import { computePricing } from '$lib/contract/pricing';
	import type { ActionData, PageData } from './$types';

	let { data, form }: { data: PageData; form: ActionData } = $props();

	function stateFromData(page: PageData) {
		const next = emptyEditorState();
		next.clientId = page.client.id;
		next.projectName = page.contract.projectName;
		next.description = page.contract.description ?? '';
		next.deliverables = page.contract.deliverables?.length
			? page.contract.deliverables
			: next.deliverables;
		next.outOfScope = (page.contract.outOfScope ?? []).join('\n');
		next.approvalStages = (page.contract.approvalStages ?? []).join('\n');
		next.milestones = page.contract.milestones?.length ? page.contract.milestones : next.milestones;
		next.estimatedStart = isoDateInput(page.contract.estimatedStart);
		next.baseFee = centsToDollarInput(page.contract.baseFee);
		next.overageRate = centsToDollarInput(page.contract.overageRate);
		next.remainingStructure = page.contract.remainingStructure;
		next.thirdPartyOption = page.contract.thirdPartyOption ?? '';
		next.handlingPct = String(page.contract.handlingPct);
		next.perItemThreshold = centsToDollarInput(page.contract.perItemThreshold);
		next.serviceOwnership = page.contract.serviceOwnership?.length
			? page.contract.serviceOwnership
			: next.serviceOwnership;
		next.personalGuarantee = page.contract.personalGuarantee;
		next.confidentiality = page.contract.confidentiality;
		next.confidentialityTier = page.contract.confidentialityTier;
		next.premiumPct = String(page.contract.premiumPct);
		next.premiumFloor = centsToDollarInput(page.contract.premiumFloor);
		next.governingState = page.contract.governingState;
		next.venueCounty = page.contract.venueCounty ?? '';
		return next;
	}

	// svelte-ignore state_referenced_locally
	let state = $state(stateFromData(data));

	const ctx = $derived(editorStateToContext(state, data.client));
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
		assembleContract(data.clauses, ctx, {
			personalGuarantee: state.personalGuarantee,
			confidentiality: state.confidentiality,
			thirdPartyOption: state.thirdPartyOption || null
		})
	);

	// svelte-ignore state_referenced_locally
	let designerPng = $state(data.contract.designerSignature ?? null);

	const signatures = $derived({
		clientPng: data.contract.clientSignature,
		designerPng: data.contract.designerSignature,
		clientSignedAt: data.contract.clientSignedAt,
		designerSignedAt: data.contract.designerSignedAt
	});
</script>

<PageShell width="wide">
	<PageHeader title={data.contract.projectName} lead={`${data.client.company} · ${data.contract.status}`}>
		{#snippet actions()}
			<Btn variant="ghost" href="/admin/contracts">All contracts</Btn>
		{/snippet}
	</PageHeader>

	{#if form?.error}
		<Alert variant="error" title="Could not update contract" message={form.error} />
	{/if}
	{#if form?.saved}
		<Alert variant="success" title="Saved" message="Draft updated." />
	{/if}
	{#if form?.signedDesigner}
		<Alert variant="success" title="Signature saved" message="Your designer signature is on the contract." />
	{/if}

	<div class="pricing-bar">
		<p>Premium {formatCents(pricing.confidentialityPremium)}</p>
		<p>Total {formatCents(pricing.total)}</p>
		<p>Deposit {formatCents(pricing.deposit)}</p>
		<p>Remaining {formatCents(pricing.remaining)}</p>
	</div>

	<div class="toolbar">
		<form method="POST" action="?/exportPdf" use:enhance>
			<Btn type="submit" variant="secondary" disabled={assembly.missing.length > 0}>Export PDF</Btn>
		</form>
		<form method="POST" action="?/send" use:enhance>
			<Btn type="submit" disabled={assembly.missing.length > 0}>Send to client</Btn>
		</form>
		{#if data.contract.status !== 'draft'}
			<form method="POST" action="?/reopen" use:enhance>
				<Btn type="submit" variant="ghost">Reopen</Btn>
			</form>
		{/if}
		{#if data.contract.status === 'sent'}
			<form method="POST" action="?/markSigned" use:enhance>
				<Btn type="submit" variant="ghost">Mark signed</Btn>
			</form>
		{/if}
		<Btn variant="ghost" href="/admin/contracts/{data.contract.id}/pdf">Download last PDF</Btn>
	</div>

	<div class="split">
		<form method="POST" action="?/save" use:enhance>
			<ContractForm clients={[data.client]} bind:state lockClient />
			<div class="actions">
				<Btn type="submit">Save changes</Btn>
			</div>
		</form>

		<div class="preview-col">
			<ContractPreview {assembly} {signatures} role="designer" bind:designerPng />
			<form method="POST" action="?/signDesigner" use:enhance class="sign-form">
				<input type="hidden" name="signature" value={designerPng ?? ''} />
				<Btn type="submit" disabled={!designerPng || Boolean(data.contract.designerSignature)}>
					Save designer signature
				</Btn>
			</form>
		</div>
	</div>
</PageShell>

<style>
	.pricing-bar,
	.toolbar {
		display: flex;
		flex-wrap: wrap;
		gap: 0.75rem;
		margin-bottom: 1rem;
		align-items: center;
	}

	.split {
		display: grid;
		grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
		gap: 2rem;
		align-items: start;
	}

	.preview-col,
	.sign-form {
		display: grid;
		gap: 1rem;
	}

	.sign-form {
		justify-items: start;
		margin-bottom: 2rem;
	}

	.actions {
		display: flex;
		justify-content: flex-end;
		margin-top: 1rem;
	}

	@media (max-width: 960px) {
		.split {
			grid-template-columns: 1fr;
		}
	}
</style>
