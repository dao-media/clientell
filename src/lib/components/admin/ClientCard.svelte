<script lang="ts">
	import { enhance } from '$app/forms';
	import Lock from '@lucide/svelte/icons/lock';
	import LockOpen from '@lucide/svelte/icons/lock-open';
	import { formatUsPhoneDisplay } from '$lib/phone';
	import Checkbox from '$lib/components/ui/Checkbox.svelte';
	import { formatRelativeTime } from '$lib/utils';

	type ClientItem = {
		id: string;
		company: string;
		contactName: string;
		email: string;
		phone: string | null;
		services: string[];
		createdAt: Date;
		isLocked?: boolean;
		pinLockoutUntil?: Date | string | null;
	};

	let {
		client,
		selectMode = false,
		selected = false,
		ontoggle,
		onedit,
		onlockchange
	}: {
		client: ClientItem;
		selectMode?: boolean;
		selected?: boolean;
		ontoggle?: (clientId: string, checked: boolean) => void;
		onedit: (client: ClientItem) => void;
		onlockchange?: (result: import('@sveltejs/kit').ActionResult) => void | Promise<void>;
	} = $props();

	let confirmUnlock = $state(false);
	let lockForm = $state<HTMLFormElement | null>(null);
	let forceResetValue = $state('0');

	const coolingDown = $derived(
		!client.isLocked &&
			client.pinLockoutUntil != null &&
			new Date(client.pinLockoutUntil).getTime() > Date.now()
	);

	let noButton = $state<HTMLButtonElement | null>(null);
	let switchButton = $state<HTMLButtonElement | null>(null);

	function onToggle() {
		if (client.isLocked) {
			confirmUnlock = true;
			// Keep keyboard focus inside the prompt that replaced the switch (WCAG 2.4.3).
			queueMicrotask(() => noButton?.focus());
			return;
		}
		forceResetValue = '0';
		lockForm?.requestSubmit();
	}

	function cancelUnlock() {
		confirmUnlock = false;
		queueMicrotask(() => switchButton?.focus());
	}

	function unlock(forceReset: boolean) {
		forceResetValue = forceReset ? '1' : '0';
		confirmUnlock = false;
		// Let the hidden input update before submitting.
		queueMicrotask(() => lockForm?.requestSubmit());
	}
</script>

<article class="client-card card" class:select-mode={selectMode}>
	{#if selectMode}
		<div class="client-select">
			<Checkbox
				checked={selected}
				hideLabel
				id="select-client-{client.id}"
				onchange={(event) =>
					ontoggle?.(client.id, (event.currentTarget as HTMLInputElement).checked)}
			/>
		</div>
	{/if}

	<button
		type="button"
		class="client-card-main"
		disabled={selectMode}
		onclick={() => onedit(client)}
	>
		<p class="client-company">{client.company}</p>
		<p class="client-contact">{client.contactName}</p>
		<p class="client-meta text-break">{client.email}</p>
		{#if client.phone}
			<p class="client-meta">{formatUsPhoneDisplay(client.phone)}</p>
		{/if}
		<p class="client-added">Added {formatRelativeTime(new Date(client.createdAt))}</p>
	</button>

	{#if !selectMode}
		<form
			bind:this={lockForm}
			method="POST"
			action="?/setClientLock"
			class="client-lock"
			use:enhance={() => {
				return async ({ result, update }) => {
					await onlockchange?.(result);
					await update({ reset: false, invalidateAll: false });
				};
			}}
		>
			<input type="hidden" name="clientId" value={client.id} />
			<input type="hidden" name="locked" value={client.isLocked ? '0' : '1'} />
			<input type="hidden" name="forcePinReset" value={forceResetValue} />

			{#if confirmUnlock}
				<!-- Esc from either button inside cancels; the buttons themselves are the controls. -->
				<!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
				<div
					class="client-lock-confirm"
					role="group"
					aria-labelledby="unlock-q-{client.id}"
					onkeydown={(event) => event.key === 'Escape' && cancelUnlock()}
				>
					<p class="client-lock-question" id="unlock-q-{client.id}">
						Unlock {client.company}. Force a PIN reset?
					</p>
					<div class="client-lock-buttons">
						<button type="button" class="lock-btn" bind:this={noButton} onclick={() => unlock(false)}>No</button>
						<button type="button" class="lock-btn lock-btn--primary" onclick={() => unlock(true)}>
							Yes
						</button>
						<button type="button" class="lock-btn lock-btn--ghost" onclick={cancelUnlock}>
							Cancel
						</button>
					</div>
				</div>
			{:else}
				<span class="client-lock-status" class:is-locked={client.isLocked} class:is-cooling={coolingDown}>
					{#if client.isLocked}
						<Lock size={14} aria-hidden="true" /> Locked
					{:else if coolingDown}
						<Lock size={14} aria-hidden="true" /> 30-min lockout
					{:else}
						<LockOpen size={14} aria-hidden="true" /> Active
					{/if}
				</span>
				<button
					type="button"
					role="switch"
					class="lock-switch"
					bind:this={switchButton}
					aria-checked={client.isLocked ? 'true' : 'false'}
					aria-label={client.isLocked ? `Unlock ${client.company}` : `Lock ${client.company}`}
					onclick={onToggle}
				>
					<span class="lock-switch-thumb"></span>
				</button>
			{/if}
		</form>
	{/if}
</article>

<style>
	.client-card {
		display: grid;
		grid-template-columns: auto 1fr;
		align-items: start;
		padding: 0;
		overflow: hidden;
		width: 100%;
		max-width: 100%;
	}

	.client-card:not(.select-mode) {
		grid-template-columns: 1fr;
	}

	.client-select {
		display: flex;
		align-items: flex-start;
		padding: 1rem 0 0 0.75rem;
	}

	.client-card-main {
		display: grid;
		gap: 0;
		width: 100%;
		padding: 1.5rem;
		border: 0;
		background: transparent;
		color: inherit;
		font: inherit;
		text-align: left;
		cursor: pointer;
	}

	.client-card-main:hover:not(:disabled) {
		background: var(--color-surface-hover);
	}

	.client-card-main:disabled {
		cursor: default;
	}

	.client-company {
		font-size: 1rem;
		font-weight: 600;
	}

	.client-contact {
		margin-top: 0.35rem;
		font-size: 0.875rem;
	}

	.client-meta,
	.client-added {
		margin-top: 0.25rem;
		color: var(--color-muted);
		font-size: 0.8125rem;
	}

	.client-added {
		margin-top: 0.75rem;
	}

	.client-lock {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 0.75rem;
		padding: 0.75rem 1.5rem;
		border-top: 1px solid var(--color-border);
	}

	.client-lock-status {
		display: inline-flex;
		align-items: center;
		gap: 0.35rem;
		font-size: 0.8125rem;
		color: var(--color-muted);
	}

	.client-lock-status.is-locked {
		color: var(--color-danger);
		font-weight: 600;
	}

	.client-lock-status.is-cooling {
		color: var(--color-warning);
		font-weight: 600;
	}

	/* 44×26px: clears the 24px target minimum (2.5.8); track and thumb meet 3:1 (1.4.11). */
	.lock-switch {
		position: relative;
		width: 2.75rem;
		height: 1.625rem;
		flex-shrink: 0;
		border: 1px solid var(--color-control-border);
		border-radius: 999px;
		background: var(--color-surface-muted);
		cursor: pointer;
		transition:
			background 0.2s ease,
			border-color 0.2s ease;
	}

	.lock-switch[aria-checked='true'] {
		border-color: var(--color-danger);
		background: var(--color-danger);
	}

	.lock-switch-thumb {
		position: absolute;
		top: 50%;
		left: 0.1875rem;
		width: 1.125rem;
		height: 1.125rem;
		border-radius: 50%;
		background: var(--color-control-border-hover);
		transform: translateY(-50%);
		transition:
			transform 0.2s ease,
			background 0.2s ease;
	}

	.lock-switch[aria-checked='true'] .lock-switch-thumb {
		background: var(--color-surface);
		transform: translate(1.125rem, -50%);
	}

	@media (prefers-reduced-motion: reduce) {
		.lock-switch,
		.lock-switch-thumb {
			transition: none;
		}
	}

	.lock-switch:focus-visible,
	.lock-btn:focus-visible {
		outline: 2px solid var(--color-accent);
		outline-offset: 2px;
	}

	.client-lock-confirm {
		display: grid;
		gap: 0.5rem;
		width: 100%;
	}

	.client-lock-question {
		font-size: 0.875rem;
		font-weight: 600;
	}

	.client-lock-buttons {
		display: flex;
		gap: 0.5rem;
	}

	.lock-btn {
		min-height: 2.25rem;
		padding: 0.35rem 0.85rem;
		border: 1px solid var(--color-control-border);
		border-radius: var(--radius-md);
		background: var(--color-surface);
		color: inherit;
		font: inherit;
		font-size: 0.8125rem;
		cursor: pointer;
	}

	.lock-btn--primary {
		border-color: var(--color-accent);
		background: var(--color-accent);
		color: var(--color-on-accent);
	}

	.lock-btn--ghost {
		border-color: transparent;
		background: transparent;
		color: var(--color-muted);
	}
</style>
