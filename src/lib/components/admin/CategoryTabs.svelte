<script lang="ts">
	import Plus from '@lucide/svelte/icons/plus';
	import { PLACEHOLDER_CATEGORY_TAB_ID, type QuestionCategory } from '$lib/categories';

	let {
		categories,
		activeId,
		onselect,
		onadd,
		onedit
	}: {
		categories: QuestionCategory[];
		activeId: string;
		onselect: (id: string, anchor?: DOMRect) => void;
		onadd: (anchor: DOMRect) => void;
		onedit: (category: QuestionCategory, anchor: DOMRect) => void;
	} = $props();

	type TabItem = {
		id: string;
		label: string;
		color?: string;
		placeholder?: boolean;
		category?: QuestionCategory;
	};

	const hasRealCategories = $derived(categories.length > 0);

	const tabItems = $derived.by((): TabItem[] => {
		if (!hasRealCategories) {
			return [{ id: PLACEHOLDER_CATEGORY_TAB_ID, label: 'Category', placeholder: true }];
		}

		return categories.map((category) => ({
			id: category.id,
			label: category.name,
			color: category.color,
			category
		}));
	});

	function tabAnchor(id: string): DOMRect | undefined {
		const button = document.getElementById(`tab-${id}`);
		return button?.getBoundingClientRect();
	}

	function handleSelect(item: TabItem) {
		if (item.placeholder) {
			onselect(item.id, tabAnchor(item.id));
		} else {
			onselect(item.id);
		}
	}

	function handleCategoryNameDoubleClick(event: MouseEvent) {
		const target = event.target as HTMLElement;
		if (!target.closest('.category-name')) return;

		event.stopPropagation();
		event.preventDefault();

		const button = target.closest<HTMLButtonElement>('.tabs-item');
		const tabId = button?.id?.replace(/^tab-/, '');
		if (!tabId) return;

		const item = tabItems.find((entry) => entry.id === tabId);
		if (!item) return;

		const rect = button?.getBoundingClientRect();
		if (!rect) return;

		if (item.placeholder) {
			onselect(item.id, rect);
		} else if (item.category) {
			onedit(item.category, rect);
		}
	}
</script>

<div class="category-tabs-shell" role="group" ondblclick={handleCategoryNameDoubleClick}>
	<div class="tabs category-tabs" role="tablist" aria-label="Brief categories">
		{#each tabItems as item (item.id)}
			<button
				type="button"
				id="tab-{item.id}"
				class="tabs-item"
				class:active={activeId === item.id}
				class:placeholder={item.placeholder}
				style={item.color ? `--tab-accent: ${item.color}` : undefined}
				role="tab"
				aria-selected={activeId === item.id}
				onclick={() => handleSelect(item)}
			>
				{#if item.placeholder}
					<span class="placeholder-label category-name">{item.label}</span>
				{:else}
					<span class="tab-label-row">
						<span class="category-dot" style:background={item.color} aria-hidden="true"></span>
						<span class="category-name">{item.label}</span>
					</span>
				{/if}
			</button>
		{/each}
	</div>

	{#if hasRealCategories}
		<button
			type="button"
			class="add-category-button"
			aria-label="Add category"
			onclick={(event) => onadd((event.currentTarget as HTMLElement).getBoundingClientRect())}
		>
			<Plus size={18} strokeWidth={2} aria-hidden="true" />
		</button>
	{/if}
</div>

{#if hasRealCategories}
	<p class="tab-hint">Double-click a category name to edit it.</p>
{:else}
	<p class="tab-hint">Double-click Category to name your first brief type. The + button appears after that.</p>
{/if}

<style>
	.category-tabs-shell {
		display: flex;
		align-items: flex-end;
		gap: 0.25rem;
	}

	.category-tabs {
		flex: 1;
		min-width: 0;
	}

	.tab-label-row {
		display: inline-flex;
		align-items: center;
		gap: 0.45rem;
	}

	.category-name {
		cursor: text;
	}

	.category-dot {
		width: 0.5rem;
		height: 0.5rem;
		border-radius: var(--radius-lg);
		flex-shrink: 0;
	}

	.add-category-button {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		flex-shrink: 0;
		margin-bottom: 0.35rem;
		min-height: 2.5rem;
		min-width: 2.5rem;
		padding: 0;
		border: 0;
		border-radius: var(--radius-sm);
		background: transparent;
		color: var(--color-accent);
		cursor: pointer;
	}

	.add-category-button:hover {
		background: var(--color-surface-hover);
	}

	.tab-hint {
		margin-top: 0.5rem;
		font-size: 0.75rem;
		color: var(--color-muted);
	}
</style>
