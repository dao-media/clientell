<script lang="ts">
	import { formatUsPhoneDisplay } from '$lib/phone';
	import Checkbox from '$lib/components/ui/Checkbox.svelte';
	import { formatRelativeTime } from '$lib/utils';

	type ClientItem = {
		id: string;
		company: string;
		contactName: string;
		email: string;
		phone: string | null;
		services: string[];
		createdAt: Date;
	};

	let {
		client,
		selectMode = false,
		selected = false,
		ontoggle,
		onedit
	}: {
		client: ClientItem;
		selectMode?: boolean;
		selected?: boolean;
		ontoggle?: (clientId: string, checked: boolean) => void;
		onedit: (client: ClientItem) => void;
	} = $props();
</script>

<article class="client-card card" class:select-mode={selectMode}>
	{#if selectMode}
		<div class="client-select">
			<Checkbox
				checked={selected}
				hideLabel
				id="select-client-{client.id}"
				onchange={(event) =>
					ontoggle?.(client.id, (event.currentTarget as HTMLInputElement).checked)}
			/>
		</div>
	{/if}

	<button
		type="button"
		class="client-card-main"
		disabled={selectMode}
		onclick={() => onedit(client)}
	>
		<p class="client-company">{client.company}</p>
		<p class="client-contact">{client.contactName}</p>
		<p class="client-meta text-break">{client.email}</p>
		{#if client.phone}
			<p class="client-meta">{formatUsPhoneDisplay(client.phone)}</p>
		{/if}
		<p class="client-added">Added {formatRelativeTime(new Date(client.createdAt))}</p>
	</button>
</article>

<style>
	.client-card {
		display: grid;
		grid-template-columns: auto 1fr;
		align-items: start;
		padding: 0;
		overflow: hidden;
		width: 100%;
		max-width: 100%;
	}

	.client-card:not(.select-mode) {
		grid-template-columns: 1fr;
	}

	.client-select {
		display: flex;
		align-items: flex-start;
		padding: 1rem 0 0 0.75rem;
	}

	.client-card-main {
		display: grid;
		gap: 0;
		width: 100%;
		padding: 1.5rem;
		border: 0;
		background: transparent;
		color: inherit;
		font: inherit;
		text-align: left;
		cursor: pointer;
	}

	.client-card-main:hover:not(:disabled) {
		background: var(--color-surface-hover);
	}

	.client-card-main:disabled {
		cursor: default;
	}

	.client-company {
		font-size: 1rem;
		font-weight: 600;
	}

	.client-contact {
		margin-top: 0.35rem;
		font-size: 0.875rem;
	}

	.client-meta,
	.client-added {
		margin-top: 0.25rem;
		color: var(--color-muted);
		font-size: 0.8125rem;
	}

	.client-added {
		margin-top: 0.75rem;
	}
</style>
