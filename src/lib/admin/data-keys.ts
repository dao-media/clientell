export const adminDataKeys = {
	clients: 'briefly:clients',
	questions: 'briefly:questions',
	dashboard: 'briefly:dashboard',
	contracts: 'briefly:contracts',
	clauses: 'briefly:clauses'
} as const;

export type AdminDataKey = (typeof adminDataKeys)[keyof typeof adminDataKeys];
