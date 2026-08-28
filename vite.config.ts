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

export default defineConfig(({ command }) => ({
	plugins: [
		pdfFontPlugin(),
		...(command === 'serve' ? [basicSsl()] : []),
		tailwindcss(),
		sveltekit({
			adapter: adapter(),
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
		https: command === 'serve',
		host: 'localhost',
		port: 5173,
		strictPort: false
	},
	ssr: {
		noExternal: ['@pdf-lib/fontkit', 'pdf-lib']
	}
}));
