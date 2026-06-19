export type SubmissionDetail = {
	assignment: {
		id: string;
		isActive: boolean;
		sentAt: string | null;
		canSendBrief: boolean;
		createdAt: string;
	};
	client: {
		company: string;
		contactName: string;
		email: string;
		phone: string | null;
	};
	questionSet: {
		title: string;
		description: string | null;
	};
	response: {
		status: 'draft' | 'submitted';
		answers: Record<string, unknown>;
		updatedAt: string | null;
		submittedAt: string | null;
	} | null;
	questions: Array<{
		id: string;
		label: string;
		helpText: string | null;
		allowAttachments: boolean;
	}>;
	briefCategories: string[];
	setCategories: import('$lib/categories').QuestionCategory[];
	progress: number;
};

export type ClientBriefSummary = {
	id: string;
	categoriesLabel: string;
	status: 'draft' | 'submitted' | null;
	progress: number;
	isActive: boolean;
	createdAt: string;
	updatedAt: string | null;
	answerPreview: string;
};

export async function fetchSubmissionDetail(id: string): Promise<SubmissionDetail> {
	const response = await fetch(`/admin/submissions/${id}/detail`);
	if (!response.ok) {
		throw new Error('Could not load submission.');
	}
	return (await response.json()) as SubmissionDetail;
}

export async function fetchClientBriefs(clientId: string): Promise<ClientBriefSummary[]> {
	const response = await fetch(`/admin/clients/${clientId}/briefs`);
	if (!response.ok) {
		throw new Error('Could not load briefs.');
	}
	return (await response.json()) as ClientBriefSummary[];
}
