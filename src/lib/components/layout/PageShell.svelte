<script lang="ts">
	import type { Snippet } from 'svelte';

	let {
		width = 'wide',
		center = false,
		children
	}: {
		width?: 'wide' | 'content' | 'form' | 'auth';
		center?: boolean;
		children: Snippet;
	} = $props();
</script>

<div
	class="page-shell"
	class:page-shell--content={width === 'content'}
	class:page-shell--form={width === 'form'}
	class:page-shell--auth={width === 'auth'}
	class:auth-shell={center}
>
	{@render children()}
</div>
