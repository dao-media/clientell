import { PDFDocument, StandardFonts, rgb, type PDFFont, type PDFPage } from 'pdf-lib';
import { formatAnswer } from '$lib/utils';
import { attachmentAnswerKey, parseAttachments } from '$lib/attachments';

export type BriefPdfSection = {
	company: string;
	contactName: string;
	email: string;
	phone: string | null;
	briefTitle: string;
	status: string;
	progress: number;
	createdAt: Date;
	submittedAt: Date | null;
	questions: Array<{ id: string; label: string; helpText: string | null }>;
	answers: Record<string, unknown>;
};

const PAGE_WIDTH = 612;
const PAGE_HEIGHT = 792;
const MARGIN = 50;
const CONTENT_WIDTH = PAGE_WIDTH - MARGIN * 2;

function wrapText(text: string, font: PDFFont, size: number, maxWidth: number): string[] {
	const words = text.replace(/\s+/g, ' ').trim().split(' ');
	if (!words.length || words[0] === '') return [''];

	const lines: string[] = [];
	let current = words[0];

	for (const word of words.slice(1)) {
		const next = `${current} ${word}`;
		if (font.widthOfTextAtSize(next, size) <= maxWidth) {
			current = next;
		} else {
			lines.push(current);
			current = word;
		}
	}

	lines.push(current);
	return lines;
}

function ensureSpace(page: PDFPage, y: number, needed: number, doc: PDFDocument): { page: PDFPage; y: number } {
	if (y - needed >= MARGIN) return { page, y };
	const nextPage = doc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
	return { page: nextPage, y: PAGE_HEIGHT - MARGIN };
}

function drawLines(
	page: PDFPage,
	font: PDFFont,
	size: number,
	x: number,
	y: number,
	lines: string[],
	color = rgb(0.1, 0.1, 0.1)
): number {
	for (const line of lines) {
		page.drawText(line, { x, y, size, font, color });
		y -= size + 4;
	}
	return y;
}

function drawSection(
	doc: PDFDocument,
	page: PDFPage,
	font: PDFFont,
	bold: PDFFont,
	section: BriefPdfSection,
	y: number
): { page: PDFPage; y: number } {
	let currentPage = page;
	let cursorY = y;

	const headerLines = wrapText('ClienTell', bold, 22, CONTENT_WIDTH);
	for (const line of headerLines) {
		({ page: currentPage, y: cursorY } = ensureSpace(currentPage, cursorY, 26, doc));
		currentPage.drawText(line, {
			x: MARGIN,
			y: cursorY,
			size: 22,
			font: bold,
			color: rgb(0.05, 0.05, 0.05)
		});
		cursorY -= 28;
	}

	({ page: currentPage, y: cursorY } = ensureSpace(currentPage, cursorY, 18, doc));
	currentPage.drawLine({
		start: { x: MARGIN, y: cursorY },
		end: { x: PAGE_WIDTH - MARGIN, y: cursorY },
		thickness: 1,
		color: rgb(0.75, 0.75, 0.75)
	});
	cursorY -= 24;

	const meta = [
		`Company: ${section.company}`,
		`Point of contact: ${section.contactName}`,
		`Email: ${section.email}`,
		section.phone ? `Phone: ${section.phone}` : null,
		`Brief: ${section.briefTitle}`,
		`Status: ${section.status}`,
		`Progress: ${section.progress}%`,
		`Created: ${section.createdAt.toLocaleDateString()}`,
		section.submittedAt ? `Submitted: ${section.submittedAt.toLocaleDateString()}` : null
	].filter(Boolean) as string[];

	for (const line of meta) {
		const wrapped = wrapText(line, font, 11, CONTENT_WIDTH);
		({ page: currentPage, y: cursorY } = ensureSpace(currentPage, cursorY, wrapped.length * 15, doc));
		cursorY = drawLines(currentPage, font, 11, MARGIN, cursorY, wrapped, rgb(0.25, 0.25, 0.25));
		cursorY -= 8;
	}

	cursorY -= 8;

	for (const question of section.questions) {
		const resolvedAnswer = formatAnswer(section.answers[question.id]);

		const labelLines = wrapText(question.label, bold, 12, CONTENT_WIDTH);
		({ page: currentPage, y: cursorY } = ensureSpace(
			currentPage,
			cursorY,
			labelLines.length * 16 + 40,
			doc
		));
		cursorY = drawLines(currentPage, bold, 12, MARGIN, cursorY, labelLines);

		if (question.helpText) {
			const helpLines = wrapText(question.helpText, font, 10, CONTENT_WIDTH);
			cursorY = drawLines(currentPage, font, 10, MARGIN, cursorY, helpLines, rgb(0.45, 0.45, 0.45));
		}

		const answerLines = wrapText(resolvedAnswer, font, 11, CONTENT_WIDTH);
		cursorY = drawLines(currentPage, font, 11, MARGIN, cursorY, answerLines);

		const attachments = parseAttachments(section.answers[attachmentAnswerKey(question.id)]);
		for (const attachment of attachments) {
			const attachmentLine =
				attachment.kind === 'link'
					? `Attachment: ${attachment.name} (${attachment.url})`
					: `Attachment: ${attachment.name}${attachment.size ? ` (${attachment.size} bytes)` : ''} — ${attachment.url}`;
			const attachmentLines = wrapText(attachmentLine, font, 10, CONTENT_WIDTH);
			({ page: currentPage, y: cursorY } = ensureSpace(
				currentPage,
				cursorY,
				attachmentLines.length * 14,
				doc
			));
			cursorY = drawLines(currentPage, font, 10, MARGIN, cursorY, attachmentLines, rgb(0.35, 0.35, 0.35));
		}

		cursorY -= 14;
	}

	return { page: currentPage, y: cursorY - 24 };
}

export async function buildBriefPdf(sections: BriefPdfSection[]): Promise<Uint8Array> {
	const doc = await PDFDocument.create();
	const font = await doc.embedFont(StandardFonts.Helvetica);
	const bold = await doc.embedFont(StandardFonts.HelveticaBold);

	let page = doc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
	let y = PAGE_HEIGHT - MARGIN;

	for (const [index, section] of sections.entries()) {
		if (index > 0) {
			page = doc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
			y = PAGE_HEIGHT - MARGIN;
		}

		const result = drawSection(doc, page, font, bold, section, y);
		page = result.page;
		y = result.y;
	}

	return doc.save();
}
