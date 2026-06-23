<script lang="ts">
	import Btn from '$lib/components/Btn.svelte';
	import ForgotPinLink from '$lib/components/auth/ForgotPinLink.svelte';
	import LoginDurationSelect from '$lib/components/auth/LoginDurationSelect.svelte';
	import Field from '$lib/components/ui/Field.svelte';
	import PageHeader from '$lib/components/layout/PageHeader.svelte';
	import PageShell from '$lib/components/layout/PageShell.svelte';
	import ArrowRight from '@lucide/svelte/icons/arrow-right';
	import LogIn from '@lucide/svelte/icons/log-in';
	import type { ActionData } from './$types';
	import { submitAuthFormOnEnter } from '$lib/utils/auth-form';

	let { form }: { form: ActionData } = $props();

	let expanded = $state<'admin' | 'portal' | null>(null);
	let gridEl = $state<HTMLElement | null>(null);

	function expandPanel(panel: 'admin' | 'portal') {
		expanded = panel;
	}

	function collapsePanel() {
		expanded = null;
	}

	$effect(() => {
		if (form?.adminError) expanded = 'admin';
		else if (form?.portalError) expanded = 'portal';
	});

	$effect(() => {
		if (!expanded) return;

		const onPointerDown = (event: PointerEvent) => {
			if (gridEl?.contains(event.target as Node)) return;
			collapsePanel();
		};

		const onKeydown = (event: KeyboardEvent) => {
			if (event.key === 'Escape') collapsePanel();
		};

		document.addEventListener('pointerdown', onPointerDown);
		window.addEventListener('keydown', onKeydown);

		return () => {
			document.removeEventListener('pointerdown', onPointerDown);
			window.removeEventListener('keydown', onKeydown);
		};
	});
</script>

<PageShell>
	<PageHeader
		kicker="Client intake"
		title="Collect briefs without the back-and-forth."
		lead="Send a link, share a PIN, and let clients answer on their own time — with autosave, resume, and submit."
	/>

	<div
		bind:this={gridEl}
		class="home-grid"
		class:home-grid--admin={expanded === 'admin'}
		class:home-grid--portal={expanded === 'portal'}
	>
		<div
			class="card home-tile"
			class:home-tile--expanded={expanded === 'admin'}
			class:home-tile--hidden={expanded === 'portal'}
		>
			{#if expanded === 'admin'}
				<div class="home-tile-panel">
					<h2 class="home-tile-label">Admin sign in</h2>
					<p class="home-tile-desc">Use your Briefly admin password.</p>

					<form
						method="POST"
						action="?/adminLogin"
						class="form-group home-login-form"
						onkeydown={submitAuthFormOnEnter}
					>
						<Field
							labelText="Password"
							type="password"
							id="home-admin-password"
							name="password"
							required
							invalidText={form?.adminError}
						/>
						<LoginDurationSelect id="home-admin-login-duration" />
						<div class="form-actions">
							<Btn type="submit">Sign in</Btn>
							<Btn variant="ghost" type="button" onclick={collapsePanel}>Cancel</Btn>
						</div>
					</form>
				</div>
			{:else}
				<button type="button" class="home-tile-trigger" onclick={() => expandPanel('admin')}>
					<p class="home-tile-label">Admin console</p>
					<p class="home-tile-desc">Build briefs, manage clients, and track submissions.</p>
					<span class="home-tile-action">
						Sign in
						<ArrowRight size={16} strokeWidth={2} aria-hidden="true" />
					</span>
				</button>
			{/if}
		</div>

		<div
			class="card home-tile"
			class:home-tile--expanded={expanded === 'portal'}
			class:home-tile--hidden={expanded === 'admin'}
		>
			{#if expanded === 'portal'}
				<div class="home-tile-panel">
					<h2 class="home-tile-label">Client sign in</h2>
					<p class="home-tile-desc">
						Use the primary contact email and the 6-digit PIN you received.
					</p>

					<form
						method="POST"
						action="?/portalLogin"
						class="form-group home-login-form"
						onkeydown={(event) => submitAuthFormOnEnter(event, { focusPinOnEmail: true })}
					>
						<div>
							<label class="label" for="home-portal-email">Email</label>
							<input
								class="field"
								id="home-portal-email"
								name="email"
								type="email"
								autocomplete="email"
								required
							/>
						</div>
						<div>
							<label class="label" for="home-portal-pin">6-digit PIN</label>
							<input
								class="field font-mono tracking-[0.3em]"
								id="home-portal-pin"
								name="pin"
								inputmode="numeric"
								pattern="[0-9]{6}"
								maxlength="6"
								required
							/>
						</div>

						{#if form?.portalError}
							<p class="form-error">{form.portalError}</p>
						{/if}

						<p class="auth-helper">
							<ForgotPinLink />
						</p>

						<LoginDurationSelect id="home-portal-login-duration" />

						<div class="form-actions">
							<Btn type="submit" icon={LogIn}>Continue</Btn>
							<Btn variant="ghost" type="button" onclick={collapsePanel}>Cancel</Btn>
						</div>
					</form>
				</div>
			{:else}
				<button type="button" class="home-tile-trigger" onclick={() => expandPanel('portal')}>
					<p class="home-tile-label">Client portal</p>
					<p class="home-tile-desc">Sign in with email and PIN to complete or resume a brief.</p>
					<span class="home-tile-action">
						Sign in
						<ArrowRight size={16} strokeWidth={2} aria-hidden="true" />
					</span>
				</button>
			{/if}
		</div>
	</div>
</PageShell>

<style>
	.home-grid {
		display: grid;
		grid-template-columns: repeat(2, minmax(0, 1fr));
		gap: var(--layout-grid-gap);
		transition: grid-template-columns 0.35s cubic-bezier(0.34, 1.2, 0.64, 1);
	}

	.home-grid--admin,
	.home-grid--portal {
		grid-template-columns: minmax(0, 1fr);
	}

	.home-tile {
		display: grid;
		min-height: 9rem;
		overflow: hidden;
		transition:
			opacity 0.28s ease,
			transform 0.35s cubic-bezier(0.34, 1.2, 0.64, 1),
			box-shadow 0.25s ease;
	}

	.home-tile--hidden {
		display: none;
	}

	.home-tile--expanded {
		box-shadow: 0 10px 32px rgb(15 23 42 / 10%);
	}

	.home-tile-trigger {
		display: grid;
		gap: 0.5rem;
		width: 100%;
		height: 100%;
		padding: 0;
		border: 0;
		background: transparent;
		color: inherit;
		font: inherit;
		text-align: left;
		cursor: pointer;
	}

	.home-tile-trigger:hover .home-tile-action {
		color: var(--color-accent);
	}

	.home-tile-panel {
		display: grid;
		gap: 0.5rem;
		animation: home-panel-in 0.35s cubic-bezier(0.34, 1.2, 0.64, 1);
	}

	.home-tile-label {
		font-size: 1rem;
		font-weight: 600;
	}

	.home-tile-desc {
		color: var(--color-muted);
		font-size: 0.875rem;
		line-height: 1.5;
	}

	.home-tile-action {
		display: inline-flex;
		align-items: center;
		gap: 0.35rem;
		margin-top: auto;
		padding-top: 0.75rem;
		font-size: 0.875rem;
		font-weight: 500;
		color: var(--color-accent);
	}

	.home-login-form {
		margin-top: 0.75rem;
	}

	.auth-helper {
		margin: 0;
	}

	@keyframes home-panel-in {
		from {
			opacity: 0;
			transform: translateY(0.35rem);
		}

		to {
			opacity: 1;
			transform: translateY(0);
		}
	}

	@media (max-width: 767px) {
		.home-grid {
			grid-template-columns: minmax(0, 1fr);
		}

		.home-tile {
			min-height: auto;
		}
	}
</style>
