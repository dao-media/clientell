<script lang="ts">
	import SubmissionsPanel from '$lib/components/admin/SubmissionsPanel.svelte';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();
</script>

<SubmissionsPanel
	view={data.view}
	submissions={data.submissions}
	clients={data.clients}
	filters={data.filters}
/>
