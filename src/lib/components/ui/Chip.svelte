<script lang="ts">
	import type { Snippet } from 'svelte';

	let {
		variant = 'default',
		children
	}: {
		variant?: 'default' | 'blue' | 'green' | 'gray' | 'draft' | 'submitted';
		children?: Snippet;
	} = $props();
</script>

<span class="chip chip-{variant}">
	{#if children}
		{@render children()}
	{/if}
</span>
