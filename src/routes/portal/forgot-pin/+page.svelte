<script lang="ts">
	import Btn from '$lib/components/Btn.svelte';
	import AuthDebugPanel from '$lib/components/auth/AuthDebugPanel.svelte';
	import Alert from '$lib/components/ui/Alert.svelte';
	import PageShell from '$lib/components/layout/PageShell.svelte';
	import type { ActionData } from './$types';
	import { authDebug, maskEmail } from '$lib/debug/auth-debug';
	import { bindAuthFormDebug, submitAuthFormElement } from '$lib/utils/auth-form';
	import { normalizeEmail } from '$lib/utils';

	let { form }: { form: ActionData } = $props();

	let formEl = $state<HTMLFormElement | null>(null);

	$effect(() => {
		return bindAuthFormDebug(formEl, 'forgot-pin');
	});

	function onSubmit(event: SubmitEvent) {
		event.preventDefault();
		const formElement = event.currentTarget;
		if (formElement instanceof HTMLFormElement) {
			const email = formElement.querySelector<HTMLInputElement>('input[name="email"]');
			if (email) {
				const raw = email.value;
				email.value = normalizeEmail(raw);
				authDebug('forgot-pin-email-normalized', {
					before: maskEmail(raw),
					after: maskEmail(email.value)
				});
			}
			submitAuthFormElement(formElement, 'forgot-pin');
		}
	}
</script>

<PageShell width="auth" center>
	<div class="card auth-panel">
		<h1>Forgot PIN</h1>
		<p class="auth-lead">
			Enter the email you use for portal sign-in. We will send a new temporary PIN. The first time
			you sign in with it, you will choose your own 6-digit PIN.
		</p>

		{#if form?.success && form.message}
			<Alert variant="success" title="Check your email" subtitle={form.message} />
		{/if}

		<form bind:this={formEl} method="POST" class="form-group" novalidate onsubmit={onSubmit}>
			<div>
				<label class="label" for="email">Email</label>
				<input
					class="field"
					id="email"
					name="email"
					type="text"
					autocomplete="off"
					spellcheck="false"
				/>
			</div>

			{#if form?.error}
				<p class="form-error">{form.error}</p>
			{/if}

			<div class="form-actions">
				<Btn class="w-full" type="button" onclick={() => formEl && submitAuthFormElement(formEl, 'forgot-pin')}>
					Send temporary PIN
				</Btn>
				<Btn class="w-full" variant="secondary" href="/portal">Back to sign in</Btn>
			</div>
		</form>

		<AuthDebugPanel />
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

	.form-actions {
		display: grid;
		gap: 0.75rem;
	}
</style>
