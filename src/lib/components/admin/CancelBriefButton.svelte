<script lang="ts">
	import { enhance } from '$app/forms';
	import Btn from '$lib/components/Btn.svelte';
	import Modal from '$lib/components/ui/Modal.svelte';

	let {
		actionBase,
		hasClientContent,
		briefTitle = 'this brief',
		returnTo = '/admin/submissions',
		stayInPlace = false,
		onComplete
	}: {
		actionBase: string;
		hasClientContent: boolean;
		briefTitle?: string;
		returnTo?: string;
		stayInPlace?: boolean;
		onComplete?: () => void | Promise<void>;
	} = $props();

	let confirmOpen = $state(false);
	let formEl = $state<HTMLFormElement | null>(null);
	let submitting = $state(false);

	function requestCancel() {
		if (hasClientContent) {
			confirmOpen = true;
			return;
		}
		formEl?.requestSubmit();
	}

	function submitCancel() {
		confirmOpen = false;
		formEl?.requestSubmit();
	}
</script>

<Btn variant="danger" type="button" onclick={requestCancel} disabled={submitting}>
	Cancel brief
</Btn>

<form
	bind:this={formEl}
	method="POST"
	action="{actionBase}?/cancelBrief"
	class="cancel-brief-form"
	use:enhance={() => {
		submitting = true;
		return async ({ result, update }) => {
			submitting = false;
			confirmOpen = false;

			if (result.type === 'success') {
				await onComplete?.();
			}

			if (stayInPlace && result.type === 'success') {
				return;
			}

			await update();
		};
	}}
>
	<input type="hidden" name="returnTo" value={returnTo} />
	{#if stayInPlace}
		<input type="hidden" name="stayInPlace" value="true" />
	{/if}
</form>

<Modal bind:open={confirmOpen} title="Cancel brief?" size="sm">
	<p>
		This will permanently delete <strong>{briefTitle}</strong> and remove any answers the client has
		saved.
	</p>
	{#snippet footer()}
		<Btn variant="ghost" type="button" onclick={() => (confirmOpen = false)} disabled={submitting}>
			Keep brief
		</Btn>
		<Btn variant="danger" type="button" onclick={submitCancel} disabled={submitting}>
			Cancel brief
		</Btn>
	{/snippet}
</Modal>

<style>
	.cancel-brief-form {
		display: contents;
	}
</style>
