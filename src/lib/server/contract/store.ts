import { and, desc, eq, gte, like, lte } from 'drizzle-orm';
import { assembleContract, type AssemblableClause } from '$lib/contract/assemble';
import { LEGAL_DEFAULTS } from '$lib/contract/defaults';
import { parseDollarsToCents } from '$lib/contract/money';
import { computePricing, defaultPremiumPct } from '$lib/contract/pricing';
import {
	CONFIDENTIALITY_TIERS,
	REMAINING_STRUCTURES,
	THIRD_PARTY_OPTIONS,
	type ConfidentialityTier,
	type ContractDeliverable,
	type ContractMilestone,
	type ContractServiceOwnership,
	type ContractSignatures,
	type ContractStatus,
	type RemainingStructure,
	type ThirdPartyOption
} from '$lib/contract/types';
import type { VariableContext } from '$lib/contract/variables';
import { createContractId } from '$lib/ids';
import { ensureClausesSeeded } from '$lib/server/contract/ensure-clauses';
import type { Database } from '$lib/server/db';
import { clauses, clients, contracts } from '$lib/server/db/schema';

export type ContractFilters = {
	status?: ContractStatus | 'all';
	clientId?: string;
	search?: string;
	dateFrom?: string;
	dateTo?: string;
};

function parseDateStart(value: string): Date | null {
	if (!value) return null;
	const date = new Date(`${value}T00:00:00`);
	return Number.isNaN(date.getTime()) ? null : date;
}

function parseDateEnd(value: string): Date | null {
	if (!value) return null;
	const date = new Date(`${value}T23:59:59.999`);
	return Number.isNaN(date.getTime()) ? null : date;
}

function parseJsonArray<T>(raw: FormDataEntryValue | null, fallback: T[]): T[] {
	if (typeof raw !== 'string' || !raw.trim()) return fallback;
	try {
		const parsed = JSON.parse(raw) as T[];
		return Array.isArray(parsed) ? parsed : fallback;
	} catch {
		return fallback;
	}
}

function parseLines(raw: FormDataEntryValue | null): string[] {
	if (typeof raw !== 'string') return [];
	return raw
		.split('\n')
		.map((line) => line.trim())
		.filter(Boolean);
}

function parseHtmlDate(raw: string): Date | null {
	if (!raw.trim()) return null;
	const date = new Date(`${raw}T12:00:00`);
	return Number.isNaN(date.getTime()) ? null : date;
}

function asTier(value: unknown): ConfidentialityTier | null {
	const num = Number(value);
	return (CONFIDENTIALITY_TIERS as readonly number[]).includes(num)
		? (num as ConfidentialityTier)
		: null;
}

function asRemaining(value: unknown): RemainingStructure {
	const raw = String(value ?? '');
	return (REMAINING_STRUCTURES as readonly string[]).includes(raw)
		? (raw as RemainingStructure)
		: 'single';
}

function asThirdParty(value: unknown): ThirdPartyOption | null {
	const raw = String(value ?? '').trim();
	return (THIRD_PARTY_OPTIONS as readonly string[]).includes(raw)
		? (raw as ThirdPartyOption)
		: null;
}

export function parseContractForm(data: FormData) {
	const confidentiality = data.get('confidentiality') === 'on' || data.get('confidentiality') === 'true';
	const confidentialityTier = confidentiality ? asTier(data.get('confidentialityTier')) : null;
	const premiumPctRaw = String(data.get('premiumPct') ?? '').trim();
	const premiumPct = premiumPctRaw
		? Number.parseFloat(premiumPctRaw)
		: defaultPremiumPct(confidentialityTier);

	return {
		clientId: String(data.get('clientId') ?? '').trim(),
		projectName: String(data.get('projectName') ?? '').trim(),
		description: String(data.get('description') ?? '').trim(),
		deliverables: parseJsonArray<ContractDeliverable>(data.get('deliverables'), []),
		outOfScope: parseLines(data.get('outOfScope')),
		approvalStages: parseLines(data.get('approvalStages')),
		milestones: parseJsonArray<ContractMilestone>(data.get('milestones'), []),
		estimatedStart: parseHtmlDate(String(data.get('estimatedStart') ?? '')),
		baseFee: parseDollarsToCents(data.get('baseFee')),
		overageRate: parseDollarsToCents(data.get('overageRate')) || LEGAL_DEFAULTS.overageRateCents,
		remainingStructure: asRemaining(data.get('remainingStructure')),
		thirdPartyOption: asThirdParty(data.get('thirdPartyOption')),
		handlingPct: Number.parseFloat(String(data.get('handlingPct') ?? '')) || LEGAL_DEFAULTS.handlingPct,
		perItemThreshold:
			parseDollarsToCents(data.get('perItemThreshold')) || LEGAL_DEFAULTS.perItemThresholdCents,
		serviceOwnership: parseJsonArray<ContractServiceOwnership>(data.get('serviceOwnership'), []),
		personalGuarantee:
			data.get('personalGuarantee') === 'on' || data.get('personalGuarantee') === 'true',
		confidentiality,
		confidentialityTier,
		premiumPct: Number.isFinite(premiumPct) ? premiumPct : 0,
		premiumFloor:
			parseDollarsToCents(data.get('premiumFloor')) || LEGAL_DEFAULTS.premiumFloorCents,
		governingState: String(data.get('governingState') ?? '').trim() || LEGAL_DEFAULTS.governingState,
		venueCounty: String(data.get('venueCounty') ?? '').trim()
	};
}

export type ParsedContractForm = ReturnType<typeof parseContractForm>;

export async function listContracts(db: Database, filters: ContractFilters = {}) {
	const conditions = [];
	if (filters.status && filters.status !== 'all') {
		conditions.push(eq(contracts.status, filters.status));
	}
	if (filters.clientId) {
		conditions.push(eq(contracts.clientId, filters.clientId));
	}
	if (filters.search?.trim()) {
		const term = `%${filters.search.trim()}%`;
		conditions.push(like(contracts.projectName, term));
	}
	const from = filters.dateFrom ? parseDateStart(filters.dateFrom) : null;
	if (from) conditions.push(gte(contracts.createdAt, from));
	const to = filters.dateTo ? parseDateEnd(filters.dateTo) : null;
	if (to) conditions.push(lte(contracts.createdAt, to));

	return db
		.select({
			id: contracts.id,
			projectName: contracts.projectName,
			status: contracts.status,
			baseFee: contracts.baseFee,
			createdAt: contracts.createdAt,
			sentAt: contracts.sentAt,
			clientId: clients.id,
			clientCompany: clients.company,
			clientContact: clients.contactName
		})
		.from(contracts)
		.innerJoin(clients, eq(contracts.clientId, clients.id))
		.where(conditions.length ? and(...conditions) : undefined)
		.orderBy(desc(contracts.createdAt));
}

export async function listClientContracts(db: Database, clientId: string) {
	return db
		.select()
		.from(contracts)
		.where(eq(contracts.clientId, clientId))
		.orderBy(desc(contracts.createdAt));
}

export async function getContractDetail(db: Database, id: string) {
	const [row] = await db
		.select({
			contract: contracts,
			client: clients
		})
		.from(contracts)
		.innerJoin(clients, eq(contracts.clientId, clients.id))
		.where(eq(contracts.id, id))
		.limit(1);

	return row ?? null;
}

export async function loadActiveClauses(db: Database): Promise<AssemblableClause[]> {
	const rows = await db.select().from(clauses);
	return rows.map((row) => ({
		sectionNumber: row.sectionNumber,
		title: row.title,
		body: row.body,
		docType: row.docType,
		clauseType: row.clauseType,
		moduleKey: row.moduleKey,
		sortOrder: row.sortOrder,
		isActive: row.isActive
	}));
}

export function contractToVariableContext(
	contract: typeof contracts.$inferSelect,
	client: typeof clients.$inferSelect,
	effectiveDate = new Date()
): VariableContext {
	return {
		legalName: client.legalName?.trim() || client.company,
		entityType: client.entityType ?? '',
		entityState: client.entityState ?? '',
		company: client.company,
		contactName: client.contactName,
		contactEmail: client.email,
		contactPhone: client.phone ?? '',
		projectName: contract.projectName,
		description: contract.description ?? '',
		deliverables: contract.deliverables ?? [],
		outOfScope: contract.outOfScope ?? [],
		approvalStages: contract.approvalStages ?? [],
		milestones: contract.milestones ?? [],
		estimatedStart: contract.estimatedStart,
		effectiveDate,
		baseFee: contract.baseFee,
		overageRate: contract.overageRate,
		remainingStructure: contract.remainingStructure,
		thirdPartyOption: contract.thirdPartyOption,
		handlingPct: contract.handlingPct,
		perItemThreshold: contract.perItemThreshold,
		serviceOwnership: contract.serviceOwnership ?? [],
		personalGuarantee: contract.personalGuarantee,
		confidentiality: contract.confidentiality,
		confidentialityTier: contract.confidentialityTier,
		premiumPct: contract.premiumPct,
		premiumFloor: contract.premiumFloor,
		governingState: contract.governingState,
		venueCounty: contract.venueCounty ?? ''
	};
}

export async function assembleFromContract(db: Database, id: string) {
	const detail = await getContractDetail(db, id);
	if (!detail) return null;
	await ensureClausesSeeded(db);
	const clauseRows = await loadActiveClauses(db);
	const ctx = contractToVariableContext(detail.contract, detail.client);
	return {
		detail,
		assembly: assembleContract(clauseRows, ctx, {
			personalGuarantee: detail.contract.personalGuarantee,
			confidentiality: detail.contract.confidentiality,
			thirdPartyOption: detail.contract.thirdPartyOption
		}),
		pricing: computePricing({
			baseFee: detail.contract.baseFee,
			confidentiality: detail.contract.confidentiality,
			confidentialityTier: detail.contract.confidentialityTier,
			premiumPct: detail.contract.premiumPct,
			premiumFloor: detail.contract.premiumFloor
		})
	};
}

export async function insertContract(db: Database, values: ParsedContractForm) {
	const [row] = await db
		.insert(contracts)
		.values({
			id: createContractId(),
			...values,
			status: 'draft'
		})
		.returning();
	return row;
}

export async function updateContract(db: Database, id: string, values: ParsedContractForm) {
	const { clientId: _clientId, ...rest } = values;
	const [row] = await db
		.update(contracts)
		.set(rest)
		.where(eq(contracts.id, id))
		.returning();
	return row;
}

export async function ensureDownloadToken(db: Database, id: string): Promise<string> {
	const [existing] = await db
		.select({ downloadToken: contracts.downloadToken })
		.from(contracts)
		.where(eq(contracts.id, id))
		.limit(1);

	if (existing?.downloadToken) return existing.downloadToken;

	const token = crypto.randomUUID();
	await db.update(contracts).set({ downloadToken: token }).where(eq(contracts.id, id));
	return token;
}

export async function getContractByDownloadToken(db: Database, token: string) {
	if (!token.trim()) return null;
	const [row] = await db
		.select({
			contract: contracts,
			client: clients
		})
		.from(contracts)
		.innerJoin(clients, eq(contracts.clientId, clients.id))
		.where(eq(contracts.downloadToken, token))
		.limit(1);
	return row ?? null;
}

export function signaturesFrom(contract: typeof contracts.$inferSelect): ContractSignatures {
	return {
		clientPng: contract.clientSignature,
		designerPng: contract.designerSignature,
		clientSignedAt: contract.clientSignedAt,
		designerSignedAt: contract.designerSignedAt
	};
}

export async function saveContractSignature(
	db: Database,
	id: string,
	role: 'client' | 'designer',
	png: string
) {
	const now = new Date();
	if (role === 'client') {
		await db
			.update(contracts)
			.set({ clientSignature: png, clientSignedAt: now })
			.where(eq(contracts.id, id));
	} else {
		await db
			.update(contracts)
			.set({ designerSignature: png, designerSignedAt: now })
			.where(eq(contracts.id, id));
	}

	const [row] = await db
		.select({
			clientSignature: contracts.clientSignature,
			designerSignature: contracts.designerSignature
		})
		.from(contracts)
		.where(eq(contracts.id, id))
		.limit(1);

	if (row?.clientSignature && row.designerSignature) {
		await db
			.update(contracts)
			.set({ status: 'signed', signedAt: now })
			.where(eq(contracts.id, id));
	}

	return row;
}

export type PersistPdfResult =
	| { ok: true; pdf: Uint8Array; key: string }
	| { ok: false; missing: string[] }
	| null;

export async function renderAndStoreContractPdf(
	db: Database,
	platform: App.Platform | undefined,
	id: string
): Promise<PersistPdfResult> {
	const assembled = await assembleFromContract(db, id);
	if (!assembled) return null;
	if (assembled.assembly.missing.length > 0) {
		return { ok: false, missing: assembled.assembly.missing };
	}

	const { buildContractPdf } = await import('./render-pdf');
	const { storeBinary } = await import('$lib/server/uploads');
	const pdf = await buildContractPdf(assembled.assembly, signaturesFrom(assembled.detail.contract));
	const key = `contracts/${assembled.detail.client.id}/${id}/packet.pdf`;
	try {
		await storeBinary(platform, key, pdf, 'application/pdf');
		await db.update(contracts).set({ pdfKey: key }).where(eq(contracts.id, id));
	} catch (err) {
		console.warn('[clientell] contract PDF stored in memory only; R2 write failed', err);
	}
	return { ok: true, pdf, key };
}
