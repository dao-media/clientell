<script lang="ts">
	import Btn from '$lib/components/Btn.svelte';
	import LogIn from '@lucide/svelte/icons/log-in';
	import PageShell from '$lib/components/layout/PageShell.svelte';
	import type { ActionData } from './$types';
	import { submitAuthFormOnEnter } from '$lib/utils/auth-form';

	let { form }: { form: ActionData } = $props();
</script>

<PageShell width="auth" center>
	<div class="card auth-panel">
		<h1>Client sign in</h1>
		<p class="auth-lead">
			Use the primary contact email and the 6-digit PIN you received.
		</p>

		<form
			method="POST"
			class="form-group"
			onkeydown={(event) => submitAuthFormOnEnter(event, { focusPinOnEmail: true })}
		>
			<div>
				<label class="label" for="email">Email</label>
				<input class="field" id="email" name="email" type="email" autocomplete="email" required />
			</div>
			<div>
				<label class="label" for="pin">6-digit PIN</label>
				<input
					class="field font-mono tracking-[0.3em]"
					id="pin"
					name="pin"
					inputmode="numeric"
					pattern="[0-9]{6}"
					maxlength="6"
					required
				/>
			</div>

			{#if form?.error}
				<p class="form-error">{form.error}</p>
			{/if}

			<div class="form-actions">
				<Btn class="w-full" type="submit" icon={LogIn}>Continue</Btn>
			</div>
		</form>
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
</style>
