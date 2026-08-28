import type { AssembledClause, AssembledDocument, AssemblyResult, ContractDocType } from './types';

export type TextRun = { text: string; bold?: boolean };

export type ClauseItem = {
	number: string;
	paragraphs: TextRun[][];
	bullets: TextRun[][];
};

export type DocumentSection = {
	id: string;
	kind: 'preamble' | 'section';
	docType: ContractDocType;
	number: string;
	title: string;
	footerLabel: string;
	items: ClauseItem[];
	columns?: { left: TextRun[][]; right: TextRun[][] };
};

export type PackedDocument = {
	docType: ContractDocType;
	line1: string;
	line2: string;
	sections: DocumentSection[];
};

const SIGNATURE_SECTIONS = new Set(['S', 'AS', 'CS']);
const SKIP_NUMBERS = new Set(['0', 'A0', 'C0', ...SIGNATURE_SECTIONS]);

const DOC_HEADERS: Record<ContractDocType, { line1: string; line2: string }> = {
	agreement: { line1: 'Design & Development', line2: 'Services Agreement' },
	sow: { line1: 'Exhibit A', line2: 'Statement of Work' },
	addendum: { line1: 'Confidentiality & Attribution', line2: 'Addendum' }
};

const FOOTER_LABELS: Record<string, string> = {
	'Changes & Additional Work': 'Changes & Additional',
	'Payment Schedule & Fees': 'Fees & Payment Schedule',
	'Third-Party Costs (Hosting, Tools, Subscriptions)': 'Third-Party Costs',
	'Intellectual Property & Ownership': 'IP & Ownership',
	'Warranty & Post-Launch Support': 'Warranty & Support',
	'Dispute Resolution & Governing Law': 'Dispute Resolution'
};

function parentKey(sectionNumber: string): string {
	if (SKIP_NUMBERS.has(sectionNumber)) return sectionNumber;
	if (/^\d+\.\d+/.test(sectionNumber)) return sectionNumber.split('.')[0];
	return sectionNumber;
}

function parseRuns(text: string): TextRun[] {
	const runs: TextRun[] = [];
	const re = /\*\*(.+?)\*\*/g;
	let last = 0;
	let match: RegExpExecArray | null;
	while ((match = re.exec(text))) {
		if (match.index > last) {
			runs.push({ text: text.slice(last, match.index) });
		}
		runs.push({ text: match[1], bold: true });
		last = match.index + match[0].length;
	}
	if (last < text.length) runs.push({ text: text.slice(last) });
	return runs.filter((run) => run.text.length > 0);
}

function splitParagraphs(text: string): string[] {
	return text
		.replace(/\r\n/g, '\n')
		.split(/\n+/)
		.map((line) => line.trim())
		.filter(Boolean);
}

function parseItemBody(raw: string): { paragraphs: TextRun[][]; bullets: TextRun[][] } {
	const paragraphs: TextRun[][] = [];
	const bullets: TextRun[][] = [];
	for (const line of splitParagraphs(raw)) {
		if (/^[-•]\s+/.test(line)) {
			bullets.push(parseRuns(line.replace(/^[-•]\s+/, '')));
		} else {
			paragraphs.push(parseRuns(line));
		}
	}
	return { paragraphs, bullets };
}

function parseItems(body: string): ClauseItem[] {
	const trimmed = body.trim();
	if (!trimmed) return [];
	const chunks = trimmed.split(/(?=^\d+\.\d+\.?\s+)/m).filter((chunk) => chunk.trim());
	return chunks.map((chunk) => {
		const match = chunk.trim().match(/^(\d+\.\d+)\.?\s+([\s\S]+)$/);
		if (match) {
			const parsed = parseItemBody(match[2]);
			return { number: match[1], ...parsed };
		}
		return { number: '', ...parseItemBody(chunk) };
	});
}

function parsePreamble(body: string): { left: TextRun[][]; right: TextRun[][] } {
	const [leftRaw, rightRaw] = body.split(/\n\|\|\n/);
	const toParas = (text: string) => splitParagraphs(text ?? '').map(parseRuns);
	if (rightRaw !== undefined) {
		return { left: toParas(leftRaw), right: toParas(rightRaw) };
	}
	const paras = toParas(body);
	const mid = Math.ceil(paras.length / 2);
	return { left: paras.slice(0, mid), right: paras.slice(mid) };
}

function headingNumber(sectionNumber: string): string {
	if (SKIP_NUMBERS.has(sectionNumber)) return '';
	if (/^\d+$/.test(sectionNumber)) return `${sectionNumber}.`;
	if (/^A\d+$/.test(sectionNumber)) return `${sectionNumber.slice(1)}.`;
	if (/^C\d+$/.test(sectionNumber)) return `${sectionNumber.slice(1)}.`;
	return '';
}

function footerLabelFor(title: string): string {
	return FOOTER_LABELS[title] ?? title;
}

function groupClauses(docType: ContractDocType, clauses: AssembledClause[]): DocumentSection[] {
	const groups = new Map<string, AssembledClause[]>();
	const order: string[] = [];

	for (const clause of clauses) {
		if (SIGNATURE_SECTIONS.has(clause.sectionNumber)) continue;
		const key = parentKey(clause.sectionNumber);
		if (!groups.has(key)) {
			groups.set(key, []);
			order.push(key);
		}
		groups.get(key)!.push(clause);
	}

	return order.map((key) => {
		const list = groups.get(key)!;
		const primary = list.find((clause) => clause.sectionNumber === key) ?? list[0];
		const items = list
			.flatMap((clause) => parseItems(clause.body))
			.sort((a, b) => {
				if (!a.number && !b.number) return 0;
				if (!a.number) return -1;
				if (!b.number) return 1;
				return a.number.localeCompare(b.number, undefined, { numeric: true });
			});
		const isPreamble = docType === 'agreement' && key === '0';
		return {
			id: `${docType}-${key}`,
			kind: isPreamble ? 'preamble' : 'section',
			docType,
			number: headingNumber(key),
			title: primary.title,
			footerLabel: isPreamble ? primary.title : footerLabelFor(primary.title),
			items,
			columns: isPreamble ? parsePreamble(list.map((c) => c.body).join('\n\n')) : undefined
		};
	});
}

export function packAssembly(assembly: AssemblyResult): PackedDocument[] {
	return assembly.documents.map((document: AssembledDocument) => {
		const header = DOC_HEADERS[document.docType];
		return {
			docType: document.docType,
			line1: header.line1,
			line2: header.line2,
			sections: groupClauses(document.docType, document.clauses)
		};
	});
}
