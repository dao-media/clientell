/** Opaque unique id — never derived from email, names, or other user-visible fields. */
export function createEntityId(): string {
	return crypto.randomUUID();
}

export const createClientId = createEntityId;
export const createCategoryId = createEntityId;
export const createQuestionId = createEntityId;
export const createClauseId = createEntityId;
export const createContractId = createEntityId;
