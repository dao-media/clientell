import { invalidate } from '$app/navigation';
import { onMount } from 'svelte';
import { adminDataKeys, type AdminDataKey } from './data-keys';

export { adminDataKeys };

export async function refreshAdminData(...keys: AdminDataKey[]) {
	await Promise.all(keys.map((key) => invalidate(key)));
}

export async function refreshAfterClientChange() {
	await refreshAdminData(adminDataKeys.clients, adminDataKeys.dashboard);
}

export async function refreshAfterQuestionChange() {
	await refreshAdminData(adminDataKeys.questions, adminDataKeys.dashboard);
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
