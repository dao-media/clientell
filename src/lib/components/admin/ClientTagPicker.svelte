<script lang="ts">
	import type { BriefClientOption } from '$lib/server/submissions-page';

	let {
		clients,
		selectedId = $bindable(''),
		name,
		disabled = false,
		legend = 'Client',
		required = false,
		placeholder = 'Search or select a client…',
		emptyHint = 'Add a client first, then create a brief for them.',
		onaddclient
	}: {
		clients: BriefClientOption[];
		selectedId?: string;
		name?: string;
		disabled?: boolean;
		legend?: string;
		required?: boolean;
		placeholder?: string;
		emptyHint?: string;
		onaddclient?: () => void;
	} = $props();

	let query = $state('');
	let focused = $state(false);
	let rootEl: HTMLDivElement | undefined = $state();

	const showAddClient = $derived(!selectedId && Boolean(onaddclient));
	const panelOpen = $derived(focused && clients.length > 0);

	const selectedClient = $derived(clients.find((client) => client.id === selectedId) ?? null);

	const suggestions = $derived.by(() => {
		const needle = query.trim().toLowerCase();
		return clients.filter((client) => {
			if (client.id === selectedId) return false;
			if (!needle) return true;
			return (
				client.company.toLowerCase().includes(needle) ||
				client.contactName.toLowerCase().includes(needle) ||
				client.email.toLowerCase().includes(needle)
			);
		});
	});

	function selectClient(id: string) {
		if (disabled) return;
		selectedId = id;
		query = '';
		focused = false;
		(rootEl?.querySelector('input') as HTMLInputElement | null)?.blur();
	}

	function clearClient() {
		if (disabled) return;
		selectedId = '';
	}

	function selectFirstMatch() {
		const match = suggestions[0];
		if (match) selectClient(match.id);
	}

	function openAddClient() {
		if (disabled || !onaddclient) return;
		onaddclient();
	}

	function onInputKeydown(event: KeyboardEvent) {
		if (event.key === 'Enter') {
			event.preventDefault();
			selectFirstMatch();
		} else if (event.key === 'Backspace' && query === '' && selectedId) {
			clearClient();
		} else if (event.key === 'Escape') {
			focused = false;
			(rootEl?.querySelector('input') as HTMLInputElement | null)?.blur();
		}
	}

	function onDocumentPointerDown(event: PointerEvent) {
		if (!rootEl?.contains(event.target as Node)) {
			focused = false;
		}
	}

	$effect(() => {
		document.addEventListener('pointerdown', onDocumentPointerDown);
		return () => document.removeEventListener('pointerdown', onDocumentPointerDown);
	});
</script>

{#if clients.length === 0 && !onaddclient}
	<p class="client-hint">{emptyHint}</p>
{:else}
	<div class="client-tag-picker" bind:this={rootEl}>
		<label class="picker-label" for="client-tag-input">
			{legend}{required ? ' *' : ''}
		</label>

		<div class="picker-field" class:focused={panelOpen} class:needs-client={showAddClient} class:disabled>
			<div class="selected-tags">
				{#if showAddClient}
					<button type="button" class="add-client-tag" {disabled} onclick={openAddClient}>
						Add Client +
					</button>
				{/if}

				{#if selectedClient}
					<span class="selected-tag">
						<span class="selected-tag-label">{selectedClient.company}</span>
						<button
							type="button"
							class="tag-remove"
							aria-label="Remove {selectedClient.company}"
							{disabled}
							onclick={clearClient}
						>
							×
						</button>
					</span>
				{/if}

				{#if !selectedClient}
					<input
						id="client-tag-input"
						class="tag-input"
						type="text"
						{placeholder}
						{disabled}
						bind:value={query}
						role="combobox"
						aria-expanded={panelOpen}
						aria-controls="client-suggestions"
						aria-autocomplete="list"
						onfocus={() => (focused = true)}
						onkeydown={onInputKeydown}
					/>
				{/if}
			</div>

			{#if panelOpen}
				<div id="client-suggestions" class="suggestions-panel" role="listbox" aria-label="Suggested clients">
					{#if suggestions.length === 0}
						<p class="suggestions-empty">No clients match “{query.trim()}”.</p>
					{:else}
						<div class="suggestions-list">
							{#each suggestions as client (client.id)}
								<button
									type="button"
									class="suggestion-row"
									role="option"
									aria-selected={false}
									{disabled}
									onclick={() => selectClient(client.id)}
								>
									<span class="suggestion-company">{client.company}</span>
									<span class="suggestion-meta">
										{client.contactName} · {client.email}
									</span>
								</button>
							{/each}
						</div>
					{/if}
				</div>
			{/if}
		</div>

		{#if name}
			<input type="hidden" {name} value={selectedId} />
		{/if}
	</div>
{/if}

<style>
	.client-hint {
		font-size: 0.875rem;
		color: var(--color-muted);
	}

	.client-tag-picker {
		display: grid;
		gap: 0.5rem;
	}

	.picker-label {
		font-size: 0.875rem;
		font-weight: 600;
		color: var(--color-ink);
	}

	.picker-field {
		border: 1px solid var(--color-border);
		background: var(--color-surface);
		transition: border-color 120ms ease;
	}

	.picker-field.focused {
		border-color: var(--color-accent);
		outline: 2px solid var(--color-accent);
		outline-offset: -2px;
	}

	.picker-field.needs-client {
		border-color: color-mix(in srgb, var(--color-warning) 45%, var(--color-border));
	}

	.picker-field.disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}

	.selected-tags {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: 0.35rem;
		padding: 0.45rem 0.55rem;
		min-height: 2.5rem;
	}

	.add-client-tag {
		display: inline-flex;
		align-items: center;
		padding: 0.2rem 0.65rem;
		border: 1px dashed var(--color-muted);
		border-radius: var(--radius);
		background: var(--color-surface-muted);
		color: var(--color-muted);
		font: inherit;
		font-size: 0.8125rem;
		font-weight: 500;
		cursor: pointer;
	}

	.add-client-tag:hover:not(:disabled) {
		border-color: var(--color-accent);
		color: var(--color-accent);
		background: var(--color-accent-soft);
	}

	.selected-tag {
		display: inline-flex;
		align-items: center;
		gap: 0.25rem;
		padding: 0.15rem 0.35rem 0.15rem 0.55rem;
		border-radius: var(--radius);
		font-size: 0.8125rem;
		background: color-mix(in srgb, var(--color-accent) 18%, transparent);
		border: 1px solid color-mix(in srgb, var(--color-accent) 45%, transparent);
	}

	.selected-tag-label {
		font-weight: 500;
	}

	.tag-remove {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		width: 1.1rem;
		height: 1.1rem;
		border: 0;
		border-radius: var(--radius);
		background: transparent;
		color: inherit;
		font-size: 1rem;
		line-height: 1;
		cursor: pointer;
		opacity: 0.75;
	}

	.tag-remove:hover {
		opacity: 1;
		background: color-mix(in srgb, var(--color-accent) 20%, transparent);
	}

	.tag-input {
		flex: 1 1 8rem;
		min-width: 6rem;
		border: 0;
		background: transparent;
		color: var(--color-ink);
		font: inherit;
		font-size: 0.875rem;
		padding: 0.2rem 0.25rem;
		outline: none;
	}

	.tag-input::placeholder {
		color: var(--color-muted);
	}

	.suggestions-panel {
		border-top: 1px solid var(--color-border);
		background: var(--color-surface);
		padding: 0.35rem;
		max-height: 14rem;
		overflow-y: auto;
	}

	.suggestions-empty {
		font-size: 0.8125rem;
		color: var(--color-muted);
		padding: 0.35rem 0.5rem;
	}

	.suggestions-list {
		display: grid;
	}

	.suggestion-row {
		display: grid;
		gap: 0.1rem;
		padding: 0.5rem 0.6rem;
		border: 0;
		border-radius: var(--radius);
		background: transparent;
		color: var(--color-ink);
		font: inherit;
		text-align: left;
		cursor: pointer;
	}

	.suggestion-row:hover:not(:disabled) {
		background: var(--color-surface-muted);
	}

	.suggestion-company {
		font-size: 0.875rem;
		font-weight: 600;
	}

	.suggestion-meta {
		font-size: 0.8125rem;
		color: var(--color-muted);
	}
</style>
