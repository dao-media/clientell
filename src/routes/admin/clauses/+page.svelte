<script lang="ts">
	import { enhance } from '$app/forms';
	import { adminDataKeys, refreshOnVisible } from '$lib/admin/refresh-data';
	import Btn from '$lib/components/Btn.svelte';
	import Alert from '$lib/components/ui/Alert.svelte';
	import Checkbox from '$lib/components/ui/Checkbox.svelte';
	import Field from '$lib/components/ui/Field.svelte';
	import Modal from '$lib/components/ui/Modal.svelte';
	import TextArea from '$lib/components/ui/TextArea.svelte';
	import PageHeader from '$lib/components/layout/PageHeader.svelte';
	import PageShell from '$lib/components/layout/PageShell.svelte';
	import type { ActionData, PageData } from './$types';

	let { data, form }: { data: PageData; form: ActionData } = $props();

	refreshOnVisible(adminDataKeys.clauses);

	let editingId = $state<string | null>(null);
	const editing = $derived(data.clauses.find((clause) => clause.id === editingId) ?? null);
	let title = $state('');
	let body = $state('');
	let sectionNumber = $state('');
	let isActive = $state(true);
	let editorOpen = $state(false);

	function openEditor(id: string) {
		const clause = data.clauses.find((item) => item.id === id);
		if (!clause) return;
		editingId = id;
		title = clause.title;
		body = clause.body;
		sectionNumber = clause.sectionNumber;
		isActive = clause.isActive;
		editorOpen = true;
	}

	function closeEditor() {
		editorOpen = false;
		editingId = null;
	}
</script>

<PageShell>
	<PageHeader
		title="Clauses"
		lead="Edit contract wording without a code change. Core clauses always render; module clauses follow the toggles on each contract."
	/>

	{#if form?.error}
		<Alert variant="error" title="Could not save" message={form.error} />
	{/if}
	{#if form?.success}
		<Alert variant="success" title="Saved" message="Clause updated." />
	{/if}

	<ul class="clause-list">
		{#each data.clauses as clause (clause.id)}
			<li class="card clause-row">
				<div>
					<p class="clause-meta">{clause.docType} · {clause.clauseType}{clause.moduleKey ? ` · ${clause.moduleKey}` : ''}</p>
					<h2>{clause.sectionNumber}. {clause.title}</h2>
					<p class="clause-status">{clause.isActive ? 'Active' : 'Inactive'}</p>
				</div>
				<Btn variant="ghost" type="button" onclick={() => openEditor(clause.id)}>Edit</Btn>
			</li>
		{/each}
	</ul>
</PageShell>

<Modal bind:open={editorOpen} title="Edit clause" onclose={closeEditor}>
	{#if editing}
		<form method="POST" action="?/saveClause" use:enhance={() => {
			return async ({ update }) => {
				await update();
				closeEditor();
			};
		}}>
			<input type="hidden" name="clauseId" value={editing.id} />
			<Field label="Section" name="sectionNumber" bind:value={sectionNumber} />
			<Field label="Title" name="title" bind:value={title} />
			<TextArea label="Body" name="body" bind:value={body} />
			<Checkbox label="Active" bind:checked={isActive} />
			<input type="hidden" name="isActive" value={isActive ? 'true' : ''} />
			<div class="modal-actions">
				<Btn variant="ghost" type="button" onclick={closeEditor}>Cancel</Btn>
				<Btn type="submit">Save clause</Btn>
			</div>
		</form>
	{/if}
</Modal>

<style>
	.clause-list {
		list-style: none;
		margin: 0;
		padding: 0;
		display: grid;
		gap: 0.75rem;
	}

	.clause-row {
		display: flex;
		justify-content: space-between;
		gap: 1rem;
		align-items: start;
		padding: 1rem;
	}

	.clause-row h2 {
		margin: 0.15rem 0;
		font-size: 1rem;
	}

	.clause-meta,
	.clause-status {
		margin: 0;
		font-size: 0.8rem;
		opacity: 0.7;
	}

	.modal-actions {
		display: flex;
		justify-content: flex-end;
		gap: 0.5rem;
		margin-top: 1rem;
	}
</style>
