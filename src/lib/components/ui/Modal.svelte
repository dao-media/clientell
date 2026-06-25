<script lang="ts">
	import type { Snippet } from 'svelte';

	let {
		open = $bindable(false),
		title = '',
		size = 'default',
		closeOnBackdrop = true,
		closeOnEscape = true,
		beforeClose,
		children,
		footer,
		onclose
	}: {
		open?: boolean;
		title?: string;
		size?: 'default' | 'sm';
		closeOnBackdrop?: boolean;
		closeOnEscape?: boolean;
		beforeClose?: () => boolean | Promise<boolean>;
		children?: Snippet;
		footer?: Snippet;
		onclose?: () => void;
	} = $props();

	async function close() {
		if (beforeClose) {
			const allowed = await beforeClose();
			if (!allowed) return;
		}

		open = false;
		onclose?.();
	}

	function onBackdropClick(event: MouseEvent) {
		if (!closeOnBackdrop) return;
		if (event.target === event.currentTarget) void close();
	}

	$effect(() => {
		if (!open) return;

		function onKeydown(event: KeyboardEvent) {
			if (event.key === 'Escape' && closeOnEscape) void close();
		}

		window.addEventListener('keydown', onKeydown);
		return () => window.removeEventListener('keydown', onKeydown);
	});
</script>

{#if open}
	<div class="modal-overlay" onclick={onBackdropClick} role="presentation">
		<div
			class="modal {size === 'sm' ? 'modal-sm' : ''}"
			role="dialog"
			aria-modal="true"
			aria-labelledby="modal-title"
		>
			<header class="modal-header">
				<h2 id="modal-title">{title}</h2>
				<button type="button" class="modal-close" aria-label="Close" onclick={() => void close()}>
					×
				</button>
			</header>
			<div class="modal-body">
				{#if children}
					{@render children()}
				{/if}
			</div>
			{#if footer}
				<footer class="modal-footer">
					{@render footer()}
				</footer>
			{/if}
		</div>
	</div>
{/if}
