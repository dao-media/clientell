<script lang="ts">
	import type { Component, Snippet } from 'svelte';
	import type { IconProps } from '@lucide/svelte';

	type IconComponent = Component<IconProps, {}, ''>;

	let {
		href,
		variant = 'primary',
		type = 'button',
		size = 'default',
		icon,
		class: className = '',
		children,
		...rest
	}: {
		href?: string;
		variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
		type?: 'button' | 'submit' | 'reset';
		size?: 'default' | 'small';
		icon?: IconComponent;
		class?: string;
		children?: Snippet;
		[key: string]: unknown;
	} = $props();

	const classes = $derived(
		`btn btn-${variant}${size === 'small' ? ' btn-sm' : ''} ${className}`.trim()
	);
</script>

{#if href}
	<a class={classes} {href} {...rest}>
		{#if icon}
			{@const Icon = icon}
			<Icon size={16} strokeWidth={2} aria-hidden="true" class="btn-icon" />
		{/if}
		{#if children}
			<span class="btn-label">{@render children()}</span>
		{/if}
	</a>
{:else}
	<button class={classes} {type} {...rest}>
		{#if icon}
			{@const Icon = icon}
			<Icon size={16} strokeWidth={2} aria-hidden="true" class="btn-icon" />
		{/if}
		{#if children}
			<span class="btn-label">{@render children()}</span>
		{/if}
	</button>
{/if}

<style>
	:global(.btn-icon) {
		flex-shrink: 0;
	}
</style>
