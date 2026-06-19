<script lang="ts">
	import Btn from '$lib/components/Btn.svelte';
	import Field from '$lib/components/ui/Field.svelte';
	import PageShell from '$lib/components/layout/PageShell.svelte';
	import type { ActionData } from './$types';
	import { submitAuthFormOnEnter } from '$lib/utils/auth-form';

	let { form }: { form: ActionData } = $props();
</script>

<PageShell width="auth" center>
	<div class="card auth-panel">
		<h1>Admin sign in</h1>
		<p class="auth-lead">Use your Briefly admin password.</p>

		<form method="POST" class="form-group" onkeydown={submitAuthFormOnEnter}>
			<Field
				labelText="Password"
				type="password"
				id="password"
				name="password"
				required
				invalidText={form?.error}
			/>
			<div class="form-actions">
				<Btn type="submit">Sign in</Btn>
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
	}
</style>
