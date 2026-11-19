// Portfolio sandbox helper: `node scripts/sandbox.mjs <dev|store|build|deploy>`
// The sandbox is the same app built against wrangler.sandbox.jsonc (no D1, SANDBOX_MODE=1)
// plus the clientell-sandbox-store worker that holds one private SQLite DB per visitor.
import { spawn, spawnSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const wrangler = path.join(root, 'node_modules/wrangler/bin/wrangler.js');
const vite = path.join(root, 'node_modules/vite/bin/vite.js');
// Served at https://sandbox.daneoleary.com/clientell — override with CLIENTELL_BASE_PATH.
const env = {
	...process.env,
	CLIENTELL_WRANGLER_CONFIG: 'wrangler.sandbox.jsonc',
	CLIENTELL_BASE_PATH: process.env.CLIENTELL_BASE_PATH ?? '/clientell'
};

function run(args, extraEnv = env) {
	const result = spawnSync(process.execPath, args, { cwd: root, stdio: 'inherit', env: extraEnv });
	if (result.status !== 0) process.exit(result.status ?? 1);
}

const command = process.argv[2];

if (command === 'store') {
	// Local Durable Object host. Leave running while using `sandbox:dev`.
	run([wrangler, 'dev', '-c', 'sandbox-store/wrangler.jsonc', '--port', process.env.STORE_PORT ?? '8799', '--persist-to', '.wrangler/sandbox-store']);
} else if (command === 'dev') {
	// Runs the store and the app together; Ctrl+C stops both.
	const store = spawn(
		process.execPath,
		[wrangler, 'dev', '-c', 'sandbox-store/wrangler.jsonc', '--port', process.env.STORE_PORT ?? '8799', '--persist-to', '.wrangler/sandbox-store'],
		{ cwd: root, stdio: ['ignore', 'inherit', 'inherit'], env: process.env }
	);
	const stop = () => store.kill();
	process.on('exit', stop);
	process.on('SIGINT', () => process.exit(130));
	process.on('SIGTERM', () => process.exit(143));
	// Give the store a moment to register with the local dev registry.
	await new Promise((resolve) => setTimeout(resolve, 2500));
	console.log(`\nClienTell sandbox dev server (SANDBOX_MODE=1) at ${env.CLIENTELL_BASE_PATH}/\n`);
	run([vite, 'dev']);
} else if (command === 'build') {
	run([vite, 'build']);
} else if (command === 'deploy') {
	run([wrangler, 'deploy', '-c', 'sandbox-store/wrangler.jsonc'], process.env);
	run([vite, 'build']);
	run([wrangler, 'deploy', '-c', 'wrangler.sandbox.jsonc']);
} else {
	console.error('Usage: node scripts/sandbox.mjs <dev|store|build|deploy>');
	process.exit(1);
}
