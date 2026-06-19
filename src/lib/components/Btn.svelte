<script lang="ts">
	import type { ComponentProps, Snippet } from 'svelte';
	import UIBtn from './ui/Btn.svelte';

	type Props = ComponentProps<typeof UIBtn> & { children?: Snippet };

	let { children, ...props }: Props = $props();
</script>

<UIBtn {...props}>
	{#if children}
		{@render children()}
	{/if}
</UIBtn>
