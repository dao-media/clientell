<script lang="ts">
	import Btn from '$lib/components/Btn.svelte';
	import AuthDebugPanel from '$lib/components/auth/AuthDebugPanel.svelte';
	import LoginDurationSelect from '$lib/components/auth/LoginDurationSelect.svelte';
	import PinField from '$lib/components/auth/PinField.svelte';
	import PageHeader from '$lib/components/layout/PageHeader.svelte';
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

<PageShell width="form">
	<PageHeader
		kicker="Client portal"
		title="Choose your PIN"
		lead="This is your first sign-in. Pick a 6-digit PIN you will use from now on instead of the temporary one from your email."
	/>

	<!-- Enter-to-submit is delegated from the inputs inside; the inputs themselves are keyboard-accessible. -->
	<!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
	<form
		bind:this={formEl}
		use:bindAuthFormDebug={'set-pin'}
		method="POST"
		class="card form-group"
		novalidate
		onsubmit={(event) => event.preventDefault()}
		onkeydown={(event) => submitAuthFormOnEnter(event, { formId: 'set-pin' })}
	>
		<PinField id="pin" name="pin" label="New 6-digit PIN" />

		<PinField id="confirmPin" name="confirmPin" label="Confirm PIN" />

		{#if form?.error}
			<p class="form-error" role="alert">{form.error}</p>
		{/if}

		<LoginDurationSelect id="set-pin-login-duration" />

		<div class="form-actions">
			<Btn
				type="button"
				onclick={(event) => submitAuthFormFromClick(event, 'set-pin', formEl)}
			>
				Save PIN
			</Btn>
		</div>
	</form>

	<AuthDebugPanel serverDebug={form?.authDebug} />
</PageShell>
