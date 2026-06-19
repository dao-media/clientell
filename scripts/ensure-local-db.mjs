import { spawnSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const nodeMajor = Number.parseInt(process.versions.node.split('.')[0], 10);

if (nodeMajor < 22) {
	console.error(
		`\nBriefly requires Node.js 22+ for Wrangler and local D1.\n` +
			`This script is running on ${process.version}.\n\n` +
			'Run commands through Volta (already configured in package.json):\n' +
			'  npm run dev\n\n' +
			'If that still fails, install the pinned toolchain once:\n' +
			'  volta install node@22.12.0\n\n' +
			'Volta only switches Node inside this project — it does not replace your global Node 20.\n'
	);
	process.exit(1);
}

const wrangler = path.join(root, 'node_modules/wrangler/bin/wrangler.js');
const migrate = spawnSync(
	process.execPath,
	[wrangler, 'd1', 'migrations', 'apply', 'briefly-db', '--local'],
	{ cwd: root, stdio: 'inherit' }
);

if (migrate.status !== 0) {
	console.error(
		'\nLocal database migration failed. Fix the error above, then run:\n  npm run db:migrate:local\n'
	);
	process.exit(migrate.status ?? 1);
}
