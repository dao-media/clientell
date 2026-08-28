<script lang="ts">
	import Btn from '$lib/components/Btn.svelte';
	import Checkbox from '$lib/components/ui/Checkbox.svelte';
	import Field from '$lib/components/ui/Field.svelte';
	import Select from '$lib/components/ui/Select.svelte';
	import TextArea from '$lib/components/ui/TextArea.svelte';
	import { RATE_HINTS } from '$lib/contract/defaults';
	import {
		emptyEditorState,
		isoDateInput,
		type ContractEditorState
	} from '$lib/contract/editor-state';
	import { defaultPremiumPct } from '$lib/contract/pricing';
	import type { ConfidentialityTier } from '$lib/contract/types';

	type ClientOption = {
		id: string;
		company: string;
		contactName: string;
		email: string;
		legalName: string | null;
	};

	let {
		clients,
		state = $bindable(emptyEditorState()),
		lockClient = false
	}: {
		clients: ClientOption[];
		state?: ContractEditorState;
		lockClient?: boolean;
	} = $props();

	function addDeliverable() {
		state.deliverables = [...state.deliverables, { name: '', includedRevisionRounds: 2 }];
	}

	function removeDeliverable(index: number) {
		state.deliverables = state.deliverables.filter((_, i) => i !== index);
	}

	function addMilestone() {
		state.milestones = [...state.milestones, { label: '', targetDate: '' }];
	}

	function removeMilestone(index: number) {
		state.milestones = state.milestones.filter((_, i) => i !== index);
	}

	function addService() {
		state.serviceOwnership = [
			...state.serviceOwnership,
			{ name: '', accountOwner: '', renewalResponsibility: '' }
		];
	}

	function removeService(index: number) {
		state.serviceOwnership = state.serviceOwnership.filter((_, i) => i !== index);
	}

	function onTierChange() {
		if (!state.confidentialityTier) return;
		state.premiumPct = String(defaultPremiumPct(state.confidentialityTier));
	}

	function onConfidentialityToggle() {
		if (state.confidentiality && !state.confidentialityTier) {
			state.confidentialityTier = 1;
			state.premiumPct = String(defaultPremiumPct(1));
		}
		if (!state.confidentiality) {
			state.confidentialityTier = null;
		}
	}

	const premiumHint = $derived(
		state.confidentialityTier
			? RATE_HINTS.premiumPct[state.confidentialityTier]
			: 'Pre-fills from the selected tier; freely editable'
	);
</script>

<div class="contract-form-grid">
	<Select
		label="Client"
		name="clientId"
		bind:value={state.clientId}
		disabled={lockClient}
		options={[
			{ value: '', text: 'Select a client' },
			...clients.map((client) => ({
				value: client.id,
				text: `${client.company} — ${client.contactName}`
			}))
		]}
	/>
	{#if lockClient}
		<input type="hidden" name="clientId" value={state.clientId} />
	{/if}

	<Field label="Project name" name="projectName" bind:value={state.projectName} required />
	<TextArea label="Project description" name="description" bind:value={state.description} />

	<Field
		label="Estimated start"
		name="estimatedStart"
		type="date"
		bind:value={state.estimatedStart}
	/>
	<Field
		label="Venue county"
		name="venueCounty"
		bind:value={state.venueCounty}
		helperText="Used in the dispute-resolution clause"
	/>
	<Field label="Governing state" name="governingState" bind:value={state.governingState} />

	<section class="stack">
		<h3>Deliverables</h3>
		{#each state.deliverables as item, index (index)}
			<div class="row">
				<Field
					label="Name"
					value={item.name}
					oninput={(event) => {
						state.deliverables[index].name = event.currentTarget.value;
						state.deliverables = [...state.deliverables];
					}}
				/>
				<Field
					label="Revision rounds"
					type="number"
					value={String(item.includedRevisionRounds)}
					oninput={(event) => {
						state.deliverables[index].includedRevisionRounds =
							Number.parseInt(event.currentTarget.value, 10) || 0;
						state.deliverables = [...state.deliverables];
					}}
				/>
				<Btn variant="ghost" size="small" type="button" onclick={() => removeDeliverable(index)}>
					Remove
				</Btn>
			</div>
		{/each}
		<Btn variant="secondary" size="small" type="button" onclick={addDeliverable}>Add deliverable</Btn>
		<input type="hidden" name="deliverables" value={JSON.stringify(state.deliverables)} />
	</section>

	<TextArea
		label="Out of scope"
		name="outOfScope"
		bind:value={state.outOfScope}
		helperText="One item per line"
	/>
	<TextArea
		label="Approval stages"
		name="approvalStages"
		bind:value={state.approvalStages}
		helperText="One stage per line, in order"
	/>

	<section class="stack">
		<h3>Milestones</h3>
		{#each state.milestones as item, index (index)}
			<div class="row">
				<Field
					label="Label"
					value={item.label}
					oninput={(event) => {
						state.milestones[index].label = event.currentTarget.value;
						state.milestones = [...state.milestones];
					}}
				/>
				<Field
					label="Target date"
					type="date"
					value={isoDateInput(item.targetDate)}
					oninput={(event) => {
						state.milestones[index].targetDate = event.currentTarget.value;
						state.milestones = [...state.milestones];
					}}
				/>
				<Btn variant="ghost" size="small" type="button" onclick={() => removeMilestone(index)}>
					Remove
				</Btn>
			</div>
		{/each}
		<Btn variant="secondary" size="small" type="button" onclick={addMilestone}>Add milestone</Btn>
		<input type="hidden" name="milestones" value={JSON.stringify(state.milestones)} />
	</section>

	<section class="stack">
		<h3>Fees</h3>
		<Field label="Base fee (USD)" name="baseFee" bind:value={state.baseFee} />
		<Field
			label="Overage rate (USD / hour)"
			name="overageRate"
			bind:value={state.overageRate}
			helperText={RATE_HINTS.overageRate}
		/>
		<Select
			label="Remaining 65%"
			name="remainingStructure"
			bind:value={state.remainingStructure}
			options={[
				{ value: 'single', text: 'Single final invoice' },
				{ value: 'milestone', text: 'Milestone split' }
			]}
		/>
	</section>

	<section class="stack">
		<h3>Third-party costs</h3>
		<Select
			label="Option"
			name="thirdPartyOption"
			bind:value={state.thirdPartyOption}
			options={[
				{ value: '', text: 'Not selected' },
				{ value: 'A', text: 'A — Designer procures' },
				{ value: 'B', text: 'B — Client-provided card' }
			]}
		/>
		<Field
			label="Handling % (Option A)"
			name="handlingPct"
			bind:value={state.handlingPct}
			helperText={RATE_HINTS.handlingPct}
		/>
		<Field
			label="Per-item approval threshold (USD)"
			name="perItemThreshold"
			bind:value={state.perItemThreshold}
			helperText={RATE_HINTS.perItemThreshold}
		/>
		{#each state.serviceOwnership as item, index (index)}
			<div class="row">
				<Field
					label="Service"
					value={item.name}
					oninput={(event) => {
						state.serviceOwnership[index].name = event.currentTarget.value;
						state.serviceOwnership = [...state.serviceOwnership];
					}}
				/>
				<Field
					label="Account owner"
					value={item.accountOwner}
					oninput={(event) => {
						state.serviceOwnership[index].accountOwner = event.currentTarget.value;
						state.serviceOwnership = [...state.serviceOwnership];
					}}
				/>
				<Field
					label="Renewals after handoff"
					value={item.renewalResponsibility}
					oninput={(event) => {
						state.serviceOwnership[index].renewalResponsibility = event.currentTarget.value;
						state.serviceOwnership = [...state.serviceOwnership];
					}}
				/>
				<Btn variant="ghost" size="small" type="button" onclick={() => removeService(index)}>
					Remove
				</Btn>
			</div>
		{/each}
		<Btn variant="secondary" size="small" type="button" onclick={addService}>Add service</Btn>
		<input type="hidden" name="serviceOwnership" value={JSON.stringify(state.serviceOwnership)} />
	</section>

	<section class="stack">
		<h3>Modules</h3>
		<Checkbox label="§3.8 Personal guarantee" bind:checked={state.personalGuarantee} />
		<Checkbox
			label="§10.2 Confidentiality / Attribution addendum"
			bind:checked={state.confidentiality}
			onchange={onConfidentialityToggle}
		/>
		{#if state.confidentiality}
			<Select
				label="Confidentiality tier"
				value={state.confidentialityTier ? String(state.confidentialityTier) : ''}
				options={[
					{ value: '1', text: 'Tier 1 — 10%' },
					{ value: '2', text: 'Tier 2 — 20% with floor' },
					{ value: '3', text: 'Tier 3 — 30% with floor' }
				]}
				onchange={(event: Event & { currentTarget: HTMLSelectElement }) => {
					state.confidentialityTier = Number(event.currentTarget.value) as ConfidentialityTier;
					onTierChange();
				}}
			/>
			<Field
				label="Premium %"
				name="premiumPct"
				bind:value={state.premiumPct}
				helperText={premiumHint}
			/>
			{#if state.confidentialityTier && state.confidentialityTier > 1}
				<Field
					label="Premium floor (USD)"
					name="premiumFloor"
					bind:value={state.premiumFloor}
					helperText={RATE_HINTS.premiumFloor}
				/>
			{/if}
		{/if}
		<input type="hidden" name="confidentialityTier" value={state.confidentialityTier ?? ''} />
		<input type="hidden" name="personalGuarantee" value={state.personalGuarantee ? 'true' : ''} />
		<input type="hidden" name="confidentiality" value={state.confidentiality ? 'true' : ''} />
	</section>
</div>

<style>
	.contract-form-grid {
		display: grid;
		gap: 1rem;
	}

	.stack {
		display: grid;
		gap: 0.75rem;
	}

	.stack h3 {
		margin: 0.5rem 0 0;
		font-size: 0.95rem;
	}

	.row {
		display: grid;
		grid-template-columns: 1fr 1fr auto;
		gap: 0.75rem;
		align-items: end;
	}
</style>
