import { spawnSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));

function run(args) {
	const result = spawnSync(process.execPath, args, { cwd: root, stdio: 'inherit' });
	if (result.status !== 0) {
		process.exit(result.status ?? 1);
	}
}

run([path.join(root, 'scripts/ensure-local-db.mjs')]);
console.log('\nBriefly dev server: https://localhost:5173\n');
run([path.join(root, 'node_modules/vite/bin/vite.js'), 'dev']);
