<script lang="ts">
	import AttachmentPreviewCard from '$lib/components/AttachmentPreviewCard.svelte';
	import {
		attachmentAnswerKey,
		isValidHttpUrl,
		linkDisplayName,
		type AttachmentItem
	} from '$lib/attachments';
	import FileText from '@lucide/svelte/icons/file-text';
	import Image from '@lucide/svelte/icons/image';
	import Link2 from '@lucide/svelte/icons/link-2';
	import Video from '@lucide/svelte/icons/video';

	let {
		questionId,
		attachments = $bindable<AttachmentItem[]>([]),
		disabled = false,
		preview = false,
		uploadUrl = '/api/uploads',
		layout = 'stacked'
	}: {
		questionId: string;
		attachments?: AttachmentItem[];
		disabled?: boolean;
		preview?: boolean;
		uploadUrl?: string;
		layout?: 'stacked' | 'split';
	} = $props();

	let linkInput = $state('');
	let linkError = $state('');
	let showLinkInput = $state(false);
	let dragging = $state(false);
	let uploading = $state(false);
	let uploadError = $state('');

	let imageInput = $state<HTMLInputElement | null>(null);
	let videoInput = $state<HTMLInputElement | null>(null);
	let fileInput = $state<HTMLInputElement | null>(null);

	const fieldName = $derived(attachmentAnswerKey(questionId));
	const interactive = $derived(!disabled && !preview);

	function removeAttachment(id: string) {
		attachments = attachments.filter((item) => item.id !== id);
	}

	function addLink() {
		linkError = '';
		const value = linkInput.trim();
		if (!value) return;
		if (!isValidHttpUrl(value)) {
			linkError = 'Enter a valid http(s) link.';
			return;
		}

		attachments = [
			...attachments,
			{
				id: crypto.randomUUID(),
				kind: 'link',
				url: value,
				name: linkDisplayName(value)
			}
		];
		linkInput = '';
		showLinkInput = false;
	}

	async function uploadFiles(fileList: FileList | File[]) {
		if (!interactive) return;
		uploadError = '';
		uploading = true;

		try {
			const uploaded: AttachmentItem[] = [];
			for (const file of fileList) {
				const body = new FormData();
				body.set('file', file);
				const response = await fetch(uploadUrl, { method: 'POST', body });
				if (!response.ok) {
					const message = await response.text();
					throw new Error(message || 'Upload failed.');
				}
				uploaded.push(await response.json());
			}
			attachments = [...attachments, ...uploaded];
		} catch (error) {
			uploadError = error instanceof Error ? error.message : 'Upload failed.';
		} finally {
			uploading = false;
		}
	}

	function onDrop(event: DragEvent) {
		event.preventDefault();
		dragging = false;
		if (event.dataTransfer?.files?.length) {
			void uploadFiles(event.dataTransfer.files);
		}
	}

	function onFileInput(event: Event) {
		const input = event.currentTarget as HTMLInputElement;
		if (input.files?.length) {
			void uploadFiles(input.files);
			input.value = '';
		}
	}

	function onPaste(event: ClipboardEvent) {
		if (!interactive) return;
		const text = event.clipboardData?.getData('text')?.trim();
		if (text && isValidHttpUrl(text)) {
			event.preventDefault();
			linkInput = text;
			showLinkInput = true;
			addLink();
		}
	}

	function toggleLinkInput() {
		if (!interactive) return;
		showLinkInput = !showLinkInput;
		linkError = '';
		if (!showLinkInput) linkInput = '';
	}
</script>

<div class="uploader" class:preview class:uploader-split={layout === 'split'}>
	<input type="hidden" name={fieldName} value={JSON.stringify(attachments)} />

	<div
		class="media-bin"
		class:dragging
		class:disabled={!interactive}
		role="region"
		aria-label="Attachments"
		tabindex={interactive ? 0 : -1}
		onpaste={onPaste}
		ondragover={(event) => {
			event.preventDefault();
			if (interactive) dragging = true;
		}}
		ondragleave={() => {
			dragging = false;
		}}
		ondrop={onDrop}
	>
		<div class="media-toolbar">
			<button
				type="button"
				class="media-btn"
				title="Add image"
				disabled={!interactive || uploading}
				onclick={() => imageInput?.click()}
			>
				<Image size={16} aria-hidden="true" />
				<span>Image</span>
			</button>
			<button
				type="button"
				class="media-btn"
				class:active={showLinkInput}
				title="Add link"
				disabled={!interactive}
				onclick={toggleLinkInput}
			>
				<Link2 size={16} aria-hidden="true" />
				<span>Link</span>
			</button>
			<button
				type="button"
				class="media-btn"
				title="Add video"
				disabled={!interactive || uploading}
				onclick={() => videoInput?.click()}
			>
				<Video size={16} aria-hidden="true" />
				<span>Video</span>
			</button>
			<button
				type="button"
				class="media-btn"
				title="Add file"
				disabled={!interactive || uploading}
				onclick={() => fileInput?.click()}
			>
				<FileText size={16} aria-hidden="true" />
				<span>File</span>
			</button>
		</div>

		{#if showLinkInput && interactive}
			<div class="link-row">
				<input
					class="link-input"
					type="url"
					placeholder="Paste or type a link (https://…)"
					bind:value={linkInput}
					onkeydown={(event) => {
						if (event.key === 'Enter') {
							event.preventDefault();
							addLink();
						}
						if (event.key === 'Escape') {
							event.preventDefault();
							showLinkInput = false;
							linkInput = '';
							linkError = '';
						}
					}}
				/>
				<button type="button" class="link-add" onclick={addLink}>Add</button>
			</div>
		{/if}

		<div class="media-body">
			{#if attachments.length > 0}
				<div class="preview-grid">
					{#each attachments as item (item.id)}
						<AttachmentPreviewCard
							{item}
							compact
							disabled={!interactive}
							onRemove={interactive ? removeAttachment : undefined}
						/>
					{/each}
				</div>
			{:else}
				<p class="bin-empty">
					{#if preview}
						Clients add images, links, videos, and files here.
					{:else if uploading}
						Uploading…
					{:else if dragging}
						Drop to add
					{:else}
						Drop files here or use the buttons above
					{/if}
				</p>
			{/if}
		</div>
	</div>

	{#if linkError}
		<p class="uploader-error">{linkError}</p>
	{/if}
	{#if uploadError}
		<p class="uploader-error">{uploadError}</p>
	{/if}

	{#if interactive}
		<input bind:this={imageInput} type="file" accept="image/*" multiple hidden onchange={onFileInput} />
		<input bind:this={videoInput} type="file" accept="video/*" multiple hidden onchange={onFileInput} />
		<input bind:this={fileInput} type="file" multiple hidden onchange={onFileInput} />
	{/if}
</div>

<style>
	.uploader {
		display: grid;
		gap: 0.5rem;
		margin-top: 0.75rem;
	}

	.uploader.uploader-split {
		margin-top: 0;
		display: flex;
		flex-direction: column;
		align-self: stretch;
		min-height: 100%;
		height: auto;
	}

	.media-bin {
		display: flex;
		flex-direction: column;
		aspect-ratio: 1;
		max-width: 28rem;
		border: 1px solid var(--color-border);
		border-radius: var(--radius-lg);
		background: var(--color-surface-muted);
		overflow: hidden;
	}

	.uploader-split .media-bin {
		width: 100%;
		max-width: none;
		aspect-ratio: unset;
		min-height: 8rem;
		height: auto;
		flex: 1 1 auto;
	}

	.media-bin.dragging {
		border-color: var(--color-accent);
		background: var(--color-surface-hover);
	}

	.media-bin.disabled {
		opacity: 0.92;
	}

	.media-toolbar {
		display: flex;
		flex-wrap: wrap;
		gap: 0.35rem;
		padding: 0.5rem;
		border-bottom: 1px solid var(--color-border);
		background: var(--color-surface);
	}

	.toolbar-label {
		font-size: 0.75rem;
		color: var(--color-muted);
		padding: 0.35rem 0.25rem;
	}

	.media-btn {
		display: inline-flex;
		align-items: center;
		gap: 0.3rem;
		padding: 0.35rem 0.55rem;
		border: 1px solid var(--color-border);
		border-radius: var(--radius);
		background: var(--color-surface-muted);
		color: var(--color-ink);
		font: inherit;
		font-size: 0.75rem;
		cursor: pointer;
	}

	.media-btn:hover:not(:disabled) {
		border-color: var(--color-accent);
		color: var(--color-accent);
	}

	.media-btn.active {
		border-color: var(--color-accent);
		background: var(--color-surface-hover);
		color: var(--color-accent);
	}

	.media-btn:disabled {
		opacity: 0.55;
		cursor: not-allowed;
	}

	.link-row {
		display: grid;
		grid-template-columns: 1fr auto;
		gap: 0.35rem;
		padding: 0.5rem;
		border-bottom: 1px solid var(--color-border);
		background: var(--color-surface);
	}

	.link-input {
		width: 100%;
		min-width: 0;
		padding: 0.45rem 0.6rem;
		border: 1px solid var(--color-border);
		background: var(--color-surface);
		font: inherit;
		font-size: 0.8125rem;
		border-radius: var(--radius);
	}

	.link-add {
		padding: 0.45rem 0.65rem;
		border: 0;
		background: var(--color-accent);
		color: #fff;
		cursor: pointer;
		font: inherit;
		font-size: 0.8125rem;
		border-radius: var(--radius);
	}

	.media-body {
		flex: 1;
		min-height: 0;
		display: flex;
		align-items: center;
		justify-content: center;
		padding: 0.75rem;
		overflow: auto;
	}

	.uploader-split .media-body {
		flex: 0 0 auto;
		min-height: 4.5rem;
		overflow: visible;
		align-items: flex-start;
		justify-content: flex-start;
	}

	.uploader-split .media-body:has(.bin-empty) {
		align-items: center;
		justify-content: center;
	}

	.preview-grid {
		display: flex;
		flex-wrap: wrap;
		gap: 0.5rem;
		align-content: flex-start;
		width: 100%;
	}

	.bin-empty {
		margin: 0;
		text-align: center;
		font-size: 0.8125rem;
		color: var(--color-muted);
		padding: 0 0.5rem;
	}

	.uploader-error {
		font-size: 0.75rem;
		color: var(--color-error);
	}

	@media (max-width: 480px) {
		.media-bin {
			max-width: none;
		}

		.media-btn span {
			position: absolute;
			width: 1px;
			height: 1px;
			padding: 0;
			margin: -1px;
			overflow: hidden;
			clip: rect(0, 0, 0, 0);
			white-space: nowrap;
			border: 0;
		}

		.link-row {
			grid-template-columns: minmax(0, 1fr);
		}
	}
</style>
