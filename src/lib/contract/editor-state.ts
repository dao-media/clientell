import { LEGAL_DEFAULTS } from './defaults';
import { defaultPremiumPct } from './pricing';
import type {
	ConfidentialityTier,
	ContractDeliverable,
	ContractMilestone,
	ContractServiceOwnership,
	RemainingStructure,
	ThirdPartyOption
} from './types';
import type { VariableContext } from './variables';

export type ContractEditorState = {
	clientId: string;
	projectName: string;
	description: string;
	deliverables: ContractDeliverable[];
	outOfScope: string;
	approvalStages: string;
	milestones: ContractMilestone[];
	estimatedStart: string;
	baseFee: string;
	overageRate: string;
	remainingStructure: RemainingStructure;
	thirdPartyOption: ThirdPartyOption | '';
	handlingPct: string;
	perItemThreshold: string;
	serviceOwnership: ContractServiceOwnership[];
	personalGuarantee: boolean;
	confidentiality: boolean;
	confidentialityTier: ConfidentialityTier | null;
	premiumPct: string;
	premiumFloor: string;
	governingState: string;
	venueCounty: string;
};

export function emptyEditorState(): ContractEditorState {
	return {
		clientId: '',
		projectName: '',
		description: '',
		deliverables: [{ name: '', includedRevisionRounds: 2 }],
		outOfScope: '',
		approvalStages: '',
		milestones: [{ label: '', targetDate: '' }],
		estimatedStart: '',
		baseFee: '',
		overageRate: (LEGAL_DEFAULTS.overageRateCents / 100).toFixed(2),
		remainingStructure: 'single',
		thirdPartyOption: '',
		handlingPct: String(LEGAL_DEFAULTS.handlingPct),
		perItemThreshold: (LEGAL_DEFAULTS.perItemThresholdCents / 100).toFixed(2),
		serviceOwnership: [{ name: '', accountOwner: '', renewalResponsibility: '' }],
		personalGuarantee: false,
		confidentiality: false,
		confidentialityTier: null,
		premiumPct: '',
		premiumFloor: (LEGAL_DEFAULTS.premiumFloorCents / 100).toFixed(2),
		governingState: LEGAL_DEFAULTS.governingState,
		venueCounty: ''
	};
}

function toCents(raw: string): number {
	const parsed = Number.parseFloat(raw.replace(/[$,]/g, ''));
	if (!Number.isFinite(parsed)) return 0;
	return Math.round(parsed * 100);
}

function parseHtmlDate(raw: string): Date | null {
	if (!raw.trim()) return null;
	const date = new Date(`${raw}T12:00:00`);
	return Number.isNaN(date.getTime()) ? null : date;
}

export function editorStateToContext(
	state: ContractEditorState,
	client: {
		legalName: string | null;
		entityType: string | null;
		entityState: string | null;
		company: string;
		contactName: string;
		email: string;
		phone: string | null;
	} | null
): VariableContext {
	const tier = state.confidentiality ? state.confidentialityTier : null;
	const premiumPct = state.premiumPct.trim()
		? Number.parseFloat(state.premiumPct)
		: defaultPremiumPct(tier);

	return {
		legalName: client?.legalName?.trim() || client?.company || '',
		entityType: client?.entityType ?? '',
		entityState: client?.entityState ?? '',
		company: client?.company ?? '',
		contactName: client?.contactName ?? '',
		contactEmail: client?.email ?? '',
		contactPhone: client?.phone ?? '',
		projectName: state.projectName,
		description: state.description,
		deliverables: state.deliverables,
		outOfScope: state.outOfScope.split('\n').map((line) => line.trim()).filter(Boolean),
		approvalStages: state.approvalStages.split('\n').map((line) => line.trim()).filter(Boolean),
		milestones: state.milestones,
		estimatedStart: parseHtmlDate(state.estimatedStart),
		effectiveDate: new Date(),
		baseFee: toCents(state.baseFee),
		overageRate: toCents(state.overageRate) || LEGAL_DEFAULTS.overageRateCents,
		remainingStructure: state.remainingStructure,
		thirdPartyOption: state.thirdPartyOption || null,
		handlingPct: Number.parseFloat(state.handlingPct) || LEGAL_DEFAULTS.handlingPct,
		perItemThreshold: toCents(state.perItemThreshold) || LEGAL_DEFAULTS.perItemThresholdCents,
		serviceOwnership: state.serviceOwnership,
		personalGuarantee: state.personalGuarantee,
		confidentiality: state.confidentiality,
		confidentialityTier: tier,
		premiumPct: Number.isFinite(premiumPct) ? premiumPct : 0,
		premiumFloor: toCents(state.premiumFloor) || LEGAL_DEFAULTS.premiumFloorCents,
		governingState: state.governingState || LEGAL_DEFAULTS.governingState,
		venueCounty: state.venueCounty
	};
}

export function isoDateInput(value: Date | string | null | undefined): string {
	if (!value) return '';
	const date = value instanceof Date ? value : new Date(value);
	if (Number.isNaN(date.getTime())) return '';
	return date.toISOString().slice(0, 10);
}
