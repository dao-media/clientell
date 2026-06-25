<script lang="ts">
	import { categoryById, type QuestionCategory } from '$lib/categories';

	let {
		categories,
		selected = $bindable([]),
		name,
		disabled = false,
		legend = 'Categories',
		required = false,
		placeholder = 'Search or select categories…',
		helperText = '',
		emptyHint = 'Create a category first, then tag this question.',
		oncreatecategory
	}: {
		categories: QuestionCategory[];
		selected?: string[];
		name?: string;
		disabled?: boolean;
		legend?: string;
		required?: boolean;
		placeholder?: string;
		helperText?: string;
		emptyHint?: string;
		oncreatecategory?: (anchor: DOMRect) => void;
	} = $props();

	let query = $state('');
	let focused = $state(false);
	let rootEl: HTMLDivElement | undefined = $state();

	const selectedIds = $derived(new Set(selected));
	const showCreatePlaceholder = $derived(selected.length === 0 && Boolean(oncreatecategory));
	const panelOpen = $derived(focused && categories.length > 0);

	const suggestions = $derived.by(() => {
		const needle = query.trim().toLowerCase();
		return categories.filter((category) => {
			if (!needle) return true;
			return category.name.toLowerCase().includes(needle);
		});
	});

	const selectedCategories = $derived(
		selected.map((id) => categoryById(categories, id)).filter(Boolean) as QuestionCategory[]
	);

	function addCategory(id: string) {
		if (disabled || selectedIds.has(id)) return;
		selected = [...selected, id];
		query = '';
	}

	function removeCategory(id: string) {
		if (disabled) return;
		selected = selected.filter((entry) => entry !== id);
	}

	function selectFirstMatch() {
		const match = suggestions.find((category) => !selectedIds.has(category.id));
		if (match) addCategory(match.id);
	}

	function openCreateCategory(event: MouseEvent) {
		if (disabled || !oncreatecategory) return;
		oncreatecategory((event.currentTarget as HTMLElement).getBoundingClientRect());
	}

	function onInputKeydown(event: KeyboardEvent) {
		if (event.key === 'Enter') {
			event.preventDefault();
			selectFirstMatch();
		} else if (event.key === 'Backspace' && query === '' && selected.length > 0) {
			removeCategory(selected[selected.length - 1]);
		} else if (event.key === 'Escape') {
			focused = false;
			(rootEl?.querySelector('input') as HTMLInputElement | null)?.blur();
		}
	}

	function onDocumentPointerDown(event: PointerEvent) {
		if (rootEl?.contains(event.target as Node)) return;

		const target = event.target;
		const defer =
			target instanceof Element &&
			Boolean(target.closest('button, a, label, input, textarea, select, [role="dialog"]'));

		const closePanel = () => {
			focused = false;
		};

		if (defer) {
			queueMicrotask(closePanel);
			return;
		}

		closePanel();
	}

	$effect(() => {
		document.addEventListener('pointerdown', onDocumentPointerDown);
		return () => document.removeEventListener('pointerdown', onDocumentPointerDown);
	});
</script>

{#if categories.length === 0 && !oncreatecategory}
	<p class="category-hint">{emptyHint}</p>
{:else}
	<div class="category-tag-picker" bind:this={rootEl}>
		<label class="picker-label" for="category-tag-input">
			{legend}{required ? ' *' : ''}
		</label>

		<div class="picker-field" class:focused={panelOpen} class:needs-category={showCreatePlaceholder} class:disabled>
			<div class="selected-tags">
				{#if showCreatePlaceholder}
					<button
						type="button"
						class="create-category-tag"
						{disabled}
						onclick={openCreateCategory}
					>
						Create Category +
					</button>
				{/if}

				{#each selectedCategories as category (category.id)}
					<span class="selected-tag" style:--tag-color={category.color}>
						<span>{category.name}</span>
						<button
							type="button"
							class="tag-remove"
							aria-label="Remove {category.name}"
							{disabled}
							onclick={() => removeCategory(category.id)}
						>
							×
						</button>
					</span>
				{/each}

				<input
					id="category-tag-input"
					class="tag-input"
					type="text"
					{placeholder}
					{disabled}
					bind:value={query}
					role="combobox"
					aria-expanded={panelOpen}
					aria-controls="category-suggestions"
					aria-autocomplete="list"
					onfocus={() => (focused = true)}
					onkeydown={onInputKeydown}
				/>
			</div>

			{#if panelOpen}
				<div id="category-suggestions" class="suggestions-panel" role="listbox" aria-label="Suggested categories">
					{#if suggestions.length === 0}
						<p class="suggestions-empty">No categories match “{query.trim()}”.</p>
					{:else}
						<div class="suggestions-grid">
							{#each suggestions as category (category.id)}
								{@const isSelected = selectedIds.has(category.id)}
								<button
									type="button"
									class="suggestion-tag"
									class:selected={isSelected}
									style:--tag-color={category.color}
									role="option"
									aria-selected={isSelected}
									disabled={disabled || isSelected}
									onclick={() => addCategory(category.id)}
								>
									{#if isSelected}
										<span class="suggestion-check" aria-hidden="true">✓</span>
									{/if}
									{category.name}
								</button>
							{/each}
						</div>
					{/if}
				</div>
			{/if}
		</div>

		{#if helperText}
			<p class="picker-help">{helperText}</p>
		{/if}

		{#if name}
			{#each selected as categoryId (categoryId)}
				<input type="hidden" {name} value={categoryId} />
			{/each}
		{/if}
	</div>
{/if}

<style>
	.category-hint,
	.picker-help {
		font-size: 0.875rem;
		color: var(--color-muted);
	}

	.category-tag-picker {
		display: grid;
		gap: 0.5rem;
	}

	.picker-label {
		font-size: 0.875rem;
		font-weight: 600;
		color: var(--color-ink);
	}

	.picker-field {
		position: relative;
		border: 1px solid var(--color-border);
		background: var(--color-surface);
		transition: border-color 120ms ease;
	}

	.picker-field.focused {
		border-color: var(--color-accent);
		outline: 2px solid var(--color-accent);
		outline-offset: -2px;
	}

	.picker-field.needs-category {
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

	.create-category-tag {
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

	.create-category-tag:hover:not(:disabled) {
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
		background: color-mix(in srgb, var(--tag-color) 18%, transparent);
		border: 1px solid color-mix(in srgb, var(--tag-color) 45%, transparent);
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
		background: color-mix(in srgb, var(--tag-color) 20%, transparent);
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
		position: absolute;
		top: calc(100% + 0.25rem);
		left: 0;
		right: 0;
		z-index: 20;
		border: 1px solid var(--color-border);
		border-radius: var(--radius);
		background: var(--color-surface);
		padding: 0.65rem;
		box-shadow: 0 10px 24px rgb(15 23 42 / 0.12);
		max-height: 14rem;
		overflow-y: auto;
	}

	.suggestions-empty {
		font-size: 0.8125rem;
		color: var(--color-muted);
	}

	.suggestions-grid {
		display: flex;
		flex-wrap: wrap;
		gap: 0.45rem;
	}

	.suggestion-tag {
		position: relative;
		display: inline-flex;
		align-items: center;
		padding: 0.3rem 0.65rem;
		border-radius: var(--radius);
		border: 1px solid color-mix(in srgb, var(--tag-color) 45%, transparent);
		background: color-mix(in srgb, var(--tag-color) 12%, var(--color-surface));
		color: var(--color-ink);
		font: inherit;
		font-size: 0.8125rem;
		cursor: pointer;
		transition:
			background 120ms ease,
			border-color 120ms ease;
	}

	.suggestion-tag:hover:not(:disabled) {
		background: color-mix(in srgb, var(--tag-color) 24%, var(--color-surface));
		border-color: var(--tag-color);
	}

	.suggestion-tag.selected {
		opacity: 0.55;
		cursor: default;
	}

	.suggestion-check {
		position: absolute;
		top: -0.2rem;
		right: -0.1rem;
		width: 0.95rem;
		height: 0.95rem;
		border-radius: var(--radius);
		background: var(--tag-color);
		color: #fff;
		font-size: 0.625rem;
		line-height: 0.95rem;
		text-align: center;
	}
</style>
