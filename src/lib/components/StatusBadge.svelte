<script lang="ts">
	let { status }: { status: 'draft' | 'submitted' } = $props();
</script>

<span class="chip {status === 'draft' ? 'chip-draft' : 'chip-submitted'}">
	{status === 'draft' ? 'Draft' : 'Submitted'}
</span>
