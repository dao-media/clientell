<script lang="ts">
	import Alert from '$lib/components/ui/Alert.svelte';
	import ContractDocument from '$lib/components/contract/ContractDocument.svelte';
	import type { AssemblyResult, ContractSignatures } from '$lib/contract/types';

	let {
		assembly,
		signatures,
		role = null,
		clientPng = $bindable(null),
		designerPng = $bindable(null)
	}: {
		assembly: AssemblyResult;
		signatures?: ContractSignatures;
		role?: 'client' | 'designer' | null;
		clientPng?: string | null;
		designerPng?: string | null;
	} = $props();
</script>

<div class="contract-preview">
	{#if assembly.missing.length > 0}
		<Alert
			variant="warning"
			title="Unresolved fields"
			message={assembly.missing.join(', ')}
		/>
	{/if}

	<ContractDocument
		{assembly}
		{signatures}
		{role}
		bind:clientPng
		bind:designerPng
	/>
</div>

<style>
	.contract-preview {
		display: grid;
		gap: 1.5rem;
		overflow: auto;
		padding-bottom: 2rem;
	}
</style>
