<script lang="ts">
	import Btn from '$lib/components/Btn.svelte';
	import AuthDebugPanel from '$lib/components/auth/AuthDebugPanel.svelte';
	import ForgotPinLink from '$lib/components/auth/ForgotPinLink.svelte';
	import LoginDurationSelect from '$lib/components/auth/LoginDurationSelect.svelte';
	import PinField from '$lib/components/auth/PinField.svelte';
	import LogIn from '@lucide/svelte/icons/log-in';
	import PageShell from '$lib/components/layout/PageShell.svelte';
	import type { ActionData } from './$types';
	import { bindAuthFormDebug, submitAuthForm, submitAuthFormOnEnter } from '$lib/utils/auth-form';

	let { form }: { form: ActionData } = $props();

	let formEl = $state<HTMLFormElement | null>(null);

	$effect(() => {
		return bindAuthFormDebug(formEl, 'portal-sign-in');
	});
</script>

<PageShell width="auth" center>
	<div class="card auth-panel">
		<h1>Client sign in</h1>
		<p class="auth-lead">
			Use the primary contact email and the 6-digit PIN you received.
		</p>

		<form
			bind:this={formEl}
			method="POST"
			class="form-group"
			novalidate
			onsubmit={(event) => submitAuthForm(event, 'portal-sign-in')}
			onkeydown={(event) =>
				submitAuthFormOnEnter(event, { focusPinOnEmail: true, formId: 'portal-sign-in' })}
		>
			<div>
				<label class="label" for="email">Email</label>
				<input
					class="field"
					id="email"
					name="email"
					type="text"
					inputmode="email"
					autocomplete="email"
					spellcheck="false"
				/>
			</div>
			<div>
				<label class="label" for="pin">6-digit PIN</label>
				<PinField id="pin" name="pin" />
			</div>

			{#if form?.error}
				<p class="form-error">{form.error}</p>
			{/if}

			<p class="auth-helper">
				<ForgotPinLink />
			</p>

			<LoginDurationSelect id="portal-login-duration" />

			<div class="form-actions">
				<Btn class="w-full" type="submit" icon={LogIn}>Continue</Btn>
			</div>
		</form>

		<AuthDebugPanel serverDebug={form?.authDebug} />
	</div>
</PageShell>

<style>
	.auth-panel {
		width: 100%;
	}

	h1 {
		font-size: 1.5rem;
		font-weight: 600;
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
