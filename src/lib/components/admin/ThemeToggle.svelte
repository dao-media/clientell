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

	/**
	 * Appearance control. Defaults to System and follows OS changes live.
	 * Wide screens: a three-option segmented switch (System / Light / Dark).
	 * Narrow screens: one button that cycles, so the header still fits.
	 */
	let { iconOnly = false }: { compact?: boolean; iconOnly?: boolean } = $props();

	const OPTIONS: Array<{ value: ThemeSetting; label: string; icon: typeof Sun }> = [
		{ value: 'system', label: 'System', icon: Monitor },
		{ value: 'light', label: 'Light', icon: Sun },
		{ value: 'dark', label: 'Dark', icon: Moon }
	];

	let setting = $state<ThemeSetting>('system');
	let resolved = $state<'light' | 'dark'>('light');

	onMount(() => {
		setting = getStoredTheme();
		resolved = applyTheme(setting);

		const media = window.matchMedia('(prefers-color-scheme: dark)');
		const onChange = () => {
			if (setting === 'system') resolved = applyTheme('system');
		};
		media.addEventListener('change', onChange);
		return () => media.removeEventListener('change', onChange);
	});

	function choose(next: ThemeSetting) {
		setting = next;
		try {
			if (next === 'system') localStorage.removeItem(THEME_STORAGE_KEY);
			else localStorage.setItem(THEME_STORAGE_KEY, next);
		} catch {
			// Storage blocked (private mode): the choice still applies for this page view.
		}
		resolved = applyTheme(next);
	}

	const CurrentIcon = $derived(OPTIONS.find((option) => option.value === setting)?.icon ?? Monitor);
	const nextLabel = $derived(OPTIONS.find((option) => option.value === cycleTheme(setting))?.label);
</script>

<div class="theme-switch" class:theme-switch--icon-only={iconOnly}>
	<div class="theme-segmented" role="group" aria-label="Color theme">
		{#each OPTIONS as option (option.value)}
			{@const OptionIcon = option.icon}
			<button
				type="button"
				class="theme-option"
				aria-pressed={setting === option.value}
				title={option.value === 'system' ? `System (currently ${resolved})` : option.label}
				onclick={() => choose(option.value)}
			>
				<OptionIcon size={16} strokeWidth={2} aria-hidden="true" />
				<span class="visually-hidden">{option.label}</span>
			</button>
		{/each}
	</div>

	<button
		type="button"
		class="theme-cycle"
		aria-label="Color theme: {themeLabel(setting, resolved)}. Switch to {nextLabel}."
		onclick={() => choose(cycleTheme(setting))}
	>
		<CurrentIcon size={18} strokeWidth={2} aria-hidden="true" />
	</button>
</div>

<style>
	.theme-switch {
		display: inline-flex;
	}

	.theme-segmented {
		display: inline-flex;
		gap: 2px;
		padding: 2px;
		border: 1px solid var(--color-control-border);
		border-radius: 999px;
		background: var(--color-surface);
	}

	.theme-option,
	.theme-cycle {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		border: 0;
		background: transparent;
		color: var(--site-header-muted, var(--color-muted));
		cursor: pointer;
	}

	/* 28px buttons clear the 24px WCAG 2.5.8 minimum. */
	.theme-option {
		width: 1.75rem;
		height: 1.75rem;
		border-radius: 999px;
	}

	.theme-option:hover {
		color: var(--color-ink);
		background: var(--color-surface-hover);
	}

	.theme-option[aria-pressed='true'] {
		background: var(--color-accent);
		color: var(--color-on-accent);
	}

	.theme-cycle {
		display: none;
		width: 2.25rem;
		height: 2.25rem;
		border-radius: var(--control-radius);
	}

	.theme-cycle:hover {
		color: var(--site-header-accent, var(--color-accent));
		background: var(--color-surface-hover);
	}

	.theme-option:focus-visible,
	.theme-cycle:focus-visible {
		outline: 2px solid var(--color-focus-ring);
		outline-offset: 2px;
	}

	@media (max-width: 639px) {
		.theme-segmented {
			display: none;
		}

		.theme-cycle {
			display: inline-flex;
		}
	}
</style>
