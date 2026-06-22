<script lang="ts">
	import type { Snippet } from 'svelte';

	let { children }: { children: Snippet } = $props();
</script>

<div class="admin-two-col-grid">
	{@render children()}
</div>

<style>
	.admin-two-col-grid {
		display: grid;
		gap: clamp(0.75rem, 2vw, 1rem);
		grid-template-columns: minmax(0, 1fr);
		width: 100%;
	}

	.admin-two-col-grid > :global(*) {
		min-width: 0;
		width: 100%;
		max-width: 100%;
	}

	@media (min-width: 768px) {
		.admin-two-col-grid {
			grid-template-columns: repeat(2, minmax(0, 1fr));
		}
	}
</style>
