<script lang="ts">
	import { page } from '$app/stores';
	import favicon from '$lib/assets/favicon.svg';
	import SiteHeader from '$lib/components/SiteHeader.svelte';
	import './layout.css';

	let { data, children } = $props();
</script>

<svelte:head><link rel="icon" href={favicon} /><title>Briefly</title></svelte:head>

<div class="app-shell site-shell">
	<SiteHeader admin={data.auth.admin} client={data.auth.client} />
	<main class="site-main">
		{@render children()}
	</main>
</div>

<style>
	.site-shell {
		display: flex;
		flex-direction: column;
		min-height: 100vh;
	}

	.site-main {
		flex: 1;
		width: 100%;
	}
</style>
