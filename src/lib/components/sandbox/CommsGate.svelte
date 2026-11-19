<script lang="ts">
	import { onMount, type Snippet } from 'svelte';
	import { page } from '$app/state';
	import { SANDBOX_COMMS_TOOLTIP } from '$lib/sandbox';

	/**
	 * Wraps a notification control (send reminder, resend, etc.). In the portfolio sandbox the
	 * control is inert and a tooltip explains why; everywhere else it renders untouched.
	 */
	let { children }: { children: Snippet } = $props();

	const sandbox = $derived(Boolean(page.data.sandbox));
	const tipId = `comms-tip-${Math.random().toString(36).slice(2, 8)}`;
	// Esc hides the tooltip until the pointer/focus leaves and comes back (WCAG 1.4.13).
	let dismissed = $state(false);

	// The inert control hides its own text from assistive tech, so lift it onto the wrapper.
	let controlEl = $state<HTMLElement | null>(null);
	let controlName = $state('');
	onMount(() => {
		controlName = controlEl?.textContent?.replace(/\s+/g, ' ').trim() ?? '';
	});
</script>

{#if sandbox}
	<span
		class="comms-gate"
		class:comms-gate--dismissed={dismissed}
		tabindex="0"
		role="button"
		aria-label={controlName ? `${controlName} (not available in the sandbox)` : 'Not available in the sandbox'}
		aria-describedby={tipId}
		aria-disabled="true"
		onkeydown={(event) => {
			if (event.key === 'Escape') dismissed = true;
		}}
		onpointerleave={() => (dismissed = false)}
		onblur={() => (dismissed = false)}
	>
		<span class="comms-gate-control" inert bind:this={controlEl}>{@render children()}</span>
		<span class="comms-gate-tip" role="tooltip" id={tipId}>{SANDBOX_COMMS_TOOLTIP}</span>
	</span>
{:else}
	{@render children()}
{/if}

<style>
	.comms-gate {
		position: relative;
		display: inline-flex;
		border-radius: var(--radius-md);
		cursor: not-allowed;
	}

	.comms-gate:focus-visible {
		outline: 2px solid var(--color-accent);
		outline-offset: 2px;
	}

	.comms-gate-control {
		display: inline-flex;
		opacity: 0.5;
		filter: grayscale(0.4);
		pointer-events: none;
	}

	.comms-gate-tip {
		position: absolute;
		bottom: calc(100% + 0.5rem);
		left: 50%;
		z-index: 30;
		width: max-content;
		max-width: min(18rem, 80vw);
		padding: 0.55rem 0.7rem;
		border-radius: var(--radius-md);
		background: var(--color-ink);
		color: var(--color-surface);
		font-size: 0.8125rem;
		font-weight: 400;
		line-height: 1.45;
		text-align: left;
		white-space: normal;
		box-shadow: 0 8px 24px rgb(15 23 42 / 20%);
		opacity: 0;
		visibility: hidden;
		transform: translate(-50%, 0.25rem);
		transition:
			opacity 0.15s ease,
			transform 0.15s ease,
			visibility 0.15s;
	}

	/* Invisible bridge so the pointer can move onto the tooltip without it closing. */
	.comms-gate-tip::after {
		content: '';
		position: absolute;
		top: 100%;
		left: 0;
		right: 0;
		height: 0.5rem;
	}

	.comms-gate:hover .comms-gate-tip,
	.comms-gate:focus-visible .comms-gate-tip {
		opacity: 1;
		visibility: visible;
		transform: translate(-50%, 0);
	}

	.comms-gate--dismissed .comms-gate-tip {
		opacity: 0 !important;
		visibility: hidden !important;
	}

	@media (prefers-reduced-motion: reduce) {
		.comms-gate-tip {
			transition: none;
		}
	}
</style>
