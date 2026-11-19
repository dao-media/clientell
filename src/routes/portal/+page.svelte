<script lang="ts">
	import Btn from '$lib/components/Btn.svelte';
	import AuthDebugPanel from '$lib/components/auth/AuthDebugPanel.svelte';
	import ForgotPinLink from '$lib/components/auth/ForgotPinLink.svelte';
	import LoginDurationSelect from '$lib/components/auth/LoginDurationSelect.svelte';
	import PinField from '$lib/components/auth/PinField.svelte';
	import LogIn from '@lucide/svelte/icons/log-in';
	import PageShell from '$lib/components/layout/PageShell.svelte';
	import type { ActionData } from './$types';
	import {
		bindAuthFormDebug,
		submitAuthFormFromClick,
		submitAuthFormOnEnter
	} from '$lib/utils/auth-form';

	let { form }: { form: ActionData } = $props();

	let formEl = $state<HTMLFormElement | null>(null);
</script>

<PageShell width="auth" center>
	<div class="card auth-panel">
		<h1>Client sign in</h1>
		<p class="auth-lead">
			Use the primary contact email and the 6-digit PIN you received.
		</p>

		<!-- Enter-to-submit is delegated from the inputs inside; the inputs themselves are keyboard-accessible. -->
		<!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
		<form
			bind:this={formEl}
			use:bindAuthFormDebug={'portal-sign-in'}
			method="POST"
			class="form-group"
			novalidate
			onsubmit={(event) => event.preventDefault()}
			onkeydown={(event) =>
				submitAuthFormOnEnter(event, { focusPinOnEmail: true, formId: 'portal-sign-in' })}
		>
			<div class="float-field">
				<input
					class="field"
					placeholder=" "
					id="email"
					name="email"
					type="text"
					autocomplete="off"
					spellcheck="false"
				/>
				<label class="float-field__label" for="email">Email</label>
			</div>
			<PinField id="pin" name="pin" label="6-digit PIN" />

			{#if form?.error}
				<p class="form-error" role="alert">{form.error}</p>
			{/if}

			<p class="auth-helper">
				<ForgotPinLink />
			</p>

			<LoginDurationSelect id="portal-login-duration" />

			<div class="form-actions">
				<Btn
					class="w-full"
					type="button"
					icon={LogIn}
					onclick={(event) => submitAuthFormFromClick(event, 'portal-sign-in', formEl)}
				>
					Continue
				</Btn>
			</div>
		</form>

		<AuthDebugPanel serverDebug={form?.authDebug} />
	</div>
</PageShell>

<style>
	.auth-panel {
		width: 100%;
	}

	.auth-lead {
		margin: 0.5rem 0 1.25rem;
		color: var(--color-muted);
		font-size: 0.875rem;
	}

	.auth-helper {
		margin: 0;
	}
</style>
