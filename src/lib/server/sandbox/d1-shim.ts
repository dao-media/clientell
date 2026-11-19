/**
 * Minimal D1Database implementation backed by the sandbox Durable Object
 * (sandbox-store/). Covers exactly what drizzle-orm/d1 uses: prepare → bind →
 * all / raw / run / first, plus batch.
 */

export type SandboxStatement = { sql: string; params: unknown[] };
export type SandboxResult = {
	columns: string[];
	rows: unknown[][];
	changes: number;
	lastRowId: number | null;
};

export interface SandboxDatabaseStub {
	status(ttlMs: number, version: string): Promise<{ ready: boolean }>;
	initialize(
		version: string,
		migrations: string[],
		seed: SandboxStatement[]
	): Promise<{ initialized: boolean }>;
	query(statement: SandboxStatement): Promise<SandboxResult>;
	batch(statements: SandboxStatement[]): Promise<SandboxResult[]>;
	destroy(): Promise<void>;
}

function toObjects(result: SandboxResult): Record<string, unknown>[] {
	return result.rows.map((row) => {
		const obj: Record<string, unknown> = {};
		result.columns.forEach((column, i) => {
			obj[column] = row[i];
		});
		return obj;
	});
}

function d1Result(result: SandboxResult) {
	return {
		success: true,
		results: toObjects(result),
		meta: {
			changes: result.changes,
			last_row_id: result.lastRowId ?? 0,
			rows_written: result.changes,
			rows_read: result.rows.length,
			duration: 0,
			size_after: 0,
			changed_db: result.changes > 0
		}
	};
}

class ShimStatement {
	constructor(
		private readonly stub: SandboxDatabaseStub,
		readonly sql: string,
		readonly params: unknown[] = []
	) {}

	bind(...params: unknown[]) {
		return new ShimStatement(this.stub, this.sql, params);
	}

	toStatement(): SandboxStatement {
		return { sql: this.sql, params: this.params.map((p) => (p === undefined ? null : p)) };
	}

	async all() {
		return d1Result(await this.stub.query(this.toStatement()));
	}

	async run() {
		return d1Result(await this.stub.query(this.toStatement()));
	}

	async raw(options?: { columnNames?: boolean }) {
		const result = await this.stub.query(this.toStatement());
		return options?.columnNames ? [result.columns, ...result.rows] : result.rows;
	}

	async first(column?: string) {
		const [row] = toObjects(await this.stub.query(this.toStatement()));
		if (!row) return null;
		return column ? (row[column] ?? null) : row;
	}
}

export function createSandboxD1(stub: SandboxDatabaseStub): D1Database {
	const db = {
		prepare: (sql: string) => new ShimStatement(stub, sql),
		batch: async (statements: ShimStatement[]) =>
			(await stub.batch(statements.map((s) => s.toStatement()))).map(d1Result),
		exec: async (sql: string) => {
			const result = await stub.query({ sql, params: [] });
			return { count: 1, duration: 0, ...result };
		},
		dump: async () => {
			throw new Error('dump() is not supported in the sandbox.');
		},
		withSession: () => db
	};
	return db as unknown as D1Database;
}
