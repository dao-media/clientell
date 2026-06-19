<script lang="ts">
	import Plus from '@lucide/svelte/icons/plus';
	import GripVertical from '@lucide/svelte/icons/grip-vertical';
	import { PLACEHOLDER_CATEGORY_TAB_ID, type QuestionCategory } from '$lib/categories';

	let {
		categories,
		activeId,
		onselect,
		onadd,
		onedit,
		onreorder
	}: {
		categories: QuestionCategory[];
		activeId: string;
		onselect: (id: string, anchor?: DOMRect) => void;
		onadd: (anchor: DOMRect) => void;
		onedit: (category: QuestionCategory, anchor: DOMRect) => void;
		onreorder?: (categoryIds: string[]) => void;
	} = $props();

	type TabItem = {
		id: string;
		label: string;
		color?: string;
		placeholder?: boolean;
		category?: QuestionCategory;
	};

	let dragId = $state<string | null>(null);
	let dropTargetId = $state<string | null>(null);
	let suppressClick = $state(false);

	const hasRealCategories = $derived(categories.length > 0);
	const canReorder = $derived(Boolean(onreorder) && categories.length > 1);

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
		if (suppressClick) {
			suppressClick = false;
			return;
		}

		if (item.placeholder) {
			onselect(item.id, tabAnchor(item.id));
		} else {
			onselect(item.id);
		}
	}

	function handleCategoryNameDoubleClick(event: MouseEvent) {
		const target = event.target as HTMLElement;
		if (!target.closest('.category-name')) return;
		if (target.closest('.drag-handle')) return;

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

	function reorderTabs(fromId: string, toId: string) {
		if (!onreorder || fromId === toId) return;

		const ids = categories.map((category) => category.id);
		const fromIndex = ids.indexOf(fromId);
		const toIndex = ids.indexOf(toId);
		if (fromIndex === -1 || toIndex === -1) return;

		const nextIds = [...ids];
		const [moved] = nextIds.splice(fromIndex, 1);
		nextIds.splice(toIndex, 0, moved);
		onreorder(nextIds);
	}

	function onHandleDragStart(id: string, event: DragEvent) {
		if (!canReorder) {
			event.preventDefault();
			return;
		}

		dragId = id;
		suppressClick = true;
		event.dataTransfer?.setData('text/plain', id);
		if (event.dataTransfer) {
			event.dataTransfer.effectAllowed = 'move';
		}
	}

	function onTabDragOver(id: string, event: DragEvent) {
		if (!dragId || dragId === id || !canReorder) return;
		event.preventDefault();
		if (event.dataTransfer) {
			event.dataTransfer.dropEffect = 'move';
		}
		dropTargetId = id;
	}

	function onTabDrop(id: string, event: DragEvent) {
		if (!dragId || !canReorder) return;
		event.preventDefault();
		reorderTabs(dragId, id);
		dragId = null;
		dropTargetId = null;
		suppressClick = true;
	}

	function onDragEnd() {
		dragId = null;
		dropTargetId = null;
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
				class:dragging={dragId === item.id}
				class:drop-target={dropTargetId === item.id}
				style={item.color ? `--tab-accent: ${item.color}` : undefined}
				role="tab"
				aria-selected={activeId === item.id}
				draggable={!item.placeholder && canReorder}
				ondragstart={(event) => onHandleDragStart(item.id, event)}
				ondragend={onDragEnd}
				ondragover={(event) => onTabDragOver(item.id, event)}
				ondrop={(event) => onTabDrop(item.id, event)}
				onclick={() => handleSelect(item)}
			>
				{#if !item.placeholder && canReorder}
					<span class="drag-handle" aria-hidden="true">
						<GripVertical size={14} strokeWidth={2} />
					</span>
				{/if}
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
	<p class="tab-hint">
		{#if canReorder}
			Drag tabs to reorder. Double-click a category name to edit it.
		{:else}
			Double-click a category name to edit it.
		{/if}
	</p>
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

	.tabs-item {
		display: inline-flex;
		align-items: center;
		gap: 0.35rem;
		cursor: grab;
	}

	.tabs-item:active {
		cursor: grabbing;
	}

	.tabs-item.placeholder {
		cursor: pointer;
	}

	.tabs-item.dragging {
		opacity: 0.45;
	}

	.tabs-item.drop-target {
		box-shadow: inset 0 -2px 0 var(--tab-accent, var(--color-accent));
		background: var(--color-surface-hover);
	}

	.drag-handle {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		flex-shrink: 0;
		margin-left: -0.15rem;
		padding: 0.15rem 0.1rem;
		border-radius: var(--radius-sm);
		color: var(--color-muted);
		pointer-events: none;
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
