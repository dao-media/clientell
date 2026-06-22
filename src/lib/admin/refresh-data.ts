import { invalidate } from '$app/navigation';
import { onMount } from 'svelte';
import { adminDataKeys, type AdminDataKey } from './data-keys';

export { adminDataKeys };

export async function refreshAdminData(...keys: AdminDataKey[]) {
	await Promise.all(keys.map((key) => invalidate(key)));
}

export async function refreshAfterClientChange() {
	await Promise.all([
		invalidate(adminDataKeys.clients),
		invalidate(adminDataKeys.dashboard),
		invalidate('/admin/clients'),
		invalidate('/admin/briefs/new')
	]);
}

/** Invalidate dependent admin routes after a client mutation. */
export function scheduleClientChangeRefresh() {
	void refreshAfterClientChange();
}

export async function refreshAfterQuestionChange() {
	await Promise.all([
		invalidate(adminDataKeys.questions),
		invalidate(adminDataKeys.dashboard),
		invalidate('/admin/question-sets')
	]);
}

export function registerPageDataDepends(
	depends: (dep: string) => void,
	pathname: string,
	...keys: AdminDataKey[]
) {
	for (const key of keys) {
		depends(key);
	}

	depends(pathname);
}

export function refreshOnVisible(...keys: AdminDataKey[]) {
	onMount(() => {
		function onVisible() {
			if (document.visibilityState === 'visible') {
				void refreshAdminData(...keys);
			}
		}

		document.addEventListener('visibilitychange', onVisible);
		return () => document.removeEventListener('visibilitychange', onVisible);
	});
}
