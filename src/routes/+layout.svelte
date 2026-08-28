<script lang="ts">
	import { page } from '$app/stores';
	import favicon from '$lib/assets/favicon.svg';
	import SiteHeader from '$lib/components/SiteHeader.svelte';
	import './layout.css';
	import '$lib/styles/client-brief.css';

	let { data, children } = $props();
</script>

<svelte:head>
	<link rel="icon" href={favicon} type="image/svg+xml" />
	<meta
		name="description"
		content="ClienTell keeps client briefs, contracts, and approvals in one place."
	/>
	<meta name="theme-color" content="#5340ed" media="(prefers-color-scheme: light)" />
	<meta name="theme-color" content="#191627" media="(prefers-color-scheme: dark)" />
	<title>ClienTell</title>
</svelte:head>

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
