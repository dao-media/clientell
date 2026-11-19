import { drizzle } from 'drizzle-orm/d1';
import { CLAUSE_SEEDS } from '$lib/contract/clause-seed';
import { createCategoryId, createClauseId, createClientId, createContractId, createQuestionId } from '$lib/ids';
import { hashPin } from '$lib/server/auth/pin';
import * as schema from '$lib/server/db/schema';
import { SANDBOX_CLIENT_EMAIL, SANDBOX_CLIENT_PIN } from './mode';
import type { SandboxStatement } from './d1-shim';

/** Bump when seed content changes so existing visitor sandboxes rebuild. */
const SEED_VERSION = 'seed-3';

const migrationFiles = import.meta.glob('/drizzle/migrations/*.sql', {
	query: '?raw',
	import: 'default',
	eager: true
}) as Record<string, string>;

const migrationNames = Object.keys(migrationFiles).sort();

export const SANDBOX_SCHEMA_VERSION = `${SEED_VERSION}:${migrationNames.length}:${migrationNames.at(-1) ?? ''}`;

export function sandboxMigrations(): string[] {
	return migrationNames.flatMap((name) =>
		migrationFiles[name]
			.split('--> statement-breakpoint')
			.map((chunk) => chunk.trim())
			.filter(Boolean)
	);
}

/** D1 stand-in that records statements instead of executing them. */
function recorder() {
	const statements: SandboxStatement[] = [];
	const stmt = (sql: string, params: unknown[] = []) => ({
		bind: (...p: unknown[]) => stmt(sql, p),
		run: async () => {
			statements.push({ sql, params });
			return { success: true, results: [], meta: {} };
		},
		all: async () => {
			statements.push({ sql, params });
			return { success: true, results: [], meta: {} };
		},
		raw: async () => {
			statements.push({ sql, params });
			return [];
		}
	});
	const d1 = { prepare: (sql: string) => stmt(sql), batch: async () => [] };
	return { db: drizzle(d1 as unknown as D1Database, { schema }), statements };
}

const DAY = 24 * 60 * 60 * 1000;
const daysAgo = (n: number) => new Date(Date.now() - n * DAY);

type QuestionSeed = {
	key: string;
	label: string;
	type: schema.QuestionType;
	helpText?: string;
	options?: string[];
	required?: boolean;
	category?: 'brand' | 'web' | 'social';
};

const QUESTIONS: QuestionSeed[] = [
	{ key: 'goal', label: 'What does success look like for this project?', type: 'textarea', required: true },
	{ key: 'audience', label: 'Who is your primary audience?', type: 'textarea', required: true },
	{ key: 'competitors', label: 'Which brands do you admire or compete with?', type: 'textarea' },
	{ key: 'timeline', label: 'Ideal launch date', type: 'text', helpText: 'A month is fine.' },
	{ key: 'budget', label: 'Budget range', type: 'select', options: ['Under $10k', '$10k–$25k', '$25k–$50k', '$50k+'] },
	{ key: 'personality', label: 'Describe your brand personality in three words', type: 'text', category: 'brand' },
	{ key: 'logoKeep', label: 'Is there anything in your current identity we must keep?', type: 'textarea', category: 'brand' },
	{ key: 'pages', label: 'Which pages does the site need?', type: 'textarea', category: 'web' },
	{ key: 'cms', label: 'Who will update the site after launch?', type: 'text', category: 'web' },
	{ key: 'channels', label: 'Which social channels matter most?', type: 'checkbox', options: ['Instagram', 'TikTok', 'LinkedIn', 'YouTube'], category: 'social' }
];

type ClientSeed = {
	company: string;
	legalName: string;
	contactName: string;
	email: string;
	phone: string;
	categories: Array<'brand' | 'web' | 'social'>;
	title: string;
	/** How many applicable questions are answered; 'submitted' = all + submitted. */
	answered: number | 'submitted';
	sentDaysAgo: number;
	contract?: { project: string; fee: number; status: 'draft' | 'sent'; sentDaysAgo?: number };
	extraBrief?: { categories: Array<'brand' | 'web' | 'social'>; answered: number | 'submitted'; sentDaysAgo: number };
};

const CLIENTS: ClientSeed[] = [
	{ company: 'Figma', legalName: 'Figma, Inc.', contactName: 'Avery Chen', email: SANDBOX_CLIENT_EMAIL, phone: '(415) 555-0142', categories: ['brand', 'web'], title: 'Config microsite refresh', answered: 6, sentDaysAgo: 9, contract: { project: 'Config 2027 microsite', fee: 1850000, status: 'sent', sentDaysAgo: 3 }, extraBrief: { categories: ['social'], answered: 'submitted', sentDaysAgo: 30 } },
	{ company: 'Apple', legalName: 'Apple Inc.', contactName: 'Jordan Ellis', email: 'jordan@apple.example', phone: '(408) 555-0119', categories: ['web'], title: 'Education landing pages', answered: 'submitted', sentDaysAgo: 21, contract: { project: 'Apple Education pages', fee: 3200000, status: 'sent', sentDaysAgo: 12 } },
	{ company: 'Nike', legalName: 'Nike, Inc.', contactName: 'Sam Rivera', email: 'sam@nike.example', phone: '(503) 555-0173', categories: ['brand', 'social'], title: 'Run club identity', answered: 4, sentDaysAgo: 6, contract: { project: 'Run Club identity system', fee: 2400000, status: 'draft' } },
	{ company: 'Spotify', legalName: 'Spotify USA Inc.', contactName: 'Priya Natarajan', email: 'priya@spotify.example', phone: '(212) 555-0161', categories: ['social'], title: 'Wrapped social kit', answered: 2, sentDaysAgo: 4 },
	{ company: 'Airbnb', legalName: 'Airbnb, Inc.', contactName: 'Marcus Lee', email: 'marcus@airbnb.example', phone: '(415) 555-0188', categories: ['brand', 'web', 'social'], title: 'Host community hub', answered: 0, sentDaysAgo: 2 },
	{ company: 'Stripe', legalName: 'Stripe, Inc.', contactName: 'Elena Volkova', email: 'elena@stripe.example', phone: '(415) 555-0104', categories: ['web'], title: 'Docs onboarding flow', answered: 'submitted', sentDaysAgo: 18, contract: { project: 'Docs onboarding redesign', fee: 2750000, status: 'sent', sentDaysAgo: 8 } },
	{ company: 'Notion', legalName: 'Notion Labs, Inc.', contactName: 'Theo Park', email: 'theo@notion.example', phone: '(628) 555-0137', categories: ['brand'], title: 'Template gallery art direction', answered: 5, sentDaysAgo: 11 },
	{ company: 'Patagonia', legalName: 'Patagonia, Inc.', contactName: 'June Alvarez', email: 'june@patagonia.example', phone: '(805) 555-0155', categories: ['brand', 'web'], title: 'Worn Wear campaign site', answered: 1, sentDaysAgo: 3 },
	{ company: 'LEGO', legalName: 'LEGO Systems, Inc.', contactName: 'Nils Andersen', email: 'nils@lego.example', phone: '(860) 555-0126', categories: ['social'], title: 'Adult builders social series', answered: 'submitted', sentDaysAgo: 25, contract: { project: 'Adult builders social series', fee: 1500000, status: 'draft' } },
	{ company: 'Duolingo', legalName: 'Duolingo, Inc.', contactName: 'Maya Brooks', email: 'maya@duolingo.example', phone: '(412) 555-0190', categories: ['brand', 'social'], title: 'Mascot motion guidelines', answered: 3, sentDaysAgo: 7 }
];

const SAMPLE_ANSWERS: Record<string, string | boolean> = {
	goal: 'A clear, on-brand experience that converts first-time visitors and is easy for our team to maintain.',
	audience: 'Design-savvy professionals, 25–45, who discover us through social and word of mouth.',
	competitors: 'We admire how Linear and Arc tell product stories — confident, minimal, a little playful.',
	timeline: 'Late spring',
	budget: '$25k–$50k',
	personality: 'Bold, warm, precise',
	logoKeep: 'Keep the wordmark and primary color; everything else is open.',
	pages: 'Home, About, Programs, Stories, FAQ, Contact',
	cms: 'Our marketing coordinator, weekly',
	channels: 'Instagram'
};

export async function buildSandboxSeed(): Promise<SandboxStatement[]> {
	const { db, statements } = recorder();

	// One row per statement: Durable Object SQLite caps bound parameters per query.
	for (const seed of CLAUSE_SEEDS) {
		await db.insert(schema.clauses).values({
			id: createClauseId(),
			sectionNumber: seed.sectionNumber,
			title: seed.title,
			body: seed.body,
			docType: seed.docType,
			clauseType: seed.clauseType,
			moduleKey: seed.moduleKey,
			sortOrder: seed.sortOrder,
			isActive: true
		}).run();
	}

	const categoryIds = { brand: createCategoryId(), web: createCategoryId(), social: createCategoryId() };
	const setId = crypto.randomUUID();
	await db.insert(schema.questionSets).values({
		id: setId,
		title: 'Creative discovery brief',
		description: 'Our standard kickoff questions. Only the sections for the services you booked appear.',
		categories: [
			{ id: categoryIds.brand, name: 'Brand identity', color: '#8a3ffc' },
			{ id: categoryIds.web, name: 'Website', color: '#0f62fe' },
			{ id: categoryIds.social, name: 'Social', color: '#198038' }
		],
		createdAt: daysAgo(45),
		updatedAt: daysAgo(45)
	}).run();

	const questionIds: Record<string, string> = {};
	for (const [index, q] of QUESTIONS.entries()) {
		const id = createQuestionId();
		questionIds[q.key] = id;
		await db.insert(schema.questions).values({
				id,
				questionSetId: setId,
				sortOrder: index,
				type: q.type,
				label: q.label,
				helpText: q.helpText ?? null,
				required: q.required ?? false,
				options: q.options ?? null,
			categories: q.category ? [categoryIds[q.category]] : [],
			isActive: true
		}).run();
	}

	// One hash for every demo brief keeps seeding fast; the PIN is printed on the splash page.
	const pin = await hashPin(SANDBOX_CLIENT_PIN);

	async function addBrief(
		clientId: string,
		cats: Array<'brand' | 'web' | 'social'>,
		answered: number | 'submitted',
		sentDaysAgo: number
	) {
		const applicable = QUESTIONS.filter((q) => !q.category || cats.includes(q.category));
		const count = answered === 'submitted' ? applicable.length : Math.min(answered, applicable.length);
		const answers = Object.fromEntries(
			applicable.slice(0, count).map((q) => [questionIds[q.key], SAMPLE_ANSWERS[q.key]])
		);
		const assignmentId = crypto.randomUUID();
		await db.insert(schema.assignments).values({
			id: assignmentId,
			clientId,
			questionSetId: setId,
			pinHash: pin.hash,
			pinSalt: pin.salt,
			pinMustChange: false,
			categories: cats.map((c) => categoryIds[c]),
			sentAt: daysAgo(sentDaysAgo),
			createdAt: daysAgo(sentDaysAgo)
		}).run();
		await db.insert(schema.responses).values({
			assignmentId,
			answers,
			status: answered === 'submitted' ? 'submitted' : 'draft',
			submittedAt: answered === 'submitted' ? daysAgo(Math.max(0, sentDaysAgo - 3)) : null,
			updatedAt: daysAgo(Math.max(0, sentDaysAgo - 1))
		}).run();
	}

	for (const [index, seed] of CLIENTS.entries()) {
		const clientId = createClientId();
		await db.insert(schema.clients).values({
			id: clientId,
			company: seed.company,
			legalName: seed.legalName,
			entityType: 'corporation',
			entityState: 'Delaware',
			contactName: seed.contactName,
			email: seed.email,
			phone: seed.phone,
			services: seed.categories.map((c) => categoryIds[c]),
			createdAt: daysAgo(40 - index)
		}).run();

		await addBrief(clientId, seed.categories, seed.answered, seed.sentDaysAgo);
		if (seed.extraBrief) {
			await addBrief(clientId, seed.extraBrief.categories, seed.extraBrief.answered, seed.extraBrief.sentDaysAgo);
		}

		if (seed.contract) {
			const sent = seed.contract.status === 'sent';
			await db.insert(schema.contracts).values({
				id: createContractId(),
				clientId,
				projectName: seed.contract.project,
				description: `Design and production for ${seed.contract.project}, per the discovery brief.`,
				deliverables: [
					{ name: 'Concept directions', includedRevisionRounds: 2 },
					{ name: 'Final design system', includedRevisionRounds: 2 },
					{ name: 'Production handoff', includedRevisionRounds: 1 }
				],
				outOfScope: ['Copywriting', 'Paid media'],
				approvalStages: ['Concepts', 'Design', 'Final files'],
				milestones: [
					{ label: 'Kickoff', targetDate: '' },
					{ label: 'Concept review', targetDate: '' },
					{ label: 'Launch', targetDate: '' }
				],
				estimatedStart: daysAgo(-14),
				baseFee: seed.contract.fee,
				status: seed.contract.status,
				createdAt: daysAgo((seed.contract.sentDaysAgo ?? 2) + 2),
				sentAt: sent ? daysAgo(seed.contract.sentDaysAgo ?? 1) : null,
				downloadToken: sent ? crypto.randomUUID() : null
			}).run();
		}
	}

	return statements;
}
