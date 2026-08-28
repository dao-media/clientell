import { relations } from 'drizzle-orm';
import { integer, sqliteTable, text, uniqueIndex } from 'drizzle-orm/sqlite-core';
import type { QuestionCategory } from '$lib/categories';
import type {
	ConfidentialityTier,
	ContractClauseType,
	ContractDeliverable,
	ContractDocType,
	ContractMilestone,
	ContractModuleKey,
	ContractServiceOwnership,
	ContractStatus,
	RemainingStructure,
	ThirdPartyOption
} from '$lib/contract/types';
import { createClauseId, createClientId, createContractId, createQuestionId } from '$lib/ids';
import type { QuestionInputRestriction } from '$lib/question-restrictions';

export const questionTypes = [
	'text',
	'textarea',
	'email',
	'url',
	'number',
	'select',
	'checkbox'
] as const;

export type QuestionType = (typeof questionTypes)[number];
export type ResponseStatus = 'draft' | 'submitted';

export const clients = sqliteTable('clients', {
	id: text('id')
		.primaryKey()
		.$defaultFn(() => createClientId()),
	company: text('company').notNull(),
	contactName: text('contact_name').notNull(),
	email: text('email').notNull(),
	phone: text('phone'),
	services: text('services', { mode: 'json' }).$type<string[]>().notNull().default([]),
	legalName: text('legal_name'),
	entityType: text('entity_type'),
	entityState: text('entity_state'),
	createdAt: integer('created_at', { mode: 'timestamp' })
		.notNull()
		.$defaultFn(() => new Date())
});

export const clauses = sqliteTable('clauses', {
	id: text('id')
		.primaryKey()
		.$defaultFn(() => createClauseId()),
	sectionNumber: text('section_number').notNull(),
	title: text('title').notNull(),
	body: text('body').notNull(),
	docType: text('doc_type').$type<ContractDocType>().notNull(),
	clauseType: text('clause_type').$type<ContractClauseType>().notNull(),
	moduleKey: text('module_key').$type<ContractModuleKey | null>(),
	sortOrder: integer('sort_order').notNull().default(0),
	isActive: integer('is_active', { mode: 'boolean' }).notNull().default(true)
});

export const contracts = sqliteTable(
	'contracts',
	{
		id: text('id')
			.primaryKey()
			.$defaultFn(() => createContractId()),
		clientId: text('client_id')
			.notNull()
			.references(() => clients.id, { onDelete: 'cascade' }),
		projectName: text('project_name').notNull(),
		description: text('description'),
		deliverables: text('deliverables', { mode: 'json' })
			.$type<ContractDeliverable[]>()
			.notNull()
			.default([]),
		outOfScope: text('out_of_scope', { mode: 'json' }).$type<string[]>().notNull().default([]),
		approvalStages: text('approval_stages', { mode: 'json' })
			.$type<string[]>()
			.notNull()
			.default([]),
		milestones: text('milestones', { mode: 'json' })
			.$type<ContractMilestone[]>()
			.notNull()
			.default([]),
		estimatedStart: integer('estimated_start', { mode: 'timestamp' }),
		baseFee: integer('base_fee').notNull().default(0),
		overageRate: integer('overage_rate').notNull().default(6500),
		remainingStructure: text('remaining_structure')
			.$type<RemainingStructure>()
			.notNull()
			.default('single'),
		thirdPartyOption: text('third_party_option').$type<ThirdPartyOption | null>(),
		handlingPct: integer('handling_pct').notNull().default(12),
		perItemThreshold: integer('per_item_threshold').notNull().default(10000),
		serviceOwnership: text('service_ownership', { mode: 'json' })
			.$type<ContractServiceOwnership[]>()
			.notNull()
			.default([]),
		personalGuarantee: integer('personal_guarantee', { mode: 'boolean' }).notNull().default(false),
		confidentiality: integer('confidentiality', { mode: 'boolean' }).notNull().default(false),
		confidentialityTier: integer('confidentiality_tier').$type<ConfidentialityTier | null>(),
		premiumPct: integer('premium_pct').notNull().default(0),
		premiumFloor: integer('premium_floor').notNull().default(75000),
		governingState: text('governing_state').notNull().default('West Virginia'),
		venueCounty: text('venue_county'),
		status: text('status').$type<ContractStatus>().notNull().default('draft'),
		createdAt: integer('created_at', { mode: 'timestamp' })
			.notNull()
			.$defaultFn(() => new Date()),
		sentAt: integer('sent_at', { mode: 'timestamp' }),
		signedAt: integer('signed_at', { mode: 'timestamp' }),
		clientSignature: text('client_signature'),
		designerSignature: text('designer_signature'),
		clientSignedAt: integer('client_signed_at', { mode: 'timestamp' }),
		designerSignedAt: integer('designer_signed_at', { mode: 'timestamp' }),
		pdfKey: text('pdf_key'),
		downloadToken: text('download_token')
	},
	(table) => [uniqueIndex('contracts_download_token_unique').on(table.downloadToken)]
);

export const questionSets = sqliteTable('question_sets', {
	id: text('id')
		.primaryKey()
		.$defaultFn(() => crypto.randomUUID()),
	title: text('title').notNull(),
	description: text('description'),
	categories: text('categories', { mode: 'json' }).$type<QuestionCategory[]>().notNull().default([]),
	createdAt: integer('created_at', { mode: 'timestamp' })
		.notNull()
		.$defaultFn(() => new Date()),
	updatedAt: integer('updated_at', { mode: 'timestamp' })
		.notNull()
		.$defaultFn(() => new Date())
});

export const questions = sqliteTable('questions', {
	id: text('id')
		.primaryKey()
		.$defaultFn(() => createQuestionId()),
	questionSetId: text('question_set_id')
		.notNull()
		.references(() => questionSets.id, { onDelete: 'cascade' }),
	sortOrder: integer('sort_order').notNull().default(0),
	type: text('type').$type<QuestionType>().notNull(),
	label: text('label').notNull(),
	helpText: text('help_text'),
	required: integer('required', { mode: 'boolean' }).notNull().default(false),
	options: text('options', { mode: 'json' }).$type<string[]>(),
	allowAttachments: integer('allow_attachments', { mode: 'boolean' }).notNull().default(false),
	inputRestriction: text('input_restriction').$type<QuestionInputRestriction | null>(),
	categories: text('categories', { mode: 'json' }).$type<string[]>().notNull().default([]),
	isActive: integer('is_active', { mode: 'boolean' }).notNull().default(true)
});

export const assignments = sqliteTable('assignments', {
	id: text('id')
		.primaryKey()
		.$defaultFn(() => crypto.randomUUID()),
	clientId: text('client_id')
		.notNull()
		.references(() => clients.id, { onDelete: 'cascade' }),
	questionSetId: text('question_set_id')
		.notNull()
		.references(() => questionSets.id),
	pinHash: text('pin_hash').notNull(),
	pinSalt: text('pin_salt').notNull(),
	pinMustChange: integer('pin_must_change', { mode: 'boolean' }).notNull().default(false),
	allowEditsAfterSubmit: integer('allow_edits_after_submit', { mode: 'boolean' })
		.notNull()
		.default(true),
	isActive: integer('is_active', { mode: 'boolean' }).notNull().default(true),
	invitationPin: text('invitation_pin'),
	sentAt: integer('sent_at', { mode: 'timestamp' }),
	categories: text('categories', { mode: 'json' }).$type<string[]>().notNull().default([]),
	createdAt: integer('created_at', { mode: 'timestamp' })
		.notNull()
		.$defaultFn(() => new Date())
});

export const responses = sqliteTable('responses', {
	id: text('id')
		.primaryKey()
		.$defaultFn(() => crypto.randomUUID()),
	assignmentId: text('assignment_id')
		.notNull()
		.references(() => assignments.id, { onDelete: 'cascade' })
		.unique(),
	answers: text('answers', { mode: 'json' }).$type<Record<string, unknown>>().notNull().default({}),
	status: text('status').$type<ResponseStatus>().notNull().default('draft'),
	submittedAt: integer('submitted_at', { mode: 'timestamp' }),
	updatedAt: integer('updated_at', { mode: 'timestamp' })
		.notNull()
		.$defaultFn(() => new Date())
});

export const clientsRelations = relations(clients, ({ many }) => ({
	assignments: many(assignments),
	contracts: many(contracts)
}));

export const contractsRelations = relations(contracts, ({ one }) => ({
	client: one(clients, {
		fields: [contracts.clientId],
		references: [clients.id]
	})
}));

export const questionSetsRelations = relations(questionSets, ({ many }) => ({
	questions: many(questions),
	assignments: many(assignments)
}));

export const questionsRelations = relations(questions, ({ one }) => ({
	questionSet: one(questionSets, {
		fields: [questions.questionSetId],
		references: [questionSets.id]
	})
}));

export const assignmentsRelations = relations(assignments, ({ one }) => ({
	client: one(clients, {
		fields: [assignments.clientId],
		references: [clients.id]
	}),
	questionSet: one(questionSets, {
		fields: [assignments.questionSetId],
		references: [questionSets.id]
	}),
	response: one(responses, {
		fields: [assignments.id],
		references: [responses.assignmentId]
	})
}));

export const responsesRelations = relations(responses, ({ one }) => ({
	assignment: one(assignments, {
		fields: [responses.assignmentId],
		references: [assignments.id]
	})
}));
