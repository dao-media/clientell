<script lang="ts">
	import { attachmentDisplayKind, type AttachmentItem } from '$lib/attachments';
	import FileText from '@lucide/svelte/icons/file-text';
	import Image from '@lucide/svelte/icons/image';
	import Link2 from '@lucide/svelte/icons/link-2';
	import Video from '@lucide/svelte/icons/video';

	let { item }: { item: AttachmentItem } = $props();

	const kind = $derived(attachmentDisplayKind(item));
</script>

<a class="attachment-pill" href={item.url} target="_blank" rel="noopener noreferrer">
	{#if kind === 'image'}
		<Image size={14} aria-hidden="true" />
	{:else if kind === 'video'}
		<Video size={14} aria-hidden="true" />
	{:else if kind === 'link'}
		<Link2 size={14} aria-hidden="true" />
	{:else}
		<FileText size={14} aria-hidden="true" />
	{/if}
	<span>{item.name}</span>
</a>

<style>
	.attachment-pill {
		display: inline-flex;
		align-items: center;
		gap: 0.35rem;
		max-width: 100%;
		padding: 0.35rem 0.75rem;
		border: 1px solid var(--color-border);
		border-radius: 999px;
		background: var(--color-surface-muted);
		color: var(--color-accent);
		font-size: 0.8125rem;
		font-weight: 500;
		text-decoration: none;
		transition:
			background 0.15s ease,
			border-color 0.15s ease;
	}

	.attachment-pill:hover {
		background: var(--color-surface-hover);
		border-color: var(--color-accent);
	}

	.attachment-pill span {
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}
</style>
