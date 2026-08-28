import type { ClauseItem, DocumentSection, PackedDocument, TextRun } from './document-model';

export const PAGE = {
	width: 595,
	height: 842,
	padding: 16,
	stackGap: 12,
	innerGapFull: 8,
	innerGapCondensed: 6,
	cardGap: 4,
	footerHeight: 22
} as const;

export const TYPE = {
	titleFull: 22,
	subtitleFull: 20,
	titleCondensed: 12,
	subtitleCondensed: 10,
	updated: 10,
	section: 16,
	body: 12,
	footer: 8,
	pageNum: 7,
	signatureLabel: 10,
	signatureHeading: 14,
	lineBody: 16,
	lineSection: 21,
	paraGap: 12,
	trackingBody: -0.24,
	trackingSection: -0.32
} as const;

export const CARD = {
	padding: 16,
	radius: 8,
	titleGap: 16,
	itemGap: 12,
	numberWidth: 28,
	numberGap: 2,
	itemIndent: 30,
	preambleColGap: 18,
	preambleTitleGap: 10
} as const;

export const HEADER = {
	fullHeight: 49,
	condensedHeight: 29
} as const;

export const SIGNATURE = {
	gapAfterCards: 24,
	headingGap: 12,
	padHeight: 56,
	padRadius: 4,
	labelGap: 6,
	columnGap: 12,
	dateGap: 4,
	dateLabelWidth: 64
} as const;

export const COLOR = {
	ink: '#141414',
	black: '#000000',
	muted: '#474747',
	preamble: 'rgba(255, 149, 0, 0.3)',
	section: 'rgba(0, 122, 255, 0.15)',
	signaturePad: 'rgba(118, 118, 128, 0.12)',
	pageBadgeBg: 'rgba(128, 128, 128, 0.1)',
	pageBadgeBorder: 'rgba(128, 128, 128, 0.4)',
	rule: '#474747'
} as const;

const CHAR_WIDTH = 0.52;
const BOLD_WIDTH = 0.57;

export type LaidRun = { text: string; bold?: boolean };
export type LaidLine = LaidRun[];

export type LaidItem = {
	number: string;
	paragraphs: LaidLine[][];
	bullets: LaidLine[][];
};

export type CardRadius = { tl: number; tr: number; br: number; bl: number };

export type LaidCard = {
	kind: 'preamble' | 'section';
	sectionId: string;
	footerLabel: string;
	radius: CardRadius;
	title?: { number: string; text: string };
	columns?: { left: LaidLine[][]; right: LaidLine[][] };
	items: LaidItem[];
	height: number;
};

export type LaidSignatures = {
	clientName: string;
	designerName: string;
	clientDate: string;
	designerDate: string;
	height: number;
};

export type LaidPage = {
	header: 'full' | 'condensed';
	line1: string;
	line2: string;
	lastUpdated: string;
	cards: LaidCard[];
	signatures: LaidSignatures | null;
	footerLabels: string[];
	page: number;
	total: number;
};

export type LayoutInput = {
	documents: PackedDocument[];
	lastUpdated: string;
	clientName: string;
	designerName: string;
	clientDate: string;
	designerDate: string;
};

function measure(text: string, size: number, bold = false): number {
	if (!text) return 0;
	const base = text.length * size * (bold ? BOLD_WIDTH : CHAR_WIDTH);
	return base + Math.max(0, text.length - 1) * TYPE.trackingBody;
}

function wrapRuns(runs: TextRun[], maxWidth: number, size: number): LaidLine[] {
	type Word = { text: string; bold?: boolean; space: boolean };
	const words: Word[] = [];
	for (const run of runs) {
		const parts = run.text.split(/(\s+)/);
		for (const part of parts) {
			if (!part) continue;
			words.push({ text: part, bold: run.bold, space: /^\s+$/.test(part) });
		}
	}

	const lines: LaidLine[] = [];
	let current: LaidLine = [];
	let width = 0;

	const flush = () => {
		if (current.length) lines.push(current);
		current = [];
		width = 0;
	};

	for (const word of words) {
		const w = measure(word.text, size, word.bold);
		if (word.space && current.length === 0) continue;
		if (width + w > maxWidth && current.length > 0 && !word.space) {
			flush();
		}
		if (current.length && current[current.length - 1].bold === word.bold) {
			current[current.length - 1].text += word.text;
		} else {
			current.push({ text: word.text, bold: word.bold });
		}
		width += w;
	}
	flush();
	return lines.length ? lines : [[]];
}

function wrapParagraphs(paragraphs: TextRun[][], maxWidth: number): LaidLine[][] {
	return paragraphs.map((runs) => wrapRuns(runs, maxWidth, TYPE.body));
}

function contentWidth(): number {
	return PAGE.width - PAGE.padding * 2;
}

function itemTextWidth(): number {
	return contentWidth() - CARD.padding * 2 - CARD.itemIndent - CARD.numberWidth - CARD.numberGap;
}

function preambleColWidth(): number {
	return (contentWidth() - CARD.padding * 2 - CARD.preambleColGap) / 2;
}

function linesHeight(lines: LaidLine[][]): number {
	if (!lines.length) return 0;
	const lineCount = lines.reduce((sum, para) => sum + Math.max(para.length, 1), 0);
	return lineCount * TYPE.lineBody + Math.max(0, lines.length - 1) * TYPE.paraGap;
}

function itemHeight(item: LaidItem): number {
	const para = linesHeight(item.paragraphs);
	const bullets = item.bullets.length
		? item.bullets.reduce((sum, line) => sum + Math.max(line.length, 1), 0) * TYPE.lineBody
		: 0;
	const gap = para && bullets ? TYPE.paraGap : 0;
	return Math.max(para + gap + bullets, TYPE.lineBody);
}

function firstItemMinHeight(item: ClauseItem, width: number): number {
	const firstPara = item.paragraphs[0] ?? item.bullets[0];
	if (!firstPara) return TYPE.lineBody;
	const wrapped = wrapRuns(firstPara, width, TYPE.body);
	return TYPE.lineBody * Math.min(wrapped.length, 1);
}

function cardChrome(hasTitle: boolean, itemCount: number): number {
	const title = hasTitle ? TYPE.lineSection + (itemCount > 0 ? CARD.titleGap : 0) : 0;
	return CARD.padding * 2 + title;
}

function sectionStartMin(section: DocumentSection): number {
	const width = section.kind === 'preamble' ? preambleColWidth() : itemTextWidth();
	const first = section.items[0];
	const firstLine = first ? firstItemMinHeight(first, width) : TYPE.lineBody;
	if (section.kind === 'preamble') {
		return CARD.padding * 2 + TYPE.lineSection + CARD.preambleTitleGap + firstLine;
	}
	return cardChrome(true, 1) + firstLine;
}

function layItem(item: ClauseItem, width: number, number: string): LaidItem {
	return {
		number,
		paragraphs: wrapParagraphs(item.paragraphs, width),
		bullets: wrapParagraphs(item.bullets, width)
	};
}

function splitItem(item: LaidItem, maxHeight: number): { fit: LaidItem | null; rest: LaidItem | null } {
	const takeParas: LaidLine[][] = [];
	let used = 0;

	for (let p = 0; p < item.paragraphs.length; p++) {
		const para = item.paragraphs[p];
		const chunk: LaidLine[] = [];
		for (let l = 0; l < para.length; l++) {
			const extra = chunk.length === 0 && takeParas.length > 0 ? TYPE.paraGap : 0;
			const next = extra + TYPE.lineBody;
			if (used + next > maxHeight && (takeParas.length > 0 || chunk.length > 0)) {
				if (chunk.length) takeParas.push(chunk);
				const restParas = [para.slice(l), ...item.paragraphs.slice(p + 1)].filter(
					(lines) => lines.length
				);
				return {
					fit: { number: item.number, paragraphs: takeParas, bullets: [] },
					rest: {
						number: '',
						paragraphs: restParas,
						bullets: item.bullets
					}
				};
			}
			chunk.push(para[l]);
			used += next;
		}
		takeParas.push(chunk);
	}

	if (item.bullets.length) {
		const bullets: LaidLine[][] = [];
		const gap = takeParas.length ? TYPE.paraGap : 0;
		if (used + gap + TYPE.lineBody > maxHeight && takeParas.length) {
			return {
				fit: { number: item.number, paragraphs: takeParas, bullets: [] },
				rest: { number: '', paragraphs: [], bullets: item.bullets }
			};
		}
		used += gap;
		for (let b = 0; b < item.bullets.length; b++) {
			if (used + TYPE.lineBody > maxHeight && bullets.length) {
				return {
					fit: { number: item.number, paragraphs: takeParas, bullets },
					rest: { number: '', paragraphs: [], bullets: item.bullets.slice(b) }
				};
			}
			bullets.push(item.bullets[b]);
			used += TYPE.lineBody;
		}
		return { fit: { number: item.number, paragraphs: takeParas, bullets }, rest: null };
	}

	return { fit: { ...item, paragraphs: takeParas }, rest: null };
}

function radiusFor(start: boolean, end: boolean): CardRadius {
	const r = CARD.radius;
	return {
		tl: start ? r : 0,
		tr: start ? r : 0,
		br: end ? r : 0,
		bl: end ? r : 0
	};
}

function cardHeight(card: Omit<LaidCard, 'height' | 'radius'>): number {
	if (card.kind === 'preamble' && card.columns) {
		const left = linesHeight(card.columns.left);
		const right = linesHeight(card.columns.right);
		return CARD.padding * 2 + TYPE.lineSection + CARD.preambleTitleGap + Math.max(left, right);
	}
	const itemsH = card.items.reduce((sum, item, i) => sum + itemHeight(item) + (i > 0 ? CARD.itemGap : 0), 0);
	return cardChrome(Boolean(card.title), card.items.length) + itemsH;
}

function availableContent(header: 'full' | 'condensed'): number {
	const headerH = header === 'full' ? HEADER.fullHeight : HEADER.condensedHeight;
	const innerGap = header === 'full' ? PAGE.innerGapFull : PAGE.innerGapCondensed;
	return (
		PAGE.height -
		PAGE.padding * 2 -
		PAGE.stackGap -
		PAGE.footerHeight -
		headerH -
		innerGap
	);
}

function signatureHeight(): number {
	return (
		SIGNATURE.headingGap +
		TYPE.signatureHeading +
		6 +
		SIGNATURE.labelGap +
		TYPE.signatureLabel +
		SIGNATURE.padHeight +
		SIGNATURE.dateGap +
		TYPE.signatureLabel
	);
}

type PageAcc = {
	header: 'full' | 'condensed';
	line1: string;
	line2: string;
	cards: LaidCard[];
	signatures: LaidSignatures | null;
	used: number;
};

function closeCard(card: Omit<LaidCard, 'height' | 'radius'>, start: boolean, end: boolean): LaidCard {
	const radius = radiusFor(start, end);
	return { ...card, radius, height: cardHeight(card) };
}

export function paginateContract(input: LayoutInput): LaidPage[] {
	const pages: PageAcc[] = [];
	const textW = itemTextWidth();
	const colW = preambleColWidth();
	const sigH = signatureHeight();
	let docIndex = 0;

	const pushPage = (header: 'full' | 'condensed', line1: string, line2: string) => {
		pages.push({
			header,
			line1,
			line2,
			cards: [],
			signatures: null,
			used: 0
		});
	};

	const remaining = () => {
		const page = pages[pages.length - 1];
		const max = availableContent(page.header);
		const gaps = page.cards.length ? PAGE.cardGap : 0;
		return max - page.used - gaps;
	};

	for (const document of input.documents) {
		pushPage('full', document.line1, document.line2);
		docIndex += 1;
		void docIndex;

		for (const section of document.sections) {
			const width = section.kind === 'preamble' ? colW : textW;
			let pending = section.items.map((item) => layItem(item, width, item.number));
			let started = false;
			let showTitle = true;

			if (section.kind === 'preamble' && section.columns) {
				const card: Omit<LaidCard, 'height' | 'radius'> = {
					kind: 'preamble',
					sectionId: section.id,
					footerLabel: section.footerLabel,
					title: { number: '', text: section.title },
					columns: {
						left: wrapParagraphs(section.columns.left, colW),
						right: wrapParagraphs(section.columns.right, colW)
					},
					items: []
				};
				const h = cardHeight(card);
				if (h > remaining() && pages[pages.length - 1].cards.length) {
					pushPage('condensed', document.line1, document.line2);
				}
				pages[pages.length - 1].cards.push(closeCard(card, true, true));
				pages[pages.length - 1].used += h + (pages[pages.length - 1].cards.length > 1 ? PAGE.cardGap : 0);
				continue;
			}

			while (showTitle || pending.length) {
				if (pages.length > 80) break;
				if (remaining() < sectionStartMin(section) && (showTitle || !started)) {
					if (pages[pages.length - 1].cards.length) {
						pushPage('condensed', document.line1, document.line2);
					}
				}

				const fitItems: LaidItem[] = [];
				let chrome = cardChrome(showTitle, 1);
				let budget = remaining() - chrome;
				if (budget < TYPE.lineBody) {
					pushPage('condensed', document.line1, document.line2);
					chrome = cardChrome(showTitle, 1);
					budget = remaining() - chrome;
				}

				while (pending.length) {
					const item = pending[0];
					const h = itemHeight(item);
					const gap = fitItems.length ? CARD.itemGap : 0;
					if (h + gap <= budget) {
						fitItems.push(item);
						pending.shift();
						budget -= h + gap;
						continue;
					}
					const split = splitItem(item, budget - gap);
					if (split.fit && (split.fit.paragraphs.length || split.fit.bullets.length)) {
						fitItems.push(split.fit);
						pending[0] = split.rest ?? { number: '', paragraphs: [], bullets: [] };
						if (!pending[0].paragraphs.length && !pending[0].bullets.length) pending.shift();
					}
					break;
				}

				if (!fitItems.length && pending.length) {
					pushPage('condensed', document.line1, document.line2);
					continue;
				}

				const more = pending.length > 0;
				const card = closeCard(
					{
						kind: 'section',
						sectionId: section.id,
						footerLabel: section.footerLabel,
						title: showTitle ? { number: section.number, text: section.title } : undefined,
						items: fitItems
					},
					!started,
					!more
				);
				const page = pages[pages.length - 1];
				page.cards.push(card);
				page.used += card.height + (page.cards.length > 1 ? PAGE.cardGap : 0);
				started = true;
				showTitle = false;
				if (!more) break;
				pushPage('condensed', document.line1, document.line2);
			}
		}
	}

	const last = pages[pages.length - 1];
	const sigBlock = {
		clientName: input.clientName,
		designerName: input.designerName,
		clientDate: input.clientDate,
		designerDate: input.designerDate,
		height: sigH
	};
	const need = PAGE.cardGap + sigH;
	if (remaining() >= need) {
		last.signatures = sigBlock;
		last.used += need;
	} else {
		pushPage('condensed', last.line1, last.line2);
		pages[pages.length - 1].signatures = sigBlock;
		pages[pages.length - 1].used += sigH;
	}

	return pages.map((page, index) => {
		const labels: string[] = [];
		for (const card of page.cards) {
			if (!labels.includes(card.footerLabel)) labels.push(card.footerLabel);
		}
		if (page.signatures && !labels.includes('Signatures')) labels.push('Signatures');
		return {
			header: page.header,
			line1: page.line1,
			line2: page.line2,
			lastUpdated: input.lastUpdated,
			cards: page.cards,
			signatures: page.signatures,
			footerLabels: labels,
			page: index + 1,
			total: pages.length
		};
	});
}
