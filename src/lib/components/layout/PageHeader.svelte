<script lang="ts">
	import type { Snippet } from 'svelte';

	let {
		title,
		lead = '',
		kicker = '',
		actions,
		children
	}: {
		title: string;
		lead?: string;
		kicker?: string;
		actions?: Snippet;
		children?: Snippet;
	} = $props();
</script>

<header class="page-header">
	<div class="page-header-text">
		{#if kicker}
			<p class="page-kicker">{kicker}</p>
		{/if}
		<h1>{title}</h1>
		{#if lead}
			<p class="page-lead">{lead}</p>
		{/if}
		{@render children?.()}
	</div>
	{#if actions}
		<div class="page-header-actions">
			{@render actions()}
		</div>
	{/if}
</header>
