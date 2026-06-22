<script lang="ts">
	import {
		attachmentDisplayKind,
		formatFileSize,
		isImageAttachment,
		type AttachmentItem
	} from '$lib/attachments';
	import FileText from '@lucide/svelte/icons/file-text';
	import Link2 from '@lucide/svelte/icons/link-2';
	import Video from '@lucide/svelte/icons/video';

	let {
		item,
		compact = false,
		disabled = false,
		onRemove
	}: {
		item: AttachmentItem;
		compact?: boolean;
		disabled?: boolean;
		onRemove?: (id: string) => void;
	} = $props();

	const displayKind = $derived(attachmentDisplayKind(item));
</script>

<article class="preview-card" class:compact>
	<div class="preview-media">
		{#if isImageAttachment(item)}
			<img src={item.url} alt={item.name} />
		{:else if displayKind === 'video'}
			<span class="preview-icon preview-icon--video" aria-hidden="true">
				<Video size={compact ? 20 : 24} />
			</span>
		{:else if displayKind === 'link'}
			<span class="preview-icon" aria-hidden="true">
				<Link2 size={compact ? 20 : 24} />
			</span>
		{:else}
			<span class="preview-icon" aria-hidden="true">
				<FileText size={compact ? 20 : 24} />
			</span>
		{/if}
	</div>

	<div class="preview-body">
		<p class="preview-name">{item.name}</p>
		{#if !compact}
			<p class="preview-meta">
				{#if item.kind === 'link'}
					<a href={item.url} target="_blank" rel="noopener noreferrer">{item.url}</a>
				{:else}
					{item.mimeType ?? 'File'}{#if item.size}, {formatFileSize(item.size)}{/if}
				{/if}
			</p>
		{/if}
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

	.preview-card.compact {
		position: relative;
		display: flex;
		flex-direction: column;
		align-items: stretch;
		gap: 0.35rem;
		width: 5.5rem;
		padding: 0.35rem;
		border-radius: var(--radius);
	}

	.preview-media {
		width: 3rem;
		height: 3rem;
		display: grid;
		place-items: center;
		overflow: hidden;
		background: var(--color-surface-muted);
		border-radius: calc(var(--radius) - 2px);
	}

	.compact .preview-media {
		width: 100%;
		aspect-ratio: 1;
		height: auto;
	}

	.preview-media img {
		width: 100%;
		height: 100%;
		object-fit: cover;
	}

	.preview-icon {
		display: grid;
		place-items: center;
		color: var(--color-muted);
	}

	.preview-icon--video {
		color: var(--color-accent);
	}

	.preview-body {
		min-width: 0;
	}

	.compact .preview-body {
		text-align: center;
	}

	.preview-name {
		font-size: 0.875rem;
		font-weight: 600;
		word-break: break-word;
	}

	.compact .preview-name {
		font-size: 0.6875rem;
		font-weight: 500;
		line-height: 1.2;
		display: -webkit-box;
		-webkit-box-orient: vertical;
		-webkit-line-clamp: 2;
		line-clamp: 2;
		overflow: hidden;
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
		background: var(--color-surface);
		font-size: 1rem;
		line-height: 1;
		cursor: pointer;
		color: var(--color-muted);
		padding: 0.15rem 0.35rem;
		border-radius: 999px;
	}

	.compact .preview-remove {
		position: absolute;
		top: 0.15rem;
		right: 0.15rem;
		width: 1.25rem;
		height: 1.25rem;
		display: grid;
		place-items: center;
		padding: 0;
		border: 1px solid var(--color-border);
		box-shadow: 0 1px 2px rgb(0 0 0 / 0.08);
	}

	.preview-remove:hover {
		color: var(--color-ink);
	}
</style>
