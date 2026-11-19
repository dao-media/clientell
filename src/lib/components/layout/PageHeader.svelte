<script lang="ts">
	import type { Snippet } from 'svelte';

	let {
		title,
		lead = '',
		kicker = '',
		actions,
		badge,
		children
	}: {
		title: string;
		lead?: string;
		kicker?: string;
		actions?: Snippet;
		/** Status chip shown on the title line (e.g. Draft / Submitted). */
		badge?: Snippet;
		children?: Snippet;
	} = $props();
</script>

<header class="page-header">
	<div class="page-header-text">
		{#if kicker}
			<p class="page-kicker">{kicker}</p>
		{/if}
		{#if badge}
			<div class="page-title-row">
				<h1>{title}</h1>
				{@render badge()}
			</div>
		{:else}
			<h1>{title}</h1>
		{/if}
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
