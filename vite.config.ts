import fs from 'node:fs';
import tailwindcss from '@tailwindcss/vite';
import adapter from '@sveltejs/adapter-cloudflare';
import { sveltekit } from '@sveltejs/kit/vite';
import basicSsl from '@vitejs/plugin-basic-ssl';
import { defineConfig, type Plugin } from 'vite';

/** Inline WOFF bytes so Cloudflare Workers can embed Inter / Space Grotesk without fs. */
function pdfFontPlugin(): Plugin {
	return {
		name: 'pdf-font',
		enforce: 'pre',
		async resolveId(source, importer) {
			if (!source.includes('?pdf-font')) return;
			const bare = source.slice(0, source.indexOf('?pdf-font'));
			const resolved = await this.resolve(bare, importer, { skipSelf: true });
			if (!resolved) return;
			return `${resolved.id}?pdf-font`;
		},
		load(id) {
			const marker = id.indexOf('?pdf-font');
			if (marker === -1) return;
			const file = id.slice(0, marker);
			const b64 = fs.readFileSync(file).toString('base64');
			return `export default Uint8Array.from(atob(${JSON.stringify(b64)}), (c) => c.charCodeAt(0));`;
		}
	};
}

/** `CLIENTELL_WRANGLER_CONFIG=wrangler.sandbox.jsonc` builds/runs the portfolio sandbox. */
const wranglerConfig = process.env.CLIENTELL_WRANGLER_CONFIG || undefined;
/** `CLIENTELL_HTTP=1` serves plain http (for embedded preview browsers that reject the dev cert). */
const useHttps = process.env.CLIENTELL_HTTP !== '1';
/** Deploy base path. Main = '' (domain root); sandbox = '/clientell' (sandbox.daneoleary.com/clientell). */
const rawBase = (process.env.CLIENTELL_BASE_PATH ?? '').trim().replace(/\/+$/, '');
if (rawBase && !rawBase.startsWith('/')) {
	throw new Error(`CLIENTELL_BASE_PATH must start with "/" (got "${rawBase}")`);
}
const basePath = rawBase as '' | `/${string}`;

export default defineConfig(({ command }) => ({
	plugins: [
		pdfFontPlugin(),
		...(command === 'serve' && useHttps ? [basicSsl()] : []),
		tailwindcss(),
		sveltekit({
			adapter: adapter(
				wranglerConfig
					? {
							config: wranglerConfig,
							platformProxy: {
								configPath: wranglerConfig,
								// Separate state dir so it doesn't lock the store worker's SQLite files.
								persist: { path: '.wrangler/sandbox-app' }
							}
						}
					: {}
			),
			// Absolute base everywhere (no SSR-relative '../' links) so cookies/redirects agree.
			paths: { base: basePath, relative: false },
			compilerOptions: {
				// Force runes mode for the project, except for libraries. Can be removed in svelte 6.
				runes: ({ filename }) => (filename.split(/[/\\]/).includes('node_modules') ? undefined : true)
			},
			typescript: {
				config: (config) => ({
					...config,
					include: [...config.include, '../drizzle.config.ts']
				})
			}
		})
	],
	server: {
		// Browsers and IDE previews often open https://localhost; basicSsl serves a local cert.
		host: 'localhost',
		port: Number(process.env.PORT) || 5173,
		// BrandLogo imports SVGs from /brand; SvelteKit's default fs.allow doesn't include it.
		fs: { allow: ['brand'] },
		strictPort: false
	},
	ssr: {
		noExternal: ['@pdf-lib/fontkit', 'pdf-lib']
	}
}));
