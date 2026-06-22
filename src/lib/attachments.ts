export type AttachmentItem = {
	id: string;
	kind: 'link' | 'file';
	url: string;
	name: string;
	mimeType?: string;
	size?: number;
};

export function attachmentAnswerKey(questionId: string): string {
	return `${questionId}__attachments`;
}

export function parseAttachments(value: unknown): AttachmentItem[] {
	if (!Array.isArray(value)) return [];

	return value
		.filter(
			(item): item is AttachmentItem =>
				!!item &&
				typeof item === 'object' &&
				typeof (item as AttachmentItem).id === 'string' &&
				((item as AttachmentItem).kind === 'link' || (item as AttachmentItem).kind === 'file') &&
				typeof (item as AttachmentItem).url === 'string' &&
				typeof (item as AttachmentItem).name === 'string'
		)
		.map((item) => ({
			id: item.id,
			kind: item.kind,
			url: item.url,
			name: item.name,
			mimeType: item.mimeType,
			size: item.size
		}));
}

export function parseAttachmentsField(raw: FormDataEntryValue | null): AttachmentItem[] {
	if (typeof raw !== 'string' || !raw.trim()) return [];
	try {
		return parseAttachments(JSON.parse(raw));
	} catch {
		return [];
	}
}

export function isValidHttpUrl(value: string): boolean {
	try {
		const url = new URL(value);
		return url.protocol === 'http:' || url.protocol === 'https:';
	} catch {
		return false;
	}
}

export function linkDisplayName(url: string): string {
	try {
		return new URL(url).hostname.replace(/^www\./, '');
	} catch {
		return url;
	}
}

export function formatFileSize(bytes?: number): string {
	if (!bytes) return '';
	if (bytes < 1024) return `${bytes} B`;
	if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
	return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function isImageAttachment(item: AttachmentItem): boolean {
	return item.kind === 'file' && !!item.mimeType?.startsWith('image/');
}

export function isVideoFileAttachment(item: AttachmentItem): boolean {
	return item.kind === 'file' && !!item.mimeType?.startsWith('video/');
}

export function isVideoUrl(value: string): boolean {
	try {
		const url = new URL(value);
		const host = url.hostname.replace(/^www\./, '');
		if (['youtube.com', 'youtu.be', 'vimeo.com', 'loom.com'].includes(host)) return true;
		return /\.(mp4|webm|mov|m4v|ogv)(\?|$)/i.test(url.pathname);
	} catch {
		return false;
	}
}

export type AttachmentDisplayKind = 'image' | 'video' | 'link' | 'file';

export function attachmentDisplayKind(item: AttachmentItem): AttachmentDisplayKind {
	if (item.kind === 'link') {
		return isVideoUrl(item.url) ? 'video' : 'link';
	}
	if (isImageAttachment(item)) return 'image';
	if (isVideoFileAttachment(item)) return 'video';
	return 'file';
}

export function isVideoAttachment(item: AttachmentItem): boolean {
	return attachmentDisplayKind(item) === 'video';
}
