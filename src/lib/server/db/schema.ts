import { relations } from 'drizzle-orm';
import { integer, sqliteTable, text } from 'drizzle-orm/sqlite-core';
import type { QuestionCategory } from '$lib/categories';
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
		.$defaultFn(() => crypto.randomUUID()),
	company: text('company').notNull(),
	contactName: text('contact_name').notNull(),
	email: text('email').notNull(),
	phone: text('phone'),
	services: text('services', { mode: 'json' }).$type<string[]>().notNull().default([]),
	createdAt: integer('created_at', { mode: 'timestamp' })
		.notNull()
		.$defaultFn(() => new Date())
});

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
		.$defaultFn(() => crypto.randomUUID()),
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
	assignments: many(assignments)
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
