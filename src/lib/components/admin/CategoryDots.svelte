<script lang="ts">
	import { categoryById, type QuestionCategory } from '$lib/categories';

	let {
		categoryIds = [],
		categories = [],
		class: className = ''
	}: {
		categoryIds?: string[];
		categories?: QuestionCategory[];
		class?: string;
	} = $props();

	const resolved = $derived.by(() => {
		if (categoryIds.length === 0) return categories;
		return categoryIds
			.map((id) => categoryById(categories, id))
			.filter((category): category is QuestionCategory => Boolean(category));
	});

	const ariaLabel = $derived(resolved.map((category) => category.name).join(', '));
</script>

{#if resolved.length > 0}
	<div class="category-dots {className}" role="img" aria-label={ariaLabel}>
		{#each resolved as category (category.id)}
			<span class="category-dot-item">
				<span class="category-dot" style:background={category.color} aria-hidden="true"></span>
				<span class="category-dot-tooltip">{category.name}</span>
			</span>
		{/each}
	</div>
{/if}

<style>
	.category-dots {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: 0.35rem;
	}

	.category-dot-item {
		position: relative;
		display: inline-flex;
		align-items: center;
		justify-content: center;
		padding: 0.1rem;
	}

	.category-dot {
		width: 0.5rem;
		height: 0.5rem;
		border-radius: var(--radius-lg);
		flex-shrink: 0;
	}

	.category-dot-tooltip {
		position: absolute;
		bottom: calc(100% + 0.4rem);
		left: 50%;
		transform: translateX(-50%);
		padding: 0.2rem 0.45rem;
		border-radius: var(--radius-sm);
		background: var(--color-ink);
		color: var(--color-surface);
		font-size: 0.75rem;
		font-weight: 500;
		line-height: 1.3;
		white-space: nowrap;
		pointer-events: none;
		opacity: 0;
		transition: opacity 0.12s ease;
		z-index: 20;
	}

	.category-dot-tooltip::after {
		content: '';
		position: absolute;
		top: 100%;
		left: 50%;
		transform: translateX(-50%);
		border: 0.25rem solid transparent;
		border-top-color: var(--color-ink);
	}

	@media (hover: hover) and (pointer: fine) {
		.category-dot-item:hover .category-dot-tooltip,
		.category-dot-item:focus-within .category-dot-tooltip {
			opacity: 1;
		}
	}
</style>
