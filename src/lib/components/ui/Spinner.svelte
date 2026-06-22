<script lang="ts">
	let {
		size = 'default',
		label = 'Loading'
	}: {
		size?: 'default' | 'small';
		label?: string;
	} = $props();
</script>

<span class="spinner" class:spinner-sm={size === 'small'} role="status" aria-label={label}></span>

<style>
	.spinner {
		display: inline-block;
		width: 1.125rem;
		height: 1.125rem;
		border: 2px solid var(--color-border);
		border-top-color: var(--color-accent);
		border-radius: 50%;
		animation: spinner-rotate 0.65s linear infinite;
		flex-shrink: 0;
	}

	.spinner-sm {
		width: 0.875rem;
		height: 0.875rem;
		border-width: 1.5px;
	}

	@keyframes spinner-rotate {
		to {
			transform: rotate(360deg);
		}
	}
</style>
