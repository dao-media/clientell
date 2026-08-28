export const CONTRACT_DOC_TYPES = ['agreement', 'addendum', 'sow'] as const;
export type ContractDocType = (typeof CONTRACT_DOC_TYPES)[number];

export const CONTRACT_CLAUSE_TYPES = ['core', 'module'] as const;
export type ContractClauseType = (typeof CONTRACT_CLAUSE_TYPES)[number];

export const CONTRACT_MODULE_KEYS = [
	'personal_guarantee',
	'confidentiality',
	'third_party_a',
	'third_party_b'
] as const;
export type ContractModuleKey = (typeof CONTRACT_MODULE_KEYS)[number];

export const CONTRACT_STATUSES = ['draft', 'sent', 'signed'] as const;
export type ContractStatus = (typeof CONTRACT_STATUSES)[number];

export const REMAINING_STRUCTURES = ['single', 'milestone'] as const;
export type RemainingStructure = (typeof REMAINING_STRUCTURES)[number];

export const THIRD_PARTY_OPTIONS = ['A', 'B'] as const;
export type ThirdPartyOption = (typeof THIRD_PARTY_OPTIONS)[number];

export const CONFIDENTIALITY_TIERS = [1, 2, 3] as const;
export type ConfidentialityTier = (typeof CONFIDENTIALITY_TIERS)[number];

export type ContractDeliverable = {
	name: string;
	includedRevisionRounds: number;
};

export type ContractMilestone = {
	label: string;
	targetDate: string;
};

export type ContractServiceOwnership = {
	name: string;
	accountOwner: string;
	renewalResponsibility: string;
};

export type ClauseSeed = {
	sectionNumber: string;
	title: string;
	body: string;
	docType: ContractDocType;
	clauseType: ContractClauseType;
	moduleKey: ContractModuleKey | null;
	sortOrder: number;
};

export type AssembledClause = {
	sectionNumber: string;
	title: string;
	body: string;
};

export type AssembledDocument = {
	docType: ContractDocType;
	title: string;
	clauses: AssembledClause[];
};

export type AssemblyResult = {
	documents: AssembledDocument[];
	variables: Record<string, string>;
	missing: string[];
};

export type ContractSignatureRole = 'client' | 'designer';

export type ContractSignatures = {
	clientPng: string | null;
	designerPng: string | null;
	clientSignedAt: Date | null;
	designerSignedAt: Date | null;
};

export const TIER_PREMIUM_PCT: Record<ConfidentialityTier, number> = {
	1: 10,
	2: 20,
	3: 30
};

export const TIER_LABELS: Record<ConfidentialityTier, string> = {
	1: 'Attribution Waiver (White-Label)',
	2: 'Confidentiality',
	3: 'Both (Full Confidentiality + Attribution Waiver)'
};
