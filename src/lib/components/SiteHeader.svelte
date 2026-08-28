<script lang="ts">
	import { afterNavigate } from '$app/navigation';
	import { resolve } from '$app/paths';
	import { page } from '$app/stores';
	import BrandLogo from '$lib/components/BrandLogo.svelte';
	import ThemeToggle from '$lib/components/admin/ThemeToggle.svelte';
	import {
		SUBMISSION_STATUS_FILTERS,
		submissionNavActive
	} from '$lib/admin/submission-filters';
	import { CONTRACT_STATUS_FILTERS, contractNavActive } from '$lib/admin/contract-filters';
	import ChevronDown from '@lucide/svelte/icons/chevron-down';

	let { admin = false, client = false }: { admin?: boolean; client?: boolean } = $props();

	const manageLinks = [
		{ href: '/admin/clients', label: 'Clients' },
		{ href: '/admin/question-sets', label: 'Briefs' },
		{ href: '/admin/clauses', label: 'Clauses' }
	] as const;

	const submissionLinks = SUBMISSION_STATUS_FILTERS.map(({ href, label }) => ({ href, label }));
	const contractLinks = CONTRACT_STATUS_FILTERS.map(({ href, label }) => ({ href, label }));

	const pathname = $derived($page.url.pathname);
	const search = $derived($page.url.search);
	const brandHref = '/';
	const showAdminNav = $derived(admin);
	const hasNav = $derived(showAdminNav);
	const manageActive = $derived(
		pathname.startsWith('/admin/clients') ||
			pathname.startsWith('/admin/question-sets') ||
			pathname.startsWith('/admin/briefs') ||
			pathname.startsWith('/admin/clauses')
	);
	const submissionsActive = $derived(pathname.startsWith('/admin/submissions'));
	const contractsActive = $derived(pathname.startsWith('/admin/contracts'));

	let menuOpen = $state(false);
	let openDropdown = $state<'manage' | 'submissions' | 'contracts' | null>(null);

	function navLinkActive(href: string): boolean {
		return pathname === href || pathname.startsWith(`${href}/`);
	}

	function submissionLinkActive(href: string): boolean {
		return submissionNavActive(pathname, href);
	}

	function contractLinkActive(href: string): boolean {
		return contractNavActive(pathname, search, href);
	}

	function toggleMenu() {
		menuOpen = !menuOpen;
	}

	function closeMenu() {
		menuOpen = false;
	}

	function showDropdown(id: 'manage' | 'submissions' | 'contracts') {
		openDropdown = id;
	}

	function hideDropdown(id: 'manage' | 'submissions' | 'contracts') {
		if (openDropdown === id) openDropdown = null;
	}

	function handleKeydown(event: KeyboardEvent) {
		if (menuOpen && event.key === 'Escape') closeMenu();
	}

	afterNavigate(() => {
		menuOpen = false;
		openDropdown = null;
	});

	$effect(() => {
		if (!menuOpen) return;

		document.body.style.overflow = 'hidden';

		return () => {
			document.body.style.overflow = '';
		};
	});
</script>

<svelte:window onkeydown={handleKeydown} />

<header class="site-header">
	<a class="site-brand" href={resolve(brandHref)} aria-label="ClienTell home">
		<BrandLogo />
	</a>

	<div class="site-header-cluster">
		{#if hasNav}
			<div id="site-nav-drawer" class="site-header-nav" class:site-header-nav--open={menuOpen}>
				<nav class="site-nav site-nav-admin" aria-label="Admin">
					<div
						class="nav-dropdown nav-dropdown--desktop"
						role="group"
						aria-label="Manage menu"
						onmouseenter={() => showDropdown('manage')}
						onmouseleave={() => hideDropdown('manage')}
					>
						<button
							type="button"
							class="nav-dropdown-trigger"
							class:active={manageActive}
							aria-expanded={openDropdown === 'manage'}
							aria-haspopup="true"
						>
							Manage
							<ChevronDown size={14} strokeWidth={2} aria-hidden="true" />
						</button>
						<div class="nav-dropdown-menu" class:is-open={openDropdown === 'manage'}>
							<div class="nav-dropdown-panel">
								{#each manageLinks as link (link.href)}
									<a href={resolve(link.href)} class:active={navLinkActive(link.href)}>{link.label}</a>
								{/each}
							</div>
						</div>
					</div>

					<div
						class="nav-dropdown nav-dropdown--desktop"
						role="group"
						aria-label="Submissions menu"
						onmouseenter={() => showDropdown('submissions')}
						onmouseleave={() => hideDropdown('submissions')}
					>
						<button
							type="button"
							class="nav-dropdown-trigger"
							class:active={submissionsActive}
							aria-expanded={openDropdown === 'submissions'}
							aria-haspopup="true"
						>
							Submissions
							<ChevronDown size={14} strokeWidth={2} aria-hidden="true" />
						</button>
						<div class="nav-dropdown-menu" class:is-open={openDropdown === 'submissions'}>
							<div class="nav-dropdown-panel">
								{#each submissionLinks as link (link.href)}
									<a href={resolve(link.href)} class:active={submissionLinkActive(link.href)}>{link.label}</a>
								{/each}
							</div>
						</div>
					</div>

					<div
						class="nav-dropdown nav-dropdown--desktop"
						role="group"
						aria-label="Contracts menu"
						onmouseenter={() => showDropdown('contracts')}
						onmouseleave={() => hideDropdown('contracts')}
					>
						<button
							type="button"
							class="nav-dropdown-trigger"
							class:active={contractsActive}
							aria-expanded={openDropdown === 'contracts'}
							aria-haspopup="true"
						>
							Contracts
							<ChevronDown size={14} strokeWidth={2} aria-hidden="true" />
						</button>
						<div class="nav-dropdown-menu" class:is-open={openDropdown === 'contracts'}>
							<div class="nav-dropdown-panel">
								{#each contractLinks as link (link.href)}
									<a href={resolve(link.href)} class:active={contractLinkActive(link.href)}>{link.label}</a>
								{/each}
								<a href={resolve('/admin/contracts/new')}>New contract</a>
							</div>
						</div>
					</div>
				</nav>

				<div class="nav-drawer-admin nav-drawer-admin--mobile">
					<p class="nav-drawer-label">Manage</p>
					{#each manageLinks as link (link.href)}
						<a
							href={resolve(link.href)}
							class="nav-drawer-link"
							class:active={navLinkActive(link.href)}
							onclick={closeMenu}
						>
							{link.label}
						</a>
					{/each}

					<p class="nav-drawer-label">Submissions</p>
					{#each submissionLinks as link (link.href)}
						<a
							href={resolve(link.href)}
							class="nav-drawer-link"
							class:active={submissionLinkActive(link.href)}
							onclick={closeMenu}
						>
							{link.label}
						</a>
					{/each}

					<p class="nav-drawer-label">Contracts</p>
					{#each contractLinks as link (link.href)}
						<a
							href={resolve(link.href)}
							class="nav-drawer-link"
							class:active={contractLinkActive(link.href)}
							onclick={closeMenu}
						>
							{link.label}
						</a>
					{/each}
					<a
						href={resolve('/admin/contracts/new')}
						class="nav-drawer-link"
						onclick={closeMenu}
					>
						New contract
					</a>

					<form method="POST" action="/admin/logout" class="signout-form nav-drawer-signout">
						<button type="submit" class="nav-drawer-link nav-drawer-link--button">Sign out</button>
					</form>
				</div>
			</div>
		{/if}

		<div class="site-header-end" class:site-header-end--solo={!hasNav}>
			{#if showAdminNav}
				<form method="POST" action="/admin/logout" class="signout-form signout-form--desktop">
					<button type="submit" class="admin-signout">Sign out</button>
				</form>
			{/if}
			<ThemeToggle iconOnly />
			{#if hasNav}
				<button
					type="button"
					class="menu-toggle"
					class:menu-toggle--open={menuOpen}
					aria-label={menuOpen ? 'Close menu' : 'Open menu'}
					aria-expanded={menuOpen}
					aria-controls="site-nav-drawer"
					onclick={toggleMenu}
				>
					<span class="menu-toggle-bar menu-toggle-bar--top" aria-hidden="true"></span>
					<span class="menu-toggle-bar menu-toggle-bar--middle" aria-hidden="true"></span>
					<span class="menu-toggle-bar menu-toggle-bar--bottom" aria-hidden="true"></span>
				</button>
			{/if}
		</div>
	</div>

	{#if hasNav}
		<button
			type="button"
			class="nav-drawer-backdrop"
			class:nav-drawer-backdrop--open={menuOpen}
			onclick={closeMenu}
			aria-label="Close menu"
			tabindex={menuOpen ? 0 : -1}
		></button>
	{/if}
</header>

<style>
	.site-header {
		position: sticky;
		top: 0;
		z-index: 9000;
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 1rem;
		min-height: var(--site-header-height, 3.25rem);
		padding: 0 clamp(1rem, 3vw, 1.5rem);
		border-bottom: 1px solid var(--site-header-border);
		background: var(--site-header-bg);
		-webkit-backdrop-filter: blur(12px);
		backdrop-filter: blur(12px);
		color: var(--site-header-text);
	}

	.site-brand {
		--brand-logo-width: clamp(7.25rem, 12vw, 8.5rem);

		display: block;
		flex-shrink: 0;
		color: inherit;
		text-decoration: none;
	}

	.site-header-cluster {
		display: flex;
		align-items: center;
		justify-content: flex-end;
		gap: clamp(0.75rem, 2vw, 1.5rem);
		min-width: 0;
		margin-left: auto;
	}

	.site-header-nav {
		display: flex;
		align-items: center;
		gap: 1rem;
		min-width: 0;
	}

	.site-header-end {
		display: flex;
		align-items: center;
		justify-content: flex-end;
		gap: 0.75rem;
		flex-shrink: 0;
		padding-left: clamp(0.75rem, 2vw, 1.5rem);
		border-left: 1px solid var(--site-header-border);
	}

	.site-header-end--solo {
		padding-left: 0;
		border-left: 0;
	}

	.site-nav {
		display: flex;
		align-items: center;
		flex-shrink: 0;
		gap: 1.25rem;
		font-size: 0.875rem;
		white-space: nowrap;
	}

	.site-nav-admin {
		font-size: 0.8125rem;
	}

	.site-nav a,
	.nav-dropdown-trigger {
		color: var(--site-header-muted);
		text-decoration: none;
		padding: 0.25rem 0;
		border-bottom: 2px solid transparent;
	}

	.site-nav a:hover,
	.nav-dropdown-trigger:hover {
		color: var(--site-header-accent);
	}

	.site-nav a.active,
	.nav-dropdown-trigger.active {
		color: var(--site-header-text);
		border-bottom-color: var(--site-header-accent);
		font-weight: 600;
	}

	.signout-form {
		margin: 0;
	}

	.signout-form--desktop {
		display: block;
	}

	.admin-signout {
		border: 0;
		background: transparent;
		color: var(--site-header-muted);
		font: inherit;
		font-size: 0.8125rem;
		cursor: pointer;
		padding: 0.35rem 0.5rem;
		border-radius: var(--radius-md);
		white-space: nowrap;
	}

	.admin-signout:hover {
		color: var(--site-header-accent);
		background: var(--color-surface-hover);
	}

	.nav-dropdown {
		position: relative;
	}

	.nav-dropdown-trigger {
		display: inline-flex;
		align-items: center;
		gap: 0.25rem;
		border: 0;
		background: transparent;
		font: inherit;
		font-size: inherit;
		cursor: default;
	}

	.nav-dropdown-menu {
		position: absolute;
		top: 100%;
		right: 0;
		left: auto;
		z-index: 9100;
		padding-top: 0.35rem;
		opacity: 0;
		visibility: hidden;
		pointer-events: none;
		transition:
			opacity 0.15s ease,
			visibility 0.15s ease;
	}

	.nav-dropdown-menu.is-open {
		opacity: 1;
		visibility: visible;
		pointer-events: auto;
	}

	.nav-dropdown-panel {
		display: grid;
		min-width: 10rem;
		padding: 0.35rem;
		border: 1px solid var(--color-border);
		border-radius: var(--radius-md);
		background: var(--color-surface);
		box-shadow: 0 8px 24px rgb(15 23 42 / 12%);
	}

	.nav-dropdown-panel a {
		padding: 0.5rem 0.75rem;
		border-radius: var(--radius-sm);
		border-bottom: 0;
		color: var(--color-ink);
		text-decoration: none;
	}

	.nav-dropdown-panel a:hover {
		background: var(--color-surface-hover);
	}

	.nav-dropdown-panel a.active {
		background: var(--color-accent-soft);
		color: var(--color-accent);
		font-weight: 600;
	}

	.nav-drawer-admin--mobile {
		display: none;
	}

	.menu-toggle {
		display: none;
		position: relative;
		align-items: center;
		justify-content: center;
		width: 2.25rem;
		height: 2.25rem;
		padding: 0;
		border: 0;
		border-radius: var(--radius-md);
		background: transparent;
		color: var(--site-header-text);
		cursor: pointer;
	}

	.menu-toggle:hover {
		background: var(--color-surface-hover);
	}

	.menu-toggle-bar {
		position: absolute;
		left: 0.45rem;
		right: 0.45rem;
		height: 2px;
		border-radius: 999px;
		background: currentColor;
		transition:
			transform 0.38s cubic-bezier(0.34, 1.45, 0.64, 1),
			opacity 0.2s ease,
			width 0.38s cubic-bezier(0.34, 1.45, 0.64, 1);
	}

	.menu-toggle-bar--top {
		transform: translateY(-6px);
	}

	.menu-toggle-bar--middle {
		transform: translateY(0);
	}

	.menu-toggle-bar--bottom {
		transform: translateY(6px);
	}

	.menu-toggle--open .menu-toggle-bar--top {
		transform: translateY(0) rotate(45deg);
	}

	.menu-toggle--open .menu-toggle-bar--middle {
		opacity: 0;
		transform: scaleX(0);
	}

	.menu-toggle--open .menu-toggle-bar--bottom {
		transform: translateY(0) rotate(-45deg);
	}

	.nav-drawer-backdrop {
		position: fixed;
		inset: 0;
		top: var(--site-header-height, 3.25rem);
		z-index: 8990;
		border: 0;
		padding: 0;
		background: rgb(15 23 42 / 40%);
		opacity: 0;
		visibility: hidden;
		transition:
			opacity 0.25s ease,
			visibility 0.25s ease;
		pointer-events: none;
		cursor: default;
	}

	.nav-drawer-backdrop--open {
		opacity: 1;
		visibility: visible;
		pointer-events: auto;
	}

	@media (max-width: 767px) {
		.site-header-end {
			padding-left: 0.5rem;
			gap: 0.5rem;
		}

		.menu-toggle {
			display: inline-flex;
		}

		.signout-form--desktop,
		.site-nav-admin,
		.nav-dropdown--desktop {
			display: none;
		}

		.site-header-nav {
			position: fixed;
			top: var(--site-header-height, 3.25rem);
			right: 0;
			bottom: 0;
			z-index: 9005;
			display: flex;
			flex-direction: column;
			align-items: stretch;
			gap: 0;
			width: min(18rem, 100vw);
			padding: 1rem;
			border-left: 1px solid var(--site-header-border);
			background: var(--site-header-bg);
			box-shadow: -12px 0 32px rgb(15 23 42 / 12%);
			overflow-y: auto;
			transform: translateX(100%);
			transition: transform 0.32s cubic-bezier(0.34, 1.35, 0.64, 1);
			pointer-events: none;
		}

		.site-header-nav--open {
			transform: translateX(0);
			pointer-events: auto;
		}

		.nav-drawer-admin--mobile {
			display: flex;
			flex-direction: column;
			gap: 0.15rem;
		}

		.nav-drawer-label {
			margin: 0.75rem 0.35rem 0.25rem;
			font-size: 0.6875rem;
			font-weight: 600;
			letter-spacing: 0.08em;
			text-transform: uppercase;
			color: var(--site-header-muted);
		}

		.nav-drawer-link {
			display: block;
			padding: 0.75rem 0.5rem;
			border: 0;
			border-radius: var(--radius-md);
			background: transparent;
			color: var(--site-header-muted);
			font: inherit;
			font-size: 0.875rem;
			text-align: left;
			text-decoration: none;
			cursor: pointer;
		}

		.nav-drawer-link:hover {
			background: var(--color-surface-hover);
			color: var(--site-header-accent);
		}

		.nav-drawer-link.active {
			background: var(--color-accent-soft);
			color: var(--color-accent);
			font-weight: 600;
		}

		.nav-drawer-link--button {
			width: 100%;
		}

		.nav-drawer-signout {
			margin-top: 0.5rem;
			padding-top: 0.75rem;
			border-top: 1px solid var(--site-header-border);
		}
	}

	@media (min-width: 768px) {
		.nav-drawer-backdrop {
			display: none;
		}
	}
</style>
