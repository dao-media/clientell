<script lang="ts">
	import type { Snippet } from 'svelte';

	let {
		open = $bindable(false),
		title = '',
		size = 'default',
		children,
		footer,
		onclose
	}: {
		open?: boolean;
		title?: string;
		size?: 'default' | 'sm';
		children?: Snippet;
		footer?: Snippet;
		onclose?: () => void;
	} = $props();

	function close() {
		open = false;
		onclose?.();
	}

	function onBackdropClick(event: MouseEvent) {
		if (event.target === event.currentTarget) close();
	}

	$effect(() => {
		if (!open) return;

		function onKeydown(event: KeyboardEvent) {
			if (event.key === 'Escape') close();
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
				<button type="button" class="modal-close" aria-label="Close" onclick={close}>×</button>
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
