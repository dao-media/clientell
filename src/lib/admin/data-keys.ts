export const adminDataKeys = {
	clients: 'briefly:clients',
	questions: 'briefly:questions',
	dashboard: 'briefly:dashboard'
} as const;

export type AdminDataKey = (typeof adminDataKeys)[keyof typeof adminDataKeys];
