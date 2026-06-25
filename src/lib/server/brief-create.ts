import { eq } from 'drizzle-orm';
import {
	parseCategoriesFromFormData,
	validateBriefCategories,
	formatCategoryList
} from '$lib/categories';
import { generatePin, hashPin } from '$lib/server/auth/pin';
import { ensureBriefWorkspace } from '$lib/server/brief-workspace';
import { getPortalUrl } from '$lib/server/config';
import type { Database } from '$lib/server/db';
import { assignments, clients, responses } from '$lib/server/db/schema';

export type CreateBriefSuccess = {
	ok: true;
	assignmentId: string;
	pin: string;
	clientEmail: string;
	briefCategories: string;
	portalUrl: string;
};

export type CreateBriefFailure = {
	ok: false;
	status: number;
	error: string;
};

export type CreateBriefResult = CreateBriefSuccess | CreateBriefFailure;

export async function createBriefAssignment(
	db: Database,
	formData: FormData,
	platform: App.Platform | undefined
): Promise<CreateBriefResult> {
	const clientId = String(formData.get('clientId') ?? '');
	const allowEditsAfterSubmit = formData.get('allowEditsAfterSubmit') === 'on';
	const briefCategories = parseCategoriesFromFormData(formData);

	const workspace = await ensureBriefWorkspace(db);

	if (!clientId) {
		return { ok: false, status: 400, error: 'Client is required.' };
	}

	const [client] = await db.select().from(clients).where(eq(clients.id, clientId)).limit(1);

	if (!client) {
		return { ok: false, status: 400, error: 'Invalid client.' };
	}

	const categoryError = validateBriefCategories(briefCategories, workspace.categories);
	if (categoryError) {
		return { ok: false, status: 400, error: categoryError };
	}

	const pin = generatePin();
	const { hash, salt } = await hashPin(pin);

	const [assignment] = await db
		.insert(assignments)
		.values({
			clientId,
			questionSetId: workspace.id,
			pinHash: hash,
			pinSalt: salt,
			pinMustChange: true,
			invitationPin: pin,
			allowEditsAfterSubmit,
			categories: briefCategories
		})
		.returning({ id: assignments.id });

	await db.insert(responses).values({
		assignmentId: assignment.id,
		answers: {},
		status: 'draft'
	});

	const categoriesLabel = formatCategoryList(briefCategories, workspace.categories);

	return {
		ok: true,
		assignmentId: assignment.id,
		pin,
		clientEmail: client.email,
		briefCategories: categoriesLabel,
		portalUrl: getPortalUrl(platform)
	};
}
