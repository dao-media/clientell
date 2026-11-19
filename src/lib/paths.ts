import { base } from '$app/paths';

/**
 * Base-path helpers. Main deploys at the domain root (base = ''); the portfolio sandbox
 * is built with CLIENTELL_BASE_PATH=/clientell so it can live at sandbox.daneoleary.com/clientell.
 * Keep app paths base-free internally and apply the base only where a URL leaves the code.
 */

/** Prefix an app-absolute path ("/admin") with the deploy base ("/clientell/admin"). */
export function withBase(path: string): string {
	if (!path.startsWith('/') || path.startsWith('//')) return path;
	if (base && (path === base || path.startsWith(`${base}/`) || path.startsWith(`${base}?`))) return path;
	return `${base}${path}`;
}

/** Strip the deploy base from a request pathname so route checks stay base-agnostic. */
export function appPath(pathname: string): string {
	if (!base) return pathname;
	if (pathname === base) return '/';
	return pathname.startsWith(`${base}/`) ? pathname.slice(base.length) : pathname;
}

/** Cookies are scoped to the app's base so sibling sandboxes on one host never share them. */
export function cookiePath(): string {
	return base || '/';
}

/** Delete a cookie at the app path and at '/' (cookies minted before base paths existed). */
export function deleteCookieEverywhere(
	cookies: { delete(name: string, opts: { path: string }): void },
	name: string
) {
	const path = cookiePath();
	cookies.delete(name, { path });
	if (path !== '/') cookies.delete(name, { path: '/' });
}
