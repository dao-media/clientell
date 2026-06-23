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
	import X from '@lucide/svelte/icons/x';

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
		<button
			type="button"
			class="preview-remove"
			aria-label="Remove {item.name}"
			onclick={() => onRemove(item.id)}
		>
			<X size={12} strokeWidth={2.5} aria-hidden="true" />
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
		overflow: visible;
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
		line-height: 1;
		cursor: pointer;
		color: var(--color-muted);
		padding: 0.15rem 0.35rem;
		border-radius: 999px;
	}

	.compact .preview-remove {
		position: absolute;
		top: 0.2rem;
		right: 0.2rem;
		z-index: 2;
		width: 1.375rem;
		height: 1.375rem;
		display: grid;
		place-items: center;
		padding: 0;
		border: 0;
		border-radius: 999px;
		background: rgb(15 23 42 / 0.72);
		color: #fff;
		box-shadow: 0 1px 3px rgb(0 0 0 / 0.2);
	}

	.compact .preview-remove:hover {
		background: rgb(15 23 42 / 0.9);
		color: #fff;
	}

	.preview-remove:hover {
		color: var(--color-ink);
	}
</style>
