<script lang="ts">
	import { base } from '$app/paths';
	import { page } from '$app/stores';
	import favicon from '$lib/assets/favicon.svg';
	import SiteHeader from '$lib/components/SiteHeader.svelte';
	import './layout.css';
	import '$lib/styles/client-brief.css';

	let { data, children } = $props();

	const canonicalUrl = $derived(
		data.sandbox
			? `${$page.url.origin}${$page.url.pathname}`
			: `https://clientell.daneoleary.com${$page.url.pathname}`
	);
</script>

<svelte:head>
	<link rel="icon" href={favicon} type="image/svg+xml" />
	<link rel="canonical" href={canonicalUrl} />
	<meta
		name="description"
		content="ClienTell keeps client briefs, contracts, and approvals in one place."
	/>
	<meta property="og:type" content="website" />
	<meta property="og:site_name" content="ClienTell" />
	<meta property="og:title" content="ClienTell" />
	<meta
		property="og:description"
		content="ClienTell keeps client briefs, contracts, and approvals in one place."
	/>
	<meta property="og:url" content={canonicalUrl} />
	<meta
		property="og:image"
		content="https://clientell.daneoleary.com/clientell-social-card.png"
	/>
	<meta property="og:image:type" content="image/png" />
	<meta property="og:image:width" content="1200" />
	<meta property="og:image:height" content="630" />
	<meta property="og:image:alt" content="ClienTell logo on a blurple background" />
	<meta name="twitter:card" content="summary_large_image" />
	<meta name="twitter:title" content="ClienTell" />
	<meta
		name="twitter:description"
		content="ClienTell keeps client briefs, contracts, and approvals in one place."
	/>
	<meta
		name="twitter:image"
		content="https://clientell.daneoleary.com/clientell-social-card.png"
	/>
	<meta name="twitter:image:alt" content="ClienTell logo on a blurple background" />
	<meta name="theme-color" content="#5340ed" media="(prefers-color-scheme: light)" />
	<meta name="theme-color" content="#191627" media="(prefers-color-scheme: dark)" />
	<title>ClienTell</title>
</svelte:head>

<div class="app-shell site-shell">
	{#if data.sandbox}
		<div class="sandbox-banner" role="note">
			<p>
				<strong class="sandbox-banner__title">Sandbox demo.</strong>
				<span class="sandbox-banner__long">
					Sample clients and data, private to your browser. Emails are switched off, and nothing is
					monitored.
				</span>
				<span class="sandbox-banner__short">Emails are off.</span>
			</p>
			<form method="POST" action="{base}/sandbox/reset">
				<button type="submit" class="sandbox-reset">Start over</button>
			</form>
		</div>
	{/if}
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

	.sandbox-banner {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		justify-content: center;
		gap: 0.5rem 1rem;
		padding: 0.5rem 1rem;
		/* Brand blurple in both themes: white text is 6.3:1 (the lighter dark-mode accent isn't). */
		background: var(--brand-blurple);
		color: #ffffff;
		font-size: 0.8125rem;
		line-height: 1.4;
		text-align: center;
	}

	.sandbox-banner p {
		margin: 0;
	}

	.sandbox-banner__short {
		display: none;
	}

	@media (max-width: 640px) {
		.sandbox-banner {
			flex-wrap: nowrap;
			justify-content: space-between;
			padding-block: 0.375rem;
			text-align: left;
		}

		.sandbox-banner__long {
			display: none;
		}

		.sandbox-banner__short {
			display: inline;
		}
	}

	.sandbox-reset {
		padding: 0.2rem 0.7rem;
		border: 1px solid #ffffff;
		border-radius: 999px;
		background: transparent;
		color: inherit;
		font: inherit;
		font-weight: 600;
		cursor: pointer;
	}

	.sandbox-reset {
		flex-shrink: 0;
		min-height: 1.75rem;
		white-space: nowrap;
	}

	.sandbox-reset:hover {
		background: rgb(255 255 255 / 15%);
	}

	.sandbox-reset:focus-visible {
		outline: 2px solid #ffffff;
		outline-offset: 2px;
	}

	.site-main {
		flex: 1;
		width: 100%;
	}
</style>
