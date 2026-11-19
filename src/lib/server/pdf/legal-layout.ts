import { PDFDocument, StandardFonts, rgb, type PDFFont, type PDFPage } from 'pdf-lib';

const PAGE_WIDTH = 612;
const PAGE_HEIGHT = 792;
const MARGIN = 54;
const CONTENT_WIDTH = PAGE_WIDTH - MARGIN * 2;

export type LegalLayout = {
	doc: PDFDocument;
	page: PDFPage;
	y: number;
	font: PDFFont;
	bold: PDFFont;
};

export async function createLegalLayout(): Promise<LegalLayout> {
	const doc = await PDFDocument.create();
	const font = await doc.embedFont(StandardFonts.TimesRoman);
	const bold = await doc.embedFont(StandardFonts.TimesRomanBold);
	const page = doc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
	return { doc, page, y: PAGE_HEIGHT - MARGIN, font, bold };
}

function wrapText(text: string, font: PDFFont, size: number, maxWidth: number): string[] {
	const paragraphs = text.replace(/\r\n/g, '\n').split('\n');
	const lines: string[] = [];

	for (const paragraph of paragraphs) {
		const words = paragraph.trim() === '' ? [''] : paragraph.split(/\s+/);
		let current = words[0] ?? '';
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
	}

	return lines;
}

function ensureSpace(layout: LegalLayout, needed: number) {
	if (layout.y - needed >= MARGIN) return;
	layout.page = layout.doc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
	layout.y = PAGE_HEIGHT - MARGIN;
}

export function addDocumentBreak(layout: LegalLayout) {
	layout.page = layout.doc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
	layout.y = PAGE_HEIGHT - MARGIN;
}

export function drawTitle(layout: LegalLayout, title: string) {
	const size = 16;
	const lines = wrapText(title, layout.bold, size, CONTENT_WIDTH);
	ensureSpace(layout, lines.length * (size + 4) + 16);
	for (const line of lines) {
		layout.page.drawText(line, {
			x: MARGIN,
			y: layout.y,
			size,
			font: layout.bold,
			color: rgb(0.08, 0.08, 0.08)
		});
		layout.y -= size + 4;
	}
	layout.y -= 12;
}

export function drawHeading(layout: LegalLayout, heading: string) {
	const size = 12;
	const lines = wrapText(heading, layout.bold, size, CONTENT_WIDTH);
	ensureSpace(layout, lines.length * (size + 4) + 18);
	layout.y -= 8;
	for (const line of lines) {
		layout.page.drawText(line, {
			x: MARGIN,
			y: layout.y,
			size,
			font: layout.bold,
			color: rgb(0.1, 0.1, 0.1)
		});
		layout.y -= size + 3;
	}
	layout.y -= 6;
}

export function drawBody(layout: LegalLayout, body: string) {
	const size = 10.5;
	const lineHeight = size + 3.5;
	const lines = wrapText(body, layout.font, size, CONTENT_WIDTH);

	for (const line of lines) {
		ensureSpace(layout, lineHeight);
		if (line) {
			layout.page.drawText(line, {
				x: MARGIN,
				y: layout.y,
				size,
				font: layout.font,
				color: rgb(0.12, 0.12, 0.12)
			});
		}
		layout.y -= lineHeight;
	}
	layout.y -= 6;
}
