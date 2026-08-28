import {
	buildVariableMap,
	findUnresolvedTokens,
	missingRequiredVariables,
	resolveTemplate,
	type VariableContext
} from './variables';
import type {
	AssembledDocument,
	AssemblyResult,
	ContractDocType,
	ContractModuleKey
} from './types';

export type AssemblableClause = {
	sectionNumber: string;
	title: string;
	body: string;
	docType: ContractDocType;
	clauseType: 'core' | 'module';
	moduleKey: ContractModuleKey | null;
	sortOrder: number;
	isActive: boolean;
};

export type AssemblyToggles = {
	personalGuarantee: boolean;
	confidentiality: boolean;
	thirdPartyOption: 'A' | 'B' | null;
};

const DOC_TITLES: Record<ContractDocType, string> = {
	agreement: 'Design & Development Services Agreement',
	sow: 'Exhibit A — Statement of Work',
	addendum: 'Confidentiality & Attribution Addendum'
};

export function moduleEnabled(key: ContractModuleKey | null, toggles: AssemblyToggles): boolean {
	if (!key) return true;
	switch (key) {
		case 'personal_guarantee':
			return toggles.personalGuarantee;
		case 'confidentiality':
			return toggles.confidentiality;
		case 'third_party_a':
			return toggles.thirdPartyOption === 'A';
		case 'third_party_b':
			return toggles.thirdPartyOption === 'B';
	}
}

export function selectClauses(
	clauses: AssemblableClause[],
	toggles: AssemblyToggles
): AssemblableClause[] {
	return clauses
		.filter((clause) => clause.isActive)
		.filter((clause) => {
			if (clause.clauseType === 'core') return true;
			return moduleEnabled(clause.moduleKey, toggles);
		})
		.filter((clause) => {
			if (clause.docType === 'addendum' && !toggles.confidentiality) return false;
			return true;
		})
		.sort((a, b) => a.sortOrder - b.sortOrder || a.sectionNumber.localeCompare(b.sectionNumber));
}

export function assembleContract(
	clauses: AssemblableClause[],
	ctx: VariableContext,
	toggles: AssemblyToggles
): AssemblyResult {
	const variables = buildVariableMap(ctx);
	const selected = selectClauses(clauses, toggles);
	const byDoc = new Map<ContractDocType, AssemblableClause[]>();

	for (const clause of selected) {
		const list = byDoc.get(clause.docType) ?? [];
		list.push(clause);
		byDoc.set(clause.docType, list);
	}

	const order: ContractDocType[] = ['agreement', 'sow', 'addendum'];
	const documents: AssembledDocument[] = [];
	const unresolved = new Set<string>();

	for (const docType of order) {
		const docClauses = byDoc.get(docType);
		if (!docClauses?.length) continue;

		documents.push({
			docType,
			title: DOC_TITLES[docType],
			clauses: docClauses.map((clause) => {
				const body = resolveTemplate(clause.body, variables);
				for (const token of findUnresolvedTokens(body)) unresolved.add(token);
				return {
					sectionNumber: clause.sectionNumber,
					title: resolveTemplate(clause.title, variables),
					body
				};
			})
		});
	}

	return {
		documents,
		variables,
		missing: [...missingRequiredVariables(variables), ...unresolved]
	};
}
