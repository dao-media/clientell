import fontkit from '@pdf-lib/fontkit';
import { PDFDocument, rgb, type PDFFont, type PDFPage, type RGB } from 'pdf-lib';
import { packAssembly } from '$lib/contract/document-model';
import {
	CARD,
	HEADER,
	PAGE,
	SIGNATURE,
	TYPE,
	paginateContract,
	type CardRadius,
	type LaidCard,
	type LaidLine,
	type LaidPage,
	type LaidSignatures
} from '$lib/contract/layout';
import type { AssemblyResult, ContractSignatures } from '$lib/contract/types';
import { PDF_FONT_BYTES } from '$lib/server/pdf/fonts';

const ink = rgb(20 / 255, 20 / 255, 20 / 255);
const muted = rgb(71 / 255, 71 / 255, 71 / 255);
const black = rgb(0, 0, 0);

/** Composite translucent Figma fills over white so Preview/Acrobat match the screen. */
function overWhite(r: number, g: number, b: number, a: number): RGB {
	return rgb(r * a + (1 - a), g * a + (1 - a), b * a + (1 - a));
}

const preambleFill = overWhite(1, 149 / 255, 0, 0.3);
const sectionFill = overWhite(0, 122 / 255, 1, 0.15);
const signaturePadFill = overWhite(118 / 255, 118 / 255, 128 / 255, 0.12);
const badgeFill = overWhite(128 / 255, 128 / 255, 128 / 255, 0.1);
const badgeBorder = overWhite(128 / 255, 128 / 255, 128 / 255, 0.4);

type PackedFonts = {
	light: PDFFont;
	regular: PDFFont;
	semibold: PDFFont;
	bold: PDFFont;
	badge: PDFFont;
	badgeLight: PDFFont;
};

function yTop(top: number): number {
	return PAGE.height - top;
}

/**
 * SVG path in y-down space from the rect's top-left.
 * pdf-lib's drawSvgPath translates to (x, y) then scale(1, -1), so pass
 * x = left and y = PDF y of the TOP edge.
 */
function roundedRectSvg(w: number, h: number, r: CardRadius): string {
	const tl = Math.min(r.tl, w / 2, h / 2);
	const tr = Math.min(r.tr, w / 2, h / 2);
	const br = Math.min(r.br, w / 2, h / 2);
	const bl = Math.min(r.bl, w / 2, h / 2);
	return [
		`M ${tl} 0`,
		`L ${w - tr} 0`,
		tr ? `Q ${w} 0 ${w} ${tr}` : `L ${w} 0`,
		`L ${w} ${h - br}`,
		br ? `Q ${w} ${h} ${w - br} ${h}` : `L ${w} ${h}`,
		`L ${bl} ${h}`,
		bl ? `Q 0 ${h} 0 ${h - bl}` : `L 0 ${h}`,
		`L 0 ${tl}`,
		tl ? `Q 0 0 ${tl} 0` : `L 0 0`,
		'Z'
	].join(' ');
}

function drawRoundedRect(
	page: PDFPage,
	opts: {
		x: number;
		top: number;
		w: number;
		h: number;
		radius: CardRadius;
		color: RGB;
		borderColor?: RGB;
		borderWidth?: number;
	}
) {
	const { tl, tr, br, bl } = opts.radius;
	if (!tl && !tr && !br && !bl) {
		page.drawRectangle({
			x: opts.x,
			y: yTop(opts.top + opts.h),
			width: opts.w,
			height: opts.h,
			color: opts.color,
			borderColor: opts.borderColor,
			borderWidth: opts.borderWidth ?? 0
		});
		return;
	}

	page.drawSvgPath(roundedRectSvg(opts.w, opts.h, opts.radius), {
		x: opts.x,
		y: yTop(opts.top),
		color: opts.color,
		borderColor: opts.borderColor,
		borderWidth: opts.borderWidth ?? 0
	});
}

/** Latin subset may miss a few glyphs used in contract copy. */
function pdfText(text: string): string {
	const swap: Record<string, string> = {
		'\u2192': '->',
		'\u00D7': 'x',
		'\u2212': '-',
		'\u00A0': ' '
	};
	let out = '';
	for (const ch of text.replace(/\t/g, ' ')) {
		out += swap[ch] ?? ch;
	}
	return out;
}

function textWidth(font: PDFFont, text: string, size: number, tracking = 0): number {
	const safe = pdfText(text);
	if (!safe) return 0;
	return font.widthOfTextAtSize(safe, size) + Math.max(0, safe.length - 1) * tracking;
}

function drawTrackedText(
	page: PDFPage,
	text: string,
	opts: {
		x: number;
		y: number;
		size: number;
		font: PDFFont;
		color: RGB;
		tracking?: number;
		maxWidth?: number;
	}
): number {
	const safe = pdfText(text);
	if (!safe) return 0;
	const tracking = opts.tracking ?? 0;
	if (!tracking) {
		page.drawText(safe, {
			x: opts.x,
			y: opts.y,
			size: opts.size,
			font: opts.font,
			color: opts.color,
			maxWidth: opts.maxWidth
		});
		return opts.font.widthOfTextAtSize(safe, opts.size);
	}

	let x = opts.x;
	const limit = opts.maxWidth != null ? opts.x + opts.maxWidth : Infinity;
	for (const ch of safe) {
		const adv = opts.font.widthOfTextAtSize(ch, opts.size) + tracking;
		if (x + adv - tracking > limit && x > opts.x) break;
		page.drawText(ch, {
			x,
			y: opts.y,
			size: opts.size,
			font: opts.font,
			color: opts.color
		});
		x += adv;
	}
	return x - opts.x - tracking;
}

function drawRuns(
	page: PDFPage,
	lines: LaidLine[],
	x: number,
	top: number,
	fonts: PackedFonts,
	size: number,
	lineHeight: number,
	tracking: number,
	color = ink
) {
	let y = top;
	for (const line of lines) {
		let cursor = x;
		for (const run of line) {
			const used = run.bold ? fonts.bold : fonts.regular;
			const safe = pdfText(run.text);
			if (safe) {
				cursor += drawTrackedText(page, safe, {
					x: cursor,
					y: yTop(y + size),
					size,
					font: used,
					color,
					tracking
				});
			}
		}
		y += lineHeight;
	}
	return y;
}

function drawParagraphs(
	page: PDFPage,
	paragraphs: LaidLine[][],
	x: number,
	top: number,
	fonts: PackedFonts
) {
	let y = top;
	for (let i = 0; i < paragraphs.length; i++) {
		if (i > 0) y += TYPE.paraGap;
		y = drawRuns(page, paragraphs[i], x, y, fonts, TYPE.body, TYPE.lineBody, TYPE.trackingBody);
	}
	return y;
}

function drawHeader(page: PDFPage, layout: LaidPage, fonts: PackedFonts, top: number) {
	const full = layout.header === 'full';
	const line1Size = full ? TYPE.titleFull : TYPE.titleCondensed;
	const line2Size = full ? TYPE.subtitleFull : TYPE.subtitleCondensed;
	drawTrackedText(page, layout.line1, {
		x: PAGE.padding,
		y: yTop(top + line1Size),
		size: line1Size,
		font: full ? fonts.bold : fonts.semibold,
		color: ink,
		tracking: full ? -0.22 : -0.12
	});
	drawTrackedText(page, layout.line2, {
		x: PAGE.padding,
		y: yTop(top + (full ? 29 : 16) + line2Size),
		size: line2Size,
		font: full ? fonts.light : fonts.regular,
		color: ink,
		tracking: full ? -0.4 : -0.2
	});
	const date = pdfText(layout.lastUpdated);
	const label = 'Last Updated: ';
	const labelW = textWidth(fonts.regular, label, TYPE.updated, -0.2);
	const dateW = textWidth(fonts.semibold, date, TYPE.updated, -0.2);
	const right = PAGE.width - PAGE.padding;
	const baseline = top + (full ? HEADER.fullHeight : HEADER.condensedHeight) - 4 - TYPE.updated;
	drawTrackedText(page, label, {
		x: right - labelW - dateW,
		y: yTop(baseline + TYPE.updated),
		size: TYPE.updated,
		font: fonts.regular,
		color: ink,
		tracking: -0.2
	});
	drawTrackedText(page, date, {
		x: right - dateW,
		y: yTop(baseline + TYPE.updated),
		size: TYPE.updated,
		font: fonts.semibold,
		color: ink,
		tracking: -0.2
	});
}

function drawCard(page: PDFPage, card: LaidCard, top: number, fonts: PackedFonts) {
	const x = PAGE.padding;
	const w = PAGE.width - PAGE.padding * 2;
	drawRoundedRect(page, {
		x,
		top,
		w,
		h: card.height,
		radius: card.radius,
		color: card.kind === 'preamble' ? preambleFill : sectionFill
	});

	let y = top + CARD.padding;
	if (card.title) {
		const titleX = x + CARD.padding;
		if (card.title.number) {
			drawTrackedText(page, card.title.number, {
				x: titleX,
				y: yTop(y + TYPE.section),
				size: TYPE.section,
				font: fonts.semibold,
				color: ink,
				tracking: TYPE.trackingSection
			});
			drawTrackedText(page, card.title.text, {
				x: titleX + CARD.numberWidth + CARD.numberGap,
				y: yTop(y + TYPE.section),
				size: TYPE.section,
				font: fonts.semibold,
				color: ink,
				tracking: TYPE.trackingSection
			});
		} else {
			drawTrackedText(page, card.title.text, {
				x: titleX,
				y: yTop(y + TYPE.section),
				size: TYPE.section,
				font: fonts.semibold,
				color: ink,
				tracking: TYPE.trackingSection
			});
		}
		y += TYPE.lineSection + (card.kind === 'preamble' ? CARD.preambleTitleGap : CARD.titleGap);
	}

	if (card.columns) {
		const colW = (w - CARD.padding * 2 - CARD.preambleColGap) / 2;
		const leftX = x + CARD.padding;
		const rightX = leftX + colW + CARD.preambleColGap;
		drawParagraphs(page, card.columns.left, leftX, y, fonts);
		drawParagraphs(page, card.columns.right, rightX, y, fonts);
		return;
	}

	for (let i = 0; i < card.items.length; i++) {
		if (i > 0) y += CARD.itemGap;
		const item = card.items[i];
		const numX = x + CARD.padding + CARD.itemIndent;
		const textX = numX + CARD.numberWidth + CARD.numberGap;
		if (item.number) {
			drawTrackedText(page, item.number, {
				x: numX,
				y: yTop(y + TYPE.body),
				size: TYPE.body,
				font: fonts.semibold,
				color: black,
				tracking: TYPE.trackingBody
			});
		}
		y = drawParagraphs(page, item.paragraphs, textX, y, fonts);
		if (item.bullets.length) {
			y += TYPE.paraGap;
			for (const bullet of item.bullets) {
				drawTrackedText(page, '•', {
					x: textX,
					y: yTop(y + TYPE.body),
					size: TYPE.body,
					font: fonts.regular,
					color: ink,
					tracking: TYPE.trackingBody
				});
				y = drawRuns(
					page,
					bullet,
					textX + 12,
					y,
					fonts,
					TYPE.body,
					TYPE.lineBody,
					TYPE.trackingBody
				);
			}
		}
	}
}

async function drawSignatures(
	page: PDFPage,
	doc: PDFDocument,
	block: LaidSignatures,
	top: number,
	fonts: PackedFonts,
	signatures: ContractSignatures | null
) {
	let y = top;
	drawTrackedText(page, 'Signatures', {
		x: PAGE.padding,
		y: yTop(y + TYPE.signatureHeading),
		size: TYPE.signatureHeading,
		font: fonts.semibold,
		color: ink,
		tracking: -0.28
	});
	y += TYPE.signatureHeading + 6;
	page.drawLine({
		start: { x: PAGE.padding, y: yTop(y) },
		end: { x: PAGE.width - PAGE.padding, y: yTop(y) },
		thickness: 1,
		color: muted
	});
	y += SIGNATURE.headingGap;

	const colW = (PAGE.width - PAGE.padding * 2 - SIGNATURE.columnGap) / 2;
	const cols = [
		{
			x: PAGE.padding,
			name: block.clientName || '{{Client Name}}',
			role: ' / “The Client”',
			png: signatures?.clientPng ?? null,
			date: block.clientDate
		},
		{
			x: PAGE.padding + colW + SIGNATURE.columnGap,
			name: block.designerName,
			role: ' / “The Designer”',
			png: signatures?.designerPng ?? null,
			date: block.designerDate
		}
	];

	for (const col of cols) {
		const nameW = drawTrackedText(page, col.name, {
			x: col.x,
			y: yTop(y + TYPE.signatureLabel),
			size: TYPE.signatureLabel,
			font: fonts.semibold,
			color: muted,
			tracking: -0.2
		});
		drawTrackedText(page, col.role, {
			x: col.x + nameW,
			y: yTop(y + TYPE.signatureLabel),
			size: TYPE.signatureLabel,
			font: fonts.regular,
			color: muted,
			tracking: -0.2
		});
	}

	y += TYPE.signatureLabel + SIGNATURE.labelGap;
	for (const col of cols) {
		drawRoundedRect(page, {
			x: col.x,
			top: y,
			w: colW,
			h: SIGNATURE.padHeight,
			radius: { tl: 4, tr: 4, br: 4, bl: 4 },
			color: signaturePadFill
		});
		if (col.png?.startsWith('data:image/png')) {
			const bytes = Uint8Array.from(atob(col.png.split(',')[1] ?? ''), (c) => c.charCodeAt(0));
			const image = await doc.embedPng(bytes);
			page.drawImage(image, {
				x: col.x + 4,
				y: yTop(y + SIGNATURE.padHeight) + 4,
				width: colW - 8,
				height: SIGNATURE.padHeight - 8
			});
		}
	}

	y += SIGNATURE.padHeight + SIGNATURE.dateGap;
	for (const col of cols) {
		drawTrackedText(page, 'Date Signed:', {
			x: col.x,
			y: yTop(y + TYPE.signatureLabel),
			size: TYPE.signatureLabel,
			font: fonts.regular,
			color: black,
			tracking: -0.2
		});
		drawTrackedText(page, col.date || '—', {
			x: col.x + SIGNATURE.dateLabelWidth + 6,
			y: yTop(y + TYPE.signatureLabel),
			size: TYPE.signatureLabel,
			font: fonts.semibold,
			color: black,
			tracking: -0.2
		});
	}
}

function drawFooter(page: PDFPage, layout: LaidPage, fonts: PackedFonts) {
	const top = PAGE.height - PAGE.padding - PAGE.footerHeight;
	const labelW = drawTrackedText(page, 'On this page:', {
		x: PAGE.padding,
		y: yTop(top + TYPE.footer),
		size: TYPE.footer,
		font: fonts.regular,
		color: black,
		tracking: -0.16
	});
	drawTrackedText(page, layout.footerLabels.join(', '), {
		x: PAGE.padding + labelW + 10,
		y: yTop(top + TYPE.footer),
		size: TYPE.footer,
		font: fonts.semibold,
		color: black,
		tracking: -0.16,
		maxWidth: PAGE.width - PAGE.padding * 2 - 86 - labelW - 10
	});

	const pageStr = String(layout.page);
	const totalStr = String(layout.total);
	const numW = textWidth(fonts.badge, pageStr, TYPE.pageNum, -0.14);
	const pipeW = textWidth(fonts.badgeLight, '|', TYPE.pageNum, -0.14);
	const totalW = textWidth(fonts.badge, totalStr, TYPE.pageNum, -0.14);
	const inner = 6 + numW + 2 + pipeW + 2 + totalW + 6;
	const badgeW = Math.max(inner, 28);
	const badgeH = 12;
	const badgeX = PAGE.width - PAGE.padding - badgeW;
	const badgeTop = top + (PAGE.footerHeight - badgeH);

	drawRoundedRect(page, {
		x: badgeX,
		top: badgeTop,
		w: badgeW,
		h: badgeH,
		radius: { tl: 4, tr: 4, br: 4, bl: 4 },
		color: badgeFill,
		borderColor: badgeBorder,
		borderWidth: 0.6
	});

	let cursor = badgeX + 6;
	const badgeY = yTop(badgeTop + 2 + TYPE.pageNum);
	cursor += drawTrackedText(page, pageStr, {
		x: cursor,
		y: badgeY,
		size: TYPE.pageNum,
		font: fonts.badge,
		color: muted,
		tracking: -0.14
	});
	cursor += 2;
	cursor += drawTrackedText(page, '|', {
		x: cursor,
		y: badgeY,
		size: TYPE.pageNum,
		font: fonts.badgeLight,
		color: muted,
		tracking: -0.14
	});
	cursor += 2;
	drawTrackedText(page, totalStr, {
		x: cursor,
		y: badgeY,
		size: TYPE.pageNum,
		font: fonts.badge,
		color: muted,
		tracking: -0.14
	});
}

async function embedFonts(doc: PDFDocument): Promise<PackedFonts> {
	doc.registerFontkit(fontkit);
	const [light, regular, semibold, bold, badge, badgeLight] = await Promise.all([
		doc.embedFont(PDF_FONT_BYTES.inter300, { subset: true }),
		doc.embedFont(PDF_FONT_BYTES.inter400, { subset: true }),
		doc.embedFont(PDF_FONT_BYTES.inter600, { subset: true }),
		doc.embedFont(PDF_FONT_BYTES.inter700, { subset: true }),
		doc.embedFont(PDF_FONT_BYTES.grotesk500, { subset: true }),
		doc.embedFont(PDF_FONT_BYTES.grotesk300, { subset: true })
	]);
	return { light, regular, semibold, bold, badge, badgeLight };
}

export async function buildContractPdf(
	assembly: AssemblyResult,
	signatures: ContractSignatures | null = null
): Promise<Uint8Array> {
	const packed = packAssembly(assembly);
	const vars = assembly.variables;
	const pages = paginateContract({
		documents: packed,
		lastUpdated: vars.last_updated || '',
		clientName: vars.legal_name || '',
		designerName: vars.designer_display || '',
		clientDate: signatures?.clientSignedAt
			? new Intl.DateTimeFormat('en-US', { dateStyle: 'long' }).format(signatures.clientSignedAt)
			: '',
		designerDate: signatures?.designerSignedAt
			? new Intl.DateTimeFormat('en-US', { dateStyle: 'long' }).format(signatures.designerSignedAt)
			: ''
	});

	const doc = await PDFDocument.create();
	const fonts = await embedFonts(doc);

	for (const layout of pages) {
		const page = doc.addPage([PAGE.width, PAGE.height]);
		let top = PAGE.padding;
		drawHeader(page, layout, fonts, top);
		top +=
			(layout.header === 'full' ? HEADER.fullHeight : HEADER.condensedHeight) +
			(layout.header === 'full' ? PAGE.innerGapFull : PAGE.innerGapCondensed);

		for (const card of layout.cards) {
			drawCard(page, card, top, fonts);
			top += card.height + PAGE.cardGap;
		}

		if (layout.signatures) {
			const bodyBottom = PAGE.height - PAGE.padding - PAGE.stackGap - PAGE.footerHeight;
			const sigTop = bodyBottom - layout.signatures.height;
			await drawSignatures(page, doc, layout.signatures, sigTop, fonts, signatures);
		}

		drawFooter(page, layout, fonts);
	}

	return doc.save();
}
