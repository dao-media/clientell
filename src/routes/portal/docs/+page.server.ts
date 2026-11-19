import { error, fail, redirect } from '@sveltejs/kit';
import { and, desc, eq, ne } from 'drizzle-orm';
import { requireClient } from '$lib/server/auth/guard';
import { redirectClientIfPinChangeRequired } from '$lib/server/auth/portal-login';
import { switchClientAssignment } from '$lib/server/auth/session';
import { ensureDownloadToken } from '$lib/server/contract/store';
import { assignments, clients, contracts } from '$lib/server/db/schema';
import { listSubmissions } from '$lib/server/submissions';
import type { Actions, PageServerLoad } from './$types';
import { base } from '$app/paths';
import { withBase } from '$lib/paths';

async function clientIdForSession(db: App.Locals['db'], assignmentId: string) {
	const [row] = await db
		.select({ clientId: assignments.clientId })
		.from(assignments)
		.where(eq(assignments.id, assignmentId))
		.limit(1);
	return row?.clientId ?? null;
}

function contractProgress(contract: { clientSignedAt: Date | null; designerSignedAt: Date | null }) {
	const signed = Number(Boolean(contract.clientSignedAt)) + Number(Boolean(contract.designerSignedAt));
	return Math.round((signed / 2) * 100);
}

export const load: PageServerLoad = async ({ locals, setHeaders }) => {
	setHeaders({ 'cache-control': 'private, no-store' });
	const session = requireClient(locals);
	await redirectClientIfPinChangeRequired(locals.db, session.assignmentId);

	const clientId = await clientIdForSession(locals.db, session.assignmentId);
	if (!clientId) error(404, 'This account is unavailable.');

	const [[client], briefs, contractRows] = await Promise.all([
		locals.db
			.select({ company: clients.company, contactName: clients.contactName })
			.from(clients)
			.where(eq(clients.id, clientId))
			.limit(1),
		listSubmissions(locals.db, { clientId }),
		locals.db
			.select()
			.from(contracts)
			.where(and(eq(contracts.clientId, clientId), ne(contracts.status, 'draft')))
			.orderBy(desc(contracts.createdAt))
	]);

	const contractDocs = await Promise.all(
		contractRows.map(async (contract) => ({
			id: contract.id,
			title: contract.projectName,
			status: contract.status,
			sentAt: contract.sentAt ?? contract.createdAt,
			clientSignedAt: contract.clientSignedAt,
			progress: contractProgress(contract),
			href: withBase(`/contracts/${contract.downloadToken ?? (await ensureDownloadToken(locals.db, contract.id))}`)
		}))
	);

	return {
		client,
		activeAssignmentId: session.assignmentId,
		briefs: briefs
			.filter((brief) => brief.isActive)
			.map((brief) => ({
				id: brief.id,
				title: brief.briefTitle,
				categoriesLabel: brief.categoriesLabel,
				status: brief.status ?? 'draft',
				progress: brief.status === 'submitted' ? 100 : brief.progress,
				sentAt: brief.sentAt ?? brief.createdAt,
				submittedAt: brief.submittedAt
			})),
		contracts: contractDocs
	};
};

export const actions: Actions = {
	openBrief: async ({ request, locals, cookies, url }) => {
		const session = requireClient(locals);
		const assignmentId = String((await request.formData()).get('assignmentId') ?? '');
		const clientId = await clientIdForSession(locals.db, session.assignmentId);

		const [target] = await locals.db
			.select({ id: assignments.id })
			.from(assignments)
			.where(
				and(
					eq(assignments.id, assignmentId),
					eq(assignments.clientId, clientId ?? ''),
					eq(assignments.isActive, true)
				)
			)
			.limit(1);
		if (!target) return fail(404, { error: 'That brief is unavailable.' });

		if (target.id !== session.assignmentId) {
			await switchClientAssignment(cookies, url, session, target.id, request);
		}
		redirect(303, `${base}/portal/brief`);
	}
};
