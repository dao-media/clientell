// See https://svelte.dev/docs/kit/types#app.d.ts
// for information about these interfaces
declare global {
	namespace App {
		interface Platform {
			env: Env;
			ctx: ExecutionContext;
			caches: CacheStorage;
			cf?: IncomingRequestCfProperties;
		}

		interface Locals {
			db: import('$lib/server/db').Database;
			admin?: import('$lib/server/auth/session').AdminSession;
			client?: import('$lib/server/auth/session').ClientSession;
		}
	}
}

export {};
