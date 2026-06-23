<script lang="ts">
	import Btn from '$lib/components/Btn.svelte';
	import Alert from '$lib/components/ui/Alert.svelte';
	import PageShell from '$lib/components/layout/PageShell.svelte';
	import type { ActionData } from './$types';

	let { form }: { form: ActionData } = $props();
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

		<form method="POST" class="form-group">
			<div>
				<label class="label" for="email">Email</label>
				<input
					class="field"
					id="email"
					name="email"
					type="email"
					autocomplete="email"
					required
				/>
			</div>

			{#if form?.error}
				<p class="form-error">{form.error}</p>
			{/if}

			<div class="form-actions">
				<Btn class="w-full" type="submit">Send temporary PIN</Btn>
				<Btn class="w-full" variant="secondary" href="/portal">Back to sign in</Btn>
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

	.form-actions {
		display: grid;
		gap: 0.75rem;
	}
</style>
