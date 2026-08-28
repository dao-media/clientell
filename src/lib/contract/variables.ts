import { LEGAL_DEFAULTS } from './defaults';
import { formatCents } from './money';
import { computePricing } from './pricing';
import {
	TIER_LABELS,
	type ConfidentialityTier,
	type ContractDeliverable,
	type ContractMilestone,
	type ContractServiceOwnership,
	type RemainingStructure,
	type ThirdPartyOption
} from './types';

export type VariableContext = {
	legalName: string;
	entityType: string;
	entityState: string;
	company: string;
	contactName: string;
	contactEmail: string;
	contactPhone: string;
	projectName: string;
	description: string;
	deliverables: ContractDeliverable[];
	outOfScope: string[];
	approvalStages: string[];
	milestones: ContractMilestone[];
	estimatedStart: Date | null;
	effectiveDate: Date | null;
	baseFee: number;
	overageRate: number;
	remainingStructure: RemainingStructure;
	thirdPartyOption: ThirdPartyOption | null;
	handlingPct: number;
	perItemThreshold: number;
	serviceOwnership: ContractServiceOwnership[];
	personalGuarantee: boolean;
	confidentiality: boolean;
	confidentialityTier: ConfidentialityTier | null;
	premiumPct: number;
	premiumFloor: number;
	governingState: string;
	venueCounty: string;
};

const TOKEN_RE = /\{\{([a-z0-9_]+)\}\}/g;

function formatDate(value: Date | null | undefined): string {
	if (!value) return '';
	return new Intl.DateTimeFormat('en-US', { dateStyle: 'long' }).format(value);
}

function entityDescription(ctx: VariableContext): string {
	const type = ctx.entityType.trim();
	const state = ctx.entityState.trim();
	if (type && state) return `${type} (${state})`;
	if (type) return type;
	if (state) return `individual, ${state}`;
	return '';
}

function revisionSummary(deliverables: ContractDeliverable[]): string {
	const named = deliverables.filter((item) => item.name.trim());
	if (named.length === 0) return '';
	return named
		.map((item) => `${item.name}: ${item.includedRevisionRounds} round${item.includedRevisionRounds === 1 ? '' : 's'}`)
		.join('; ');
}

function deliverablesTable(deliverables: ContractDeliverable[]): string {
	const named = deliverables.filter((item) => item.name.trim());
	if (named.length === 0) return '';
	const rows = named.map(
		(item, index) =>
			`${index + 1}. ${item.name} — ${item.includedRevisionRounds} included revision round${item.includedRevisionRounds === 1 ? '' : 's'}`
	);
	return rows.join('\n');
}

function listBlock(items: string[]): string {
	const cleaned = items.map((item) => item.trim()).filter(Boolean);
	if (cleaned.length === 0) return '';
	return cleaned.map((item) => `- ${item}`).join('\n');
}

function milestonesTable(milestones: ContractMilestone[], estimatedStart: Date | null): string {
	const lines: string[] = [];
	if (estimatedStart) {
		lines.push(
			`Estimated start: ${formatDate(estimatedStart)} — Contingent on deposit per Agreement §3.3 (secured if deposit lands within 10 days)`
		);
	}
	for (const item of milestones) {
		const label = item.label.trim();
		if (!label) continue;
		lines.push(`${label}: ${item.targetDate.trim() || 'TBD'}`);
	}
	return lines.join('\n');
}

function ownershipTable(rows: ContractServiceOwnership[]): string {
	const filled = rows.filter((row) => row.name.trim());
	if (filled.length === 0) return '';
	return filled
		.map(
			(row) =>
				`- ${row.name} — account owner: ${row.accountOwner || 'TBD'}; renewal after handoff: ${row.renewalResponsibility || 'TBD'}`
		)
		.join('\n');
}

function mark(on: boolean): string {
	return on ? '[X]' : '[ ]';
}

function remainingLabel(structure: RemainingStructure): string {
	if (structure === 'milestone') {
		return 'per the milestones in Exhibit A';
	}
	return 'upon completion, before final delivery/handoff';
}

function thirdPartyLabel(
	option: ThirdPartyOption | null,
	handlingPct: number,
	threshold: string
): string {
	if (option === 'A') {
		return `[X] A — Designer procures, itemized on final invoice + ${handlingPct}% handling; items over ${threshold} need prior approval.  [ ] B — Client-provided controlled card.`;
	}
	if (option === 'B') {
		return `[ ] A — Designer procures.  [X] B — Client-provided controlled card (merchant-locked, spend-limited, e.g. Privacy.com); every purchase pre-approved in writing.`;
	}
	return '';
}

export function buildVariableMap(ctx: VariableContext): Record<string, string> {
	const pricing = computePricing({
		baseFee: ctx.baseFee,
		confidentiality: ctx.confidentiality,
		confidentialityTier: ctx.confidentialityTier,
		premiumPct: ctx.premiumPct,
		premiumFloor: ctx.premiumFloor
	});

	const threshold = formatCents(ctx.perItemThreshold);
	const tier = ctx.confidentialityTier;

	return {
		effective_date: formatDate(ctx.effectiveDate ?? new Date()),
		last_updated: formatDate(LEGAL_DEFAULTS.documentUpdatedAt),
		designer_name: LEGAL_DEFAULTS.designerName,
		designer_short: LEGAL_DEFAULTS.designerShort,
		designer_display: LEGAL_DEFAULTS.designerDisplay,
		legal_name: ctx.legalName.trim(),
		client_name: ctx.legalName.trim(),
		entity_description: entityDescription(ctx),
		company: ctx.company.trim(),
		contact_name: ctx.contactName.trim(),
		contact_email: ctx.contactEmail.trim(),
		contact_phone: ctx.contactPhone.trim() || '—',
		project_name: ctx.projectName.trim(),
		project_description: ctx.description.trim(),
		revision_rounds_summary: revisionSummary(ctx.deliverables),
		deliverables_table: deliverablesTable(ctx.deliverables),
		out_of_scope_list: listBlock(ctx.outOfScope),
		approval_stages_list: ctx.approvalStages.map((item) => item.trim()).filter(Boolean).join(' → '),
		milestones_table: milestonesTable(ctx.milestones, ctx.estimatedStart),
		estimated_start: formatDate(ctx.estimatedStart),
		overage_rate_formatted: formatCents(ctx.overageRate),
		base_fee_formatted: formatCents(pricing.baseFee),
		confidentiality_premium_formatted: ctx.confidentiality
			? formatCents(pricing.confidentialityPremium)
			: '$0.00',
		addendum_premium_label: ctx.confidentiality
			? `${formatCents(pricing.confidentialityPremium)} / ${ctx.premiumPct}% of project fee`
			: 'a negotiated premium recorded in Exhibit A',
		total_formatted: formatCents(pricing.total),
		deposit_formatted: formatCents(pricing.deposit),
		remaining_formatted: formatCents(pricing.remaining),
		deposit_pct: String(LEGAL_DEFAULTS.depositPct),
		remaining_pct: String(LEGAL_DEFAULTS.remainingPct),
		remaining_structure_label: remainingLabel(ctx.remainingStructure),
		handling_pct: String(ctx.handlingPct),
		per_item_threshold_formatted: threshold,
		service_ownership_table: ownershipTable(ctx.serviceOwnership),
		third_party_option_label: thirdPartyLabel(ctx.thirdPartyOption, ctx.handlingPct, threshold),
		pg_mark: mark(ctx.personalGuarantee),
		conf_mark: mark(ctx.confidentiality),
		confidentiality_tier: tier ? String(tier) : '',
		confidentiality_tier_label: tier ? TIER_LABELS[tier] : 'None',
		premium_pct: String(ctx.premiumPct),
		premium_floor_formatted: formatCents(ctx.premiumFloor),
		governing_state: ctx.governingState.trim() || LEGAL_DEFAULTS.governingState,
		venue_county: ctx.venueCounty.trim(),
		response_sla_days: String(LEGAL_DEFAULTS.responseSlaDays),
		dormancy_pause_days: String(LEGAL_DEFAULTS.dormancyPauseDays),
		dormancy_inactive_days: String(LEGAL_DEFAULTS.dormancyInactiveDays),
		acceptance_window_days: String(LEGAL_DEFAULTS.acceptanceWindowDays),
		warranty_days: String(LEGAL_DEFAULTS.warrantyDays),
		invoice_due_days: String(LEGAL_DEFAULTS.invoiceDueDays),
		late_fee_grace_days: String(LEGAL_DEFAULTS.lateFeeGraceDays),
		late_fee_pct: String(LEGAL_DEFAULTS.lateFeePct),
		late_fee_floor_formatted: formatCents(LEGAL_DEFAULTS.lateFeeFloorCents),
		collections_days: String(LEGAL_DEFAULTS.collectionsDays),
		reengagement_fee_formatted: formatCents(LEGAL_DEFAULTS.reengagementFeeCents),
		confidentiality_duration: LEGAL_DEFAULTS.confidentialityDuration,
		tier_1_mark: mark(tier === 1),
		tier_2_mark: mark(tier === 2),
		tier_3_mark: mark(tier === 3)
	};
}

export function resolveTemplate(text: string, variables: Record<string, string>): string {
	return text.replace(TOKEN_RE, (_, key: string) => variables[key] ?? `{{${key}}}`);
}

export function findUnresolvedTokens(text: string): string[] {
	const found = new Set<string>();
	for (const match of text.matchAll(TOKEN_RE)) {
		found.add(match[1]);
	}
	return [...found];
}

export const REQUIRED_VARIABLES = [
	'legal_name',
	'entity_description',
	'project_name',
	'project_description',
	'venue_county',
	'deliverables_table',
	'total_formatted'
] as const;

export function missingRequiredVariables(variables: Record<string, string>): string[] {
	const missing: string[] = [];
	for (const key of REQUIRED_VARIABLES) {
		if (!variables[key]?.trim() || variables[key] === '$0.00') {
			if (key === 'total_formatted' && variables.base_fee_formatted === '$0.00') {
				missing.push('base_fee');
				continue;
			}
			if (key === 'total_formatted') continue;
			missing.push(key);
		}
	}
	if (!variables.base_fee_formatted || variables.base_fee_formatted === '$0.00') {
		if (!missing.includes('base_fee')) missing.push('base_fee');
	}
	return missing;
}
