import { spawnSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));

if (process.env.DB_PUSH_OK !== '1') {
	console.error(
		'\ndb:push is disabled — drizzle-kit push can drop tables/columns and destroy data.\n\n' +
			'Safe schema workflow:\n' +
			'  1. Edit src/lib/server/db/schema.ts\n' +
			'  2. npm run db:generate\n' +
			'  3. npm run db:migrate:local\n' +
			'  4. npm run deploy  (applies pending remote migrations, then deploys)\n\n' +
			'Override only on an empty database: DB_PUSH_OK=1 npm run db:push\n'
	);
	process.exit(1);
}

const drizzleKit = path.join(root, 'node_modules/drizzle-kit/bin.cjs');
const result = spawnSync(process.execPath, [drizzleKit, 'push'], {
	cwd: root,
	stdio: 'inherit',
	env: process.env
});

process.exit(result.status ?? 1);
