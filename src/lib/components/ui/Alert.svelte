<script lang="ts">
	let {
		variant = 'info',
		title = '',
		message = '',
		subtitle = '',
		hideCloseButton = true,
		onclose
	}: {
		variant?: 'success' | 'error' | 'warning' | 'info';
		title?: string;
		message?: string;
		subtitle?: string;
		hideCloseButton?: boolean;
		onclose?: () => void;
	} = $props();

	const text = $derived(subtitle || message);
</script>

<div class="alert alert-{variant}" role="alert">
	<div class="alert-content">
		{#if title}
			<p class="alert-title">{title}</p>
		{/if}
		{#if text}
			<p class="alert-message">{text}</p>
		{/if}
	</div>
	{#if !hideCloseButton && onclose}
		<button type="button" class="alert-close" aria-label="Dismiss" onclick={onclose}>×</button>
	{/if}
</div>

<style>
	.alert {
		display: flex;
		align-items: flex-start;
		justify-content: space-between;
		gap: 0.75rem;
	}

	.alert-content {
		flex: 1;
		min-width: 0;
	}

	.alert-close {
		flex-shrink: 0;
		border: 0;
		background: transparent;
		font-size: 1.25rem;
		line-height: 1;
		cursor: pointer;
		opacity: 0.7;
		padding: 0;
	}

	.alert-close:hover {
		opacity: 1;
	}
</style>
