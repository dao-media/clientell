<script lang="ts">
	import BriefPreviewBody from '$lib/components/admin/BriefPreviewBody.svelte';
	import Btn from '$lib/components/Btn.svelte';
	import Alert from '$lib/components/ui/Alert.svelte';
	import PageHeader from '$lib/components/layout/PageHeader.svelte';
	import PageShell from '$lib/components/layout/PageShell.svelte';
	import ArrowLeft from '@lucide/svelte/icons/arrow-left';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	const briefLead = $derived(
		[
			data.client.company,
			data.client.contactName,
			data.questionSet.description,
			data.briefCategories.length > 0 ? `Categories: ${data.categoriesLabel}` : ''
		]
			.filter(Boolean)
			.join(' · ')
	);
</script>

<PageShell width="content">
	<PageHeader title="Brief preview" lead={briefLead}>
		{#snippet actions()}
			<Btn variant="secondary" href={data.backHref} icon={ArrowLeft}>Back to submission</Btn>
		{/snippet}
	</PageHeader>

	<Alert
		variant="info"
		title="Client preview"
		subtitle="This is how the brief appears in the client portal. Answers entered here are not saved."
	/>

	<BriefPreviewBody questions={data.questions} />
</PageShell>
