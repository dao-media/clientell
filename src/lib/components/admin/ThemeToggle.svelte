<script lang="ts">
	import { onMount } from 'svelte';
	import Monitor from '@lucide/svelte/icons/monitor';
	import Moon from '@lucide/svelte/icons/moon';
	import Sun from '@lucide/svelte/icons/sun';
	import {
		THEME_STORAGE_KEY,
		applyTheme,
		cycleTheme,
		getStoredTheme,
		themeLabel,
		type ThemeSetting
	} from '$lib/theme';

	let { compact = false, iconOnly = false }: { compact?: boolean; iconOnly?: boolean } = $props();

	let setting = $state<ThemeSetting>('system');
	let resolved = $state<'light' | 'dark'>('light');

	onMount(() => {
		setting = getStoredTheme();
		resolved = applyTheme(setting);

		const media = window.matchMedia('(prefers-color-scheme: dark)');
		const onChange = () => {
			if (setting === 'system') {
				resolved = applyTheme('system');
			}
		};
		media.addEventListener('change', onChange);
		return () => media.removeEventListener('change', onChange);
	});

	function toggleTheme() {
		setting = cycleTheme(setting);
		localStorage.setItem(THEME_STORAGE_KEY, setting);
		resolved = applyTheme(setting);
	}

	const Icon = $derived(setting === 'dark' ? Moon : setting === 'light' ? Sun : Monitor);
	const label = $derived(themeLabel(setting, resolved));
</script>

<button
	type="button"
	class="theme-toggle"
	class:theme-toggle--compact={compact && !iconOnly}
	class:theme-toggle--icon-only={iconOnly}
	aria-label="Theme: {label}. Click to change."
	onclick={toggleTheme}
>
	<Icon size={iconOnly ? 18 : compact ? 16 : 18} strokeWidth={2} aria-hidden="true" />
	{#if compact && !iconOnly}
		<span class="theme-toggle-label">{label}</span>
	{/if}
</button>

<style>
	.theme-toggle {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		gap: 0.5rem;
		border: 0;
		background: transparent;
		color: var(--site-header-muted, var(--color-muted));
		cursor: pointer;
		font: inherit;
		font-size: 0.8125rem;
		padding: 0.35rem 0.5rem;
		border-radius: var(--radius-md);
	}

	.theme-toggle:hover {
		color: var(--site-header-accent, var(--color-accent));
		background: var(--color-surface-hover);
	}

	.theme-toggle--icon-only {
		width: 2.25rem;
		height: 2.25rem;
		padding: 0;
	}

	.theme-toggle-label {
		white-space: nowrap;
	}
</style>
