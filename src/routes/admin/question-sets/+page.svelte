<script lang="ts">
	import { page } from '$app/state';
	import { enhance } from '$app/forms';
	import {
		adminDataKeys,
		refreshAfterQuestionChange,
		refreshOnVisible
	} from '$lib/admin/refresh-data';
	import CategoryEditorPopover from '$lib/components/admin/CategoryEditorPopover.svelte';
	import CategoryTabs from '$lib/components/admin/CategoryTabs.svelte';
	import QuestionCard from '$lib/components/admin/QuestionCard.svelte';
	import QuestionEditorModal from '$lib/components/admin/QuestionEditorModal.svelte';
	import Btn from '$lib/components/Btn.svelte';
	import Alert from '$lib/components/ui/Alert.svelte';
	import Select from '$lib/components/ui/Select.svelte';
	import { PLACEHOLDER_CATEGORY_TAB_ID, type QuestionCategory } from '$lib/categories';
	import PageHeader from '$lib/components/layout/PageHeader.svelte';
	import PageShell from '$lib/components/layout/PageShell.svelte';
	import type { ActionData, PageData } from './$types';

	let { form }: { form: ActionData } = $props();

	const activeSet = $derived((page.data as PageData).activeSet);
	const questions = $derived((page.data as PageData).questions);
	const categoryCount = $derived(activeSet?.categories.length ?? 0);
	const questionCount = $derived(questions.length);
	const workspaceSummary = $derived.by(() => {
		const categories =
			categoryCount === 1 ? '1 category' : `${categoryCount} categories`;
		const listed = questionCount === 1 ? '1 question' : `${questionCount} questions`;
		return `${categories} · ${listed}`;
	});

	refreshOnVisible(adminDataKeys.questions, adminDataKeys.dashboard);

	let questionModalOpen = $state(false);
	let selectMode = $state(false);
	let selectedQuestionIds = $state<string[]>([]);
	let bulkStatus = $state<'active' | 'inactive'>('active');
	let activeCategoryId = $state(PLACEHOLDER_CATEGORY_TAB_ID);
	let editingCategory = $state<QuestionCategory | null | 'new'>(null);
	let categoryEditorOpen = $state(false);
	let categoryEditorAnchor = $state<DOMRect | null>(null);
	let editingQuestion = $state<{
		id?: string;
		label: string;
		helpText: string;
		required: boolean;
		allowAttachments: boolean;
		inputRestriction: import('$lib/question-restrictions').QuestionInputRestriction | null;
		categories: string[];
		isActive: boolean;
	} | null>(null);

	const activeCategory = $derived(
		activeSet?.categories.find((entry) => entry.id === activeCategoryId) ?? null
	);

	const hasRealCategory = $derived(
		Boolean(activeCategoryId && activeCategoryId !== PLACEHOLDER_CATEGORY_TAB_ID)
	);

	$effect.pre(() => {
		if (!activeSet) return;
		if (activeSet.categories.length === 0) {
			activeCategoryId = PLACEHOLDER_CATEGORY_TAB_ID;
		} else if (!activeCategoryId || activeCategoryId === PLACEHOLDER_CATEGORY_TAB_ID) {
			activeCategoryId = activeSet.categories[0].id;
		}
	});

	$effect(() => {
		if (form?.success && 'activeCategoryId' in form && form.activeCategoryId) {
			activeCategoryId = String(form.activeCategoryId);
			editingCategory = null;
			categoryEditorOpen = false;
			categoryEditorAnchor = null;

			if (questionModalOpen && editingQuestion) {
				const id = String(form.activeCategoryId);
				if (!editingQuestion.categories.includes(id)) {
					editingQuestion = { ...editingQuestion, categories: [...editingQuestion.categories, id] };
				}
			}
		}
	});

	$effect(() => {
		if (!activeSet) return;

		if (activeSet.categories.length === 0) {
			activeCategoryId = PLACEHOLDER_CATEGORY_TAB_ID;
			return;
		}

		const tabStillValid = activeSet.categories.some((category) => category.id === activeCategoryId);
		if (
			!activeCategoryId ||
			activeCategoryId === PLACEHOLDER_CATEGORY_TAB_ID ||
			!tabStillValid
		) {
			activeCategoryId = activeSet.categories[0].id;
		}
	});

	const filteredQuestions = $derived(
		activeSet && hasRealCategory
			? questions.filter((question) => question.categories.includes(activeCategoryId))
			: []
	);

	const categoryQuestionCount = $derived(
		hasRealCategory ? filteredQuestions.length : 0
	);
	const categoryQuestionLabel = $derived(
		categoryQuestionCount === 1 ? '1 question' : `${categoryQuestionCount} questions`
	);

	const questionModalHeading = $derived.by(() => {
		if (!editingQuestion) return 'New Question';

		const categoryName =
			activeCategory?.name ??
			activeSet?.categories.find((entry) => editingQuestion?.categories.includes(entry.id))?.name;

		if (categoryName) return `${categoryName} Question`;
		return editingQuestion.id ? 'Question' : 'New Question';
	});

	const selectedCount = $derived(selectedQuestionIds.length);

	function toggleSelectMode() {
		selectMode = !selectMode;
		if (!selectMode) selectedQuestionIds = [];
	}

	function toggleQuestionSelection(questionId: string, checked: boolean) {
		if (checked) {
			if (!selectedQuestionIds.includes(questionId)) {
				selectedQuestionIds = [...selectedQuestionIds, questionId];
			}
		} else {
			selectedQuestionIds = selectedQuestionIds.filter((id) => id !== questionId);
		}
	}

	function openCategoryEditor(mode: 'new' | QuestionCategory, anchor: DOMRect) {
		editingCategory = mode === 'new' ? 'new' : mode;
		categoryEditorAnchor = anchor;
		categoryEditorOpen = true;
	}

	function closeCategoryEditor() {
		editingCategory = null;
		categoryEditorOpen = false;
		categoryEditorAnchor = null;
	}

	function selectCategory(id: string, anchor?: DOMRect) {
		activeCategoryId = id;
		if (id === PLACEHOLDER_CATEGORY_TAB_ID && anchor) {
			openCategoryEditor('new', anchor);
		} else if (editingCategory === 'new') {
			closeCategoryEditor();
		}
	}

	function openAddCategory(anchor: DOMRect) {
		openCategoryEditor('new', anchor);
	}

	function openEditCategory(category: QuestionCategory, anchor: DOMRect) {
		openCategoryEditor(category, anchor);
	}

	async function reorderCategories(categoryIds: string[]) {
		if (!activeSet) return;

		const formData = new FormData();
		formData.set('setId', activeSet.id);
		for (const id of categoryIds) {
			formData.append('categoryIds', id);
		}

		const response = await fetch('?/reorderCategories', { method: 'POST', body: formData });
		if (response.ok) {
			await refreshAfterQuestionChange();
		}
	}

	function openNewQuestion() {
		if (!activeSet) return;
		editingQuestion = {
			label: '',
			helpText: '',
			required: true,
			allowAttachments: false,
			inputRestriction: null,
			categories: [],
			isActive: true
		};
		questionModalOpen = true;
	}

	function openEditQuestion(question: {
		id: string;
		label: string;
		helpText: string | null;
		required: boolean;
		allowAttachments: boolean;
		inputRestriction: import('$lib/question-restrictions').QuestionInputRestriction | null;
		categories: string[];
		isActive: boolean;
	}) {
		editingQuestion = {
			id: question.id,
			label: question.label,
			helpText: question.helpText ?? '',
			required: question.required,
			allowAttachments: question.allowAttachments,
			inputRestriction: question.inputRestriction,
			categories: [...question.categories],
			isActive: question.isActive
		};
		questionModalOpen = true;
	}
</script>

<PageShell>
	<PageHeader
		title="Manage Briefs"
		kicker={workspaceSummary}
		lead="Organize intake questions by category. Categories define which questions appear on each brief."
	/>

	{#if activeSet}
		<div class="questions-workspace">
			<header class="workspace-header">
				<div class="header-actions">
					<Btn onclick={openNewQuestion} disabled={selectMode}>Add question</Btn>
					<Btn variant={selectMode ? 'primary' : 'secondary'} onclick={toggleSelectMode}>
						{selectMode ? 'Done' : 'Select'}
					</Btn>
				</div>
			</header>

			{#if selectMode}
				<form
					method="POST"
					action="?/bulkUpdateQuestions"
					class="bulk-toolbar"
					use:enhance={() => {
						return async ({ result, update }) => {
							await update({ reset: false, invalidateAll: false });
							if (result.type === 'success') {
								await refreshAfterQuestionChange();
								selectedQuestionIds = [];
								selectMode = false;
							}
						};
					}}
				>
					<input type="hidden" name="setId" value={activeSet.id} />
					<input type="hidden" name="status" value={bulkStatus} />
					{#each selectedQuestionIds as questionId (questionId)}
						<input type="hidden" name="questionIds" value={questionId} />
					{/each}

					<p class="bulk-summary">
						{selectedCount === 0
							? 'Select questions to update their state.'
							: `${selectedCount} selected`}
					</p>

					<Select
						labelText="Set state"
						bind:value={bulkStatus}
						disabled={selectedCount === 0}
						options={[
							{ value: 'active', text: 'Active' },
							{ value: 'inactive', text: 'Inactive' }
						]}
					/>

					<Btn type="submit" disabled={selectedCount === 0}>Apply</Btn>
				</form>

				{#if form?.bulkError}
					<Alert variant="error" title="Could not update questions" subtitle={form.bulkError} />
				{/if}
			{/if}

			<section class="categories-section">
				<CategoryTabs
					categories={activeSet.categories}
					activeId={activeCategoryId}
					onselect={selectCategory}
					onadd={openAddCategory}
					onedit={openEditCategory}
					onreorder={reorderCategories}
				/>

				<CategoryEditorPopover
					bind:open={categoryEditorOpen}
					anchor={categoryEditorAnchor}
					setId={activeSet.id}
					category={editingCategory === 'new' ? null : editingCategory}
					error={form?.categoryError ?? ''}
					onclose={closeCategoryEditor}
				/>
			</section>

			<section class="questions-section">
				{#if hasRealCategory}
					<p class="section-count">{categoryQuestionLabel} in {activeCategory?.name}</p>
				{/if}
				{#if !hasRealCategory && filteredQuestions.length === 0}
					<div class="empty-panel">
						<p class="empty-state">Add a question and assign at least one category to include it on a brief.</p>
						<Btn variant="secondary" onclick={openNewQuestion}>Add question</Btn>
					</div>
				{:else if hasRealCategory && filteredQuestions.length === 0}
					<div class="empty-panel">
						<p class="empty-state">No questions in {activeCategory?.name} yet.</p>
						<Btn variant="secondary" onclick={openNewQuestion}>Add question</Btn>
					</div>
				{:else}
					<div class="admin-card-grid">
						{#each filteredQuestions as question (question.id)}
							<QuestionCard
								{question}
								setId={activeSet.id}
								categories={activeSet.categories}
								selectMode={selectMode}
								selected={selectedQuestionIds.includes(question.id)}
								ontoggle={toggleQuestionSelection}
								onedit={openEditQuestion}
							/>
						{/each}
					</div>
				{/if}
			</section>
		</div>

		<QuestionEditorModal
			bind:open={questionModalOpen}
			setId={activeSet.id}
			categories={activeSet.categories}
			question={editingQuestion}
			heading={questionModalHeading}
			error={form?.questionError ?? ''}
			oncreatecategory={(anchor) => openCategoryEditor('new', anchor)}
			onclose={() => (editingQuestion = null)}
		/>
	{/if}
</PageShell>

<style>
	.questions-workspace {
		display: grid;
		gap: 1.5rem;
	}

	.workspace-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		gap: 1rem;
		flex-wrap: wrap;
	}

	.header-actions {
		display: flex;
		gap: 0.75rem;
		flex-wrap: wrap;
		align-items: center;
		margin-left: auto;
	}

	.bulk-toolbar {
		display: flex;
		flex-wrap: wrap;
		align-items: flex-end;
		gap: 0.75rem 1rem;
		padding: 0.875rem 1rem;
		border: 1px solid var(--color-border);
		background: var(--color-surface-muted);
		border-radius: var(--radius-lg);
	}

	.bulk-summary {
		flex: 1;
		min-width: 12rem;
		margin: 0;
		padding-bottom: 0.35rem;
		font-size: 0.875rem;
		color: var(--color-muted);
	}

	.categories-section,
	.questions-section {
		display: grid;
		gap: 1rem;
	}

	.section-count {
		margin: 0;
		font-size: 0.875rem;
		color: var(--color-muted);
	}

	.empty-state {
		color: var(--color-muted);
		font-size: 0.875rem;
	}

	.empty-panel {
		display: grid;
		gap: 0.75rem;
		justify-items: start;
	}
</style>
