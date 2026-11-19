import { DurableObject } from 'cloudflare:workers';

/**
 * One instance per sandbox visitor session (idFromName(sessionId)).
 * Exposes a tiny D1-like RPC surface the ClienTell app wraps in a D1Database shim,
 * so the normal Drizzle code runs unchanged against a private, throwaway SQLite DB.
 */

export type SandboxStatement = { sql: string; params: unknown[] };
export type SandboxMode = 'all' | 'raw' | 'run';
export type SandboxResult = {
	columns: string[];
	rows: unknown[][];
	changes: number;
	lastRowId: number | null;
};

const META_TABLE = '_sandbox_meta';
const MAX_TTL_MS = 30 * 24 * 60 * 60 * 1000;

export class SandboxDatabase extends DurableObject {
	private get sql() {
		return this.ctx.storage.sql;
	}

	private execOne(statement: SandboxStatement): SandboxResult {
		const cursor = this.sql.exec(statement.sql, ...statement.params.map(normalizeParam));
		const rows = [...cursor.raw()];
		const lastRowId = /^\s*insert/i.test(statement.sql)
			? Number(this.sql.exec('SELECT last_insert_rowid() AS id').one().id)
			: null;
		return { columns: cursor.columnNames, rows, changes: cursor.rowsWritten, lastRowId };
	}

	/** Report whether the schema + seed exist, and push the idle-expiry alarm forward. */
	async status(ttlMs: number, version: string): Promise<{ ready: boolean }> {
		await this.ctx.storage.setAlarm(Date.now() + Math.min(Math.max(ttlMs, 60_000), MAX_TTL_MS));
		const table = this.sql
			.exec(`SELECT name FROM sqlite_master WHERE type = 'table' AND name = ?`, META_TABLE)
			.toArray();
		if (table.length === 0) return { ready: false };
		const row = this.sql.exec(`SELECT value FROM ${META_TABLE} WHERE key = 'version'`).toArray()[0];
		return { ready: row?.value === version };
	}

	/** Build schema and seed atomically. Safe to call twice; the second call is a no-op. */
	async initialize(version: string, migrations: string[], seed: SandboxStatement[]) {
		const current = await this.status(24 * 60 * 60 * 1000, version);
		if (current.ready) return { initialized: false };

		// Version bump (new migrations/seed): start from a clean slate.
		const hasTables =
			this.sql
				.exec(`SELECT name FROM sqlite_master WHERE type = 'table' AND name NOT LIKE 'sqlite_%' AND name NOT LIKE '_cf_%'`)
				.toArray().length > 0;
		if (hasTables) {
			await this.ctx.storage.deleteAll();
			await this.ctx.storage.setAlarm(Date.now() + 24 * 60 * 60 * 1000);
		}

		this.ctx.storage.transactionSync(() => {
			for (const chunk of migrations) {
				if (chunk.trim()) this.sql.exec(chunk);
			}
			for (const statement of seed) this.execOne(statement);
			this.sql.exec(`CREATE TABLE ${META_TABLE} (key TEXT PRIMARY KEY, value TEXT)`);
			this.sql.exec(`INSERT INTO ${META_TABLE} (key, value) VALUES ('version', ?)`, version);
		});
		return { initialized: true };
	}

	async query(statement: SandboxStatement): Promise<SandboxResult> {
		return this.execOne(statement);
	}

	async batch(statements: SandboxStatement[]): Promise<SandboxResult[]> {
		return this.ctx.storage.transactionSync(() => statements.map((s) => this.execOne(s)));
	}

	/** Wipe this visitor's sandbox now ("Start over"). */
	async destroy() {
		await this.ctx.storage.deleteAlarm();
		await this.ctx.storage.deleteAll();
	}

	async alarm() {
		await this.ctx.storage.deleteAll();
	}
}

function normalizeParam(value: unknown) {
	if (value === undefined) return null;
	if (typeof value === 'boolean') return value ? 1 : 0;
	if (value instanceof Date) return Math.floor(value.getTime() / 1000);
	return value as string | number | null | ArrayBuffer;
}

export default {
	fetch() {
		return new Response('ClienTell sandbox store', { status: 404 });
	}
} satisfies ExportedHandler;
