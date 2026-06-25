<script lang="ts">
	import Btn from '$lib/components/Btn.svelte';
	import AuthDebugPanel from '$lib/components/auth/AuthDebugPanel.svelte';
	import LoginDurationSelect from '$lib/components/auth/LoginDurationSelect.svelte';
	import PinField from '$lib/components/auth/PinField.svelte';
	import PageHeader from '$lib/components/layout/PageHeader.svelte';
	import PageShell from '$lib/components/layout/PageShell.svelte';
	import type { ActionData } from './$types';
	import { bindAuthFormDebug, submitAuthFormElement } from '$lib/utils/auth-form';

	let { form }: { form: ActionData } = $props();

	let formEl = $state<HTMLFormElement | null>(null);

	$effect(() => {
		return bindAuthFormDebug(formEl, 'set-pin');
	});
</script>

<PageShell width="form">
	<PageHeader
		kicker="Client portal"
		title="Choose your PIN"
		lead="This is your first sign-in. Pick a 6-digit PIN you will use from now on instead of the temporary one from your email."
	/>

	<form
		bind:this={formEl}
		method="POST"
		class="card form-group"
		novalidate
		onsubmit={(event) => event.preventDefault()}
	>
		<div>
			<label class="label" for="pin">New 6-digit PIN</label>
			<PinField id="pin" name="pin" />
		</div>

		<div>
			<label class="label" for="confirmPin">Confirm PIN</label>
			<PinField id="confirmPin" name="confirmPin" />
		</div>

		{#if form?.error}
			<p class="form-error">{form.error}</p>
		{/if}

		<LoginDurationSelect id="set-pin-login-duration" />

		<div class="form-actions">
			<Btn type="button" onclick={() => formEl && submitAuthFormElement(formEl, 'set-pin')}>
				Save PIN and continue
			</Btn>
		</div>
	</form>

	<AuthDebugPanel serverDebug={form?.authDebug} />
</PageShell>
