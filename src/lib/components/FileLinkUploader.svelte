<script lang="ts">
	import AttachmentPreviewCard from '$lib/components/AttachmentPreviewCard.svelte';
	import {
		attachmentAnswerKey,
		isValidHttpUrl,
		linkDisplayName,
		type AttachmentItem
	} from '$lib/attachments';

	let {
		questionId,
		attachments = $bindable<AttachmentItem[]>([]),
		disabled = false,
		preview = false,
		uploadUrl = '/api/uploads'
	}: {
		questionId: string;
		attachments?: AttachmentItem[];
		disabled?: boolean;
		preview?: boolean;
		uploadUrl?: string;
	} = $props();

	let linkInput = $state('');
	let linkError = $state('');
	let dragging = $state(false);
	let uploading = $state(false);
	let uploadError = $state('');

	const fieldName = $derived(attachmentAnswerKey(questionId));

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
	}

	async function uploadFiles(fileList: FileList | File[]) {
		if (disabled || preview) return;
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
		const text = event.clipboardData?.getData('text')?.trim();
		if (text && isValidHttpUrl(text)) {
			event.preventDefault();
			linkInput = text;
			addLink();
		}
	}
</script>

<div class="uploader" class:preview>
	<input type="hidden" name={fieldName} value={JSON.stringify(attachments)} />

	<div
		class="dropzone"
		class:dragging
		class:disabled={disabled || preview}
		ondragover={(event) => {
			event.preventDefault();
			if (!disabled && !preview) dragging = true;
		}}
		ondragleave={() => {
			dragging = false;
		}}
		ondrop={onDrop}
	>
		<p class="dropzone-title">
			{#if preview}
				File and link uploader preview
			{:else if uploading}
				Uploading…
			{:else}
				Drag and drop files here
			{/if}
		</p>
		<p class="dropzone-help">
			{#if preview}
				Clients can paste links or upload files when this question is enabled.
			{:else}
				Or choose files below. You can also paste a link into the field.
			{/if}
		</p>

		{#if !disabled && !preview}
			<label class="file-button">
				Choose files
				<input type="file" multiple onchange={onFileInput} />
			</label>
		{/if}
	</div>

	<div class="link-row">
		<input
			class="link-input"
			type="url"
			placeholder="Paste or type a link (https://…)"
			bind:value={linkInput}
			onpaste={onPaste}
			onkeydown={(event) => {
				if (event.key === 'Enter') {
					event.preventDefault();
					addLink();
				}
			}}
			{disabled}
		/>
		<button type="button" class="link-add" onclick={addLink} disabled={disabled || preview}>Add link</button>
	</div>

	{#if linkError}
		<p class="uploader-error">{linkError}</p>
	{/if}
	{#if uploadError}
		<p class="uploader-error">{uploadError}</p>
	{/if}

	{#if attachments.length > 0}
		<div class="preview-grid">
			{#each attachments as item (item.id)}
				<AttachmentPreviewCard
					{item}
					disabled={disabled || preview}
					onRemove={disabled || preview ? undefined : removeAttachment}
				/>
			{/each}
		</div>
	{/if}
</div>

<style>
	.uploader {
		display: grid;
		gap: 0.75rem;
		margin-top: 0.75rem;
	}

	.uploader.preview .dropzone {
		border-style: dashed;
		opacity: 0.95;
	}

	.dropzone {
		padding: 1rem;
		border: 1px dashed var(--color-border);
		background: var(--color-surface-muted);
		text-align: center;
		border-radius: var(--radius-lg);
	}

	.dropzone.dragging {
		border-color: var(--color-accent);
		background: var(--color-surface-hover);
	}

	.dropzone.disabled {
		opacity: 0.85;
	}

	.dropzone-title {
		font-size: 0.875rem;
		font-weight: 600;
	}

	.dropzone-help {
		margin-top: 0.25rem;
		font-size: 0.75rem;
		color: var(--color-muted);
	}

	.file-button {
		display: inline-flex;
		margin-top: 0.75rem;
		padding: 0.45rem 0.85rem;
		border: 1px solid var(--color-accent);
		color: var(--color-accent);
		font-size: 0.875rem;
		cursor: pointer;
		border-radius: var(--radius);
	}

	.file-button input {
		display: none;
	}

	.link-row {
		display: grid;
		grid-template-columns: 1fr auto;
		gap: 0.5rem;
	}

	.link-input {
		width: 100%;
		padding: 0.65rem 0.75rem;
		border: 1px solid var(--color-border);
		background: var(--color-surface);
		font: inherit;
		border-radius: var(--radius);
	}

	.link-add {
		padding: 0.65rem 0.85rem;
		border: 0;
		background: var(--color-accent);
		color: #fff;
		cursor: pointer;
		font: inherit;
		border-radius: var(--radius);
	}

	.link-add:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}

	.preview-grid {
		display: grid;
		gap: 0.75rem;
	}

	.uploader-error {
		font-size: 0.75rem;
		color: var(--color-error);
	}
</style>
