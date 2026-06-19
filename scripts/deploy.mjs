import { spawnSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const wrangler = path.join(root, 'node_modules/wrangler/bin/wrangler.js');

function run(args) {
	const result = spawnSync(process.execPath, args, { cwd: root, stdio: 'inherit' });
	if (result.status !== 0) {
		process.exit(result.status ?? 1);
	}
}

run([path.join(root, 'scripts/build.mjs')]);
run([
	wrangler,
	'pages',
	'deploy',
	'.svelte-kit/cloudflare',
	'--project-name=briefly'
]);
