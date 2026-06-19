<script lang="ts">
	import { formatFileSize, isImageAttachment, type AttachmentItem } from '$lib/attachments';

	let {
		item,
		disabled = false,
		onRemove
	}: {
		item: AttachmentItem;
		disabled?: boolean;
		onRemove?: (id: string) => void;
	} = $props();
</script>

<article class="preview-card">
	<div class="preview-media">
		{#if isImageAttachment(item)}
			<img src={item.url} alt={item.name} />
		{:else if item.kind === 'link'}
			<span class="preview-icon" aria-hidden="true">🔗</span>
		{:else}
			<span class="preview-icon" aria-hidden="true">📄</span>
		{/if}
	</div>

	<div class="preview-body">
		<p class="preview-name">{item.name}</p>
		<p class="preview-meta">
			{#if item.kind === 'link'}
				<a href={item.url} target="_blank" rel="noopener noreferrer">{item.url}</a>
			{:else}
				{item.mimeType ?? 'File'}{#if item.size}, {formatFileSize(item.size)}{/if}
			{/if}
		</p>
	</div>

	{#if !disabled && onRemove}
		<button type="button" class="preview-remove" aria-label="Remove {item.name}" onclick={() => onRemove(item.id)}>
			×
		</button>
	{/if}
</article>

<style>
	.preview-card {
		display: grid;
		grid-template-columns: auto 1fr auto;
		gap: 0.75rem;
		align-items: center;
		padding: 0.75rem;
		border: 1px solid var(--color-border);
		background: var(--color-surface);
		border-radius: var(--radius-lg);
	}

	.preview-media {
		width: 3rem;
		height: 3rem;
		display: grid;
		place-items: center;
		overflow: hidden;
		background: var(--color-surface-muted);
	}

	.preview-media img {
		width: 100%;
		height: 100%;
		object-fit: cover;
	}

	.preview-icon {
		font-size: 1.25rem;
	}

	.preview-name {
		font-size: 0.875rem;
		font-weight: 600;
		word-break: break-word;
	}

	.preview-meta {
		margin-top: 0.15rem;
		font-size: 0.75rem;
		color: var(--color-muted);
		word-break: break-all;
	}

	.preview-meta a {
		color: inherit;
	}

	.preview-remove {
		border: 0;
		background: transparent;
		font-size: 1.25rem;
		line-height: 1;
		cursor: pointer;
		color: var(--color-muted);
		padding: 0.25rem;
	}

	.preview-remove:hover {
		color: var(--color-ink);
	}
</style>
