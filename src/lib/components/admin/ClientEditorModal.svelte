<script lang="ts">
	import { deserialize } from '$app/forms';
	import { refreshAfterClientChange } from '$lib/admin/refresh-data';
	import CategoryTagPicker from '$lib/components/admin/CategoryTagPicker.svelte';
	import InlineEditableField from '$lib/components/admin/InlineEditableField.svelte';
	import SubmissionDetailPanel from '$lib/components/admin/SubmissionDetailPanel.svelte';
	import Btn from '$lib/components/Btn.svelte';
	import StatusBadge from '$lib/components/StatusBadge.svelte';
	import Alert from '$lib/components/ui/Alert.svelte';
	import Field from '$lib/components/ui/Field.svelte';
	import Modal from '$lib/components/ui/Modal.svelte';
	import {
		fetchClientBriefs,
		fetchSubmissionDetail,
		type ClientBriefSummary,
		type SubmissionDetail
	} from '$lib/admin/submission-detail';
	import { formatUsPhoneInput } from '$lib/phone';
	import { categoryById, formatCategoryList, type QuestionCategory } from '$lib/categories';
	import { formatRelativeTime } from '$lib/utils';
	import { enhance } from '$app/forms';
	import ArrowLeft from '@lucide/svelte/icons/arrow-left';
	import ChevronRight from '@lucide/svelte/icons/chevron-right';

	type ClientDraft = {
		id?: string;
		company: string;
		contactName: string;
		email: string;
		phone: string;
		services: string[];
	};

	type ModalView = 'client' | 'brief';

	let {
		open = $bindable(false),
		client = null,
		serviceOptions = [],
		error = '',
		deleteError = '',
		onclose,
		onsaved
	}: {
		open?: boolean;
		client?: ClientDraft | null;
		serviceOptions?: QuestionCategory[];
		error?: string;
		deleteError?: string;
		onclose?: () => void;
		onsaved?: () => void | Promise<void>;
	} = $props();

	let company = $state('');
	let contactName = $state('');
	let email = $state('');
	let phone = $state('');
	let selectedServices = $state<string[]>([]);
	let saveError = $state('');

	let view = $state<ModalView>('client');
	let slideDirection = $state<'forward' | 'back'>('forward');
	let animatePanel = $state(false);
	let briefs = $state<ClientBriefSummary[]>([]);
	let briefsLoading = $state(false);
	let briefsError = $state('');

	let selectedAssignmentId = $state<string | null>(null);
	let detail = $state<SubmissionDetail | null>(null);
	let detailLoading = $state(false);
	let detailError = $state('');

	let editingServices = $state(false);
	let servicesDraft = $state<string[]>([]);
	let servicesSaving = $state(false);

	$effect(() => {
		if (open) {
			company = client?.company ?? '';
			contactName = client?.contactName ?? '';
			email = client?.email ?? '';
			phone = formatUsPhoneInput(client?.phone ?? '');
			selectedServices = [...(client?.services ?? [])];
			saveError = '';
			view = 'client';
			slideDirection = 'forward';
			animatePanel = false;
			selectedAssignmentId = null;
			detail = null;
			detailError = '';
			editingServices = false;

			if (client?.id) {
				void loadBriefs(client.id);
			} else {
				briefs = [];
				briefsError = '';
			}
		}
	});

	const isEdit = $derived(Boolean(client?.id));
	const panelKey = $derived(view === 'client' ? 'client' : `brief-${selectedAssignmentId ?? 'none'}`);
	const briefTitle = $derived(
		detail?.briefCategories.length
			? formatCategoryList(detail.briefCategories, detail.setCategories)
			: detail?.questionSet.title ?? 'Brief preview'
	);

	function close() {
		open = false;
		onclose?.();
	}

	function onBackdropClick(event: MouseEvent) {
		if (event.target === event.currentTarget) close();
	}

	async function loadBriefs(clientId: string) {
		briefsLoading = true;
		briefsError = '';
		try {
			briefs = await fetchClientBriefs(clientId);
		} catch (loadErr) {
			briefs = [];
			briefsError = loadErr instanceof Error ? loadErr.message : 'Could not load briefs.';
		} finally {
			briefsLoading = false;
		}
	}

	async function loadDetail(assignmentId: string) {
		detailLoading = true;
		detailError = '';
		try {
			detail = await fetchSubmissionDetail(assignmentId);
		} catch (loadErr) {
			detail = null;
			detailError = loadErr instanceof Error ? loadErr.message : 'Could not load brief.';
		} finally {
			detailLoading = false;
		}
	}

	async function persistClient(): Promise<boolean> {
		if (!client?.id) return false;

		const formData = new FormData();
		formData.set('clientId', client.id);
		formData.set('company', company.trim());
		formData.set('contactName', contactName.trim());
		formData.set('email', email.trim());
		formData.set('phone', phone.trim());
		for (const serviceId of selectedServices) {
			formData.append('services', serviceId);
		}

		const response = await fetch('?/saveClient', { method: 'POST', body: formData });
		const result = deserialize(await response.text());

		if (result.type === 'success') {
			saveError = '';
			await refreshAfterClientChange();
			await onsaved?.();
			return true;
		}

		saveError =
			result.type === 'failure' && typeof result.data?.clientError === 'string'
				? result.data.clientError
				: 'Could not save client.';
		return false;
	}

	async function saveCompany(value: string) {
		company = value;
		return persistClient();
	}

	async function saveContactName(value: string) {
		contactName = value;
		return persistClient();
	}

	async function saveEmail(value: string) {
		email = value;
		return persistClient();
	}

	async function savePhone(value: string) {
		phone = value;
		return persistClient();
	}

	function startServicesEdit() {
		servicesDraft = [...selectedServices];
		editingServices = true;
	}

	function cancelServicesEdit() {
		editingServices = false;
		servicesDraft = [...selectedServices];
	}

	async function saveServices() {
		servicesSaving = true;
		selectedServices = [...servicesDraft];
		const ok = await persistClient();
		servicesSaving = false;
		if (ok) editingServices = false;
	}

	function openBrief(assignmentId: string) {
		slideDirection = 'forward';
		animatePanel = true;
		selectedAssignmentId = assignmentId;
		view = 'brief';
		void loadDetail(assignmentId);
	}

	function backToClient() {
		slideDirection = 'back';
		animatePanel = true;
		view = 'client';
		selectedAssignmentId = null;
		detail = null;
		detailError = '';
		if (client?.id) void loadBriefs(client.id);
	}

	function briefStatusLabel(status: ClientBriefSummary['status']): string {
		if (status === 'submitted') return 'Completed';
		if (status === 'draft') return 'Unfinished';
		return 'Not started';
	}

	$effect(() => {
		if (!open || !isEdit) return;

		function onKeydown(event: KeyboardEvent) {
			if (event.key === 'Escape') {
				if (view === 'brief') {
					backToClient();
				} else {
					close();
				}
			}
		}

		window.addEventListener('keydown', onKeydown);
		return () => window.removeEventListener('keydown', onKeydown);
	});
</script>

{#if isEdit && open}
	<div class="client-modal-overlay" onclick={onBackdropClick} role="presentation">
		<div class="client-modal-card" role="dialog" aria-modal="true" aria-labelledby="client-modal-title">
			<header class="client-modal-header">
				<div class="client-modal-header-main">
					{#if view === 'brief'}
						<button type="button" class="back-button" aria-label="Back to client" onclick={backToClient}>
							<ArrowLeft size={18} strokeWidth={2} aria-hidden="true" />
							<span>Client</span>
						</button>
					{/if}
					<div class="client-modal-heading">
						{#if view === 'brief'}
							<p class="client-modal-kicker">{company}</p>
							<h2 id="client-modal-title">{briefTitle}</h2>
						{:else}
							<p class="client-modal-kicker">Client</p>
							<h2 id="client-modal-title">{company || 'Edit client'}</h2>
						{/if}
					</div>
				</div>
				<button type="button" class="close-button" aria-label="Close" onclick={close}>×</button>
			</header>

			<div class="client-modal-viewport">
				{#key panelKey}
					<div
						class="client-modal-panel"
						class:client-modal-panel--forward={animatePanel && slideDirection === 'forward'}
						class:client-modal-panel--back={animatePanel && slideDirection === 'back'}
					>
						{#if view === 'client'}
							<div class="client-modal-body">
								{#if saveError}
									<Alert variant="error" title="Could not save client" subtitle={saveError} />
								{/if}

								<section class="client-fields" aria-label="Client details">
									<InlineEditableField
										label="Company"
										value={company}
										required
										onsave={saveCompany}
									/>
									<InlineEditableField
										label="Point of contact"
										value={contactName}
										required
										onsave={saveContactName}
									/>
									<InlineEditableField
										label="Email"
										value={email}
										type="email"
										required
										onsave={saveEmail}
									/>
									<InlineEditableField
										label="Phone"
										value={phone}
										type="tel"
										placeholder="Optional"
										onsave={savePhone}
									/>

									<div class="inline-field services-field" class:inline-field--editing={editingServices}>
										<span class="inline-field-label">Services</span>
										{#if editingServices}
											<CategoryTagPicker
												categories={serviceOptions}
												bind:selected={servicesDraft}
												name="services"
												legend=""
												placeholder="Search or select services…"
												emptyHint="Create categories in Manage Briefs first."
											/>
											<div class="inline-field-actions">
												<Btn size="small" type="button" onclick={saveServices} disabled={servicesSaving}>
													{servicesSaving ? 'Saving…' : 'Save'}
												</Btn>
												<Btn
													size="small"
													variant="ghost"
													type="button"
													onclick={cancelServicesEdit}
													disabled={servicesSaving}
												>
													Cancel
												</Btn>
											</div>
										{:else}
											<!-- svelte-ignore a11y_no_static_element_interactions -->
											<div class="inline-field-display" ondblclick={startServicesEdit}>
												{#if selectedServices.length > 0}
													<div class="service-tags">
														{#each selectedServices as serviceId (serviceId)}
															{@const service = categoryById(serviceOptions, serviceId)}
															{#if service}
																<span
																	class="service-tag"
																	style:--service-color={service.color}
																>
																	{service.name}
																</span>
															{/if}
														{/each}
													</div>
												{:else}
													<span class="inline-field-value">—</span>
												{/if}
												<span class="inline-field-hint">Double-click to edit</span>
											</div>
										{/if}
									</div>
								</section>

								<section class="briefs-section" aria-label="Client briefs">
									<div class="briefs-section-header">
										<h3>Briefs</h3>
										<Btn variant="secondary" size="small" href="/admin/briefs/new?client={client?.id}">
											New brief
										</Btn>
									</div>

									{#if briefsLoading}
										<p class="briefs-status">Loading briefs…</p>
									{:else if briefsError}
										<Alert variant="error" title="Could not load briefs" subtitle={briefsError} />
									{:else if briefs.length === 0}
										<p class="briefs-status">No briefs yet for this client.</p>
									{:else}
										<ul class="brief-list">
											{#each briefs as brief (brief.id)}
												<li>
													<button type="button" class="brief-row" onclick={() => openBrief(brief.id)}>
														<div class="brief-row-main">
															<p class="brief-row-title">{brief.categoriesLabel || 'Brief'}</p>
															<p class="brief-row-meta">
																{brief.progress}% complete ·
																{formatRelativeTime(new Date(brief.createdAt))}
															</p>
															{#if brief.answerPreview}
																<p class="brief-row-preview">{brief.answerPreview}</p>
															{/if}
														</div>
														<div class="brief-row-side">
															{#if brief.status}
																<StatusBadge status={brief.status} />
															{:else}
																<span class="brief-status">{briefStatusLabel(brief.status)}</span>
															{/if}
															<ChevronRight size={18} strokeWidth={2} aria-hidden="true" />
														</div>
													</button>
												</li>
											{/each}
										</ul>
									{/if}
								</section>
							</div>

							<footer class="client-modal-footer">
								{#if deleteError}
									<Alert variant="error" title="Could not delete client" subtitle={deleteError} />
								{/if}
								<form
									method="POST"
									action="?/deleteClient"
									class="delete-form"
									use:enhance={() => {
										return async ({ result, update }) => {
											await update({ reset: false, invalidateAll: false });
											if (result.type === 'success') {
												await refreshAfterClientChange();
												await onsaved?.();
												close();
											}
										};
									}}
									onsubmit={(event) => {
										if (
											!confirm(
												`Delete ${company || 'this client'}? This will also remove all briefs and submissions for them.`
											)
										) {
											event.preventDefault();
										}
									}}
								>
									<input type="hidden" name="clientId" value={client?.id} />
									<Btn variant="danger" type="submit">Delete client</Btn>
								</form>
							</footer>
						{:else}
							<div class="client-modal-body client-modal-body--brief">
								<SubmissionDetailPanel
									{detail}
									loading={detailLoading}
									loadError={detailError}
									showFooter={true}
									onActionComplete={() =>
										selectedAssignmentId ? loadDetail(selectedAssignmentId) : undefined}
								/>
							</div>
						{/if}
					</div>
				{/key}
			</div>
		</div>
	</div>
{:else if open}
	<Modal bind:open title="Add client" size="sm" {onclose}>
		<form
			method="POST"
			action="?/saveClient"
			class="client-form"
			use:enhance={() => {
				return async ({ result, update }) => {
					await update({ reset: false, invalidateAll: false });
					if (result.type === 'success') {
						await refreshAfterClientChange();
						await onsaved?.();
						open = false;
						onclose?.();
					}
				};
			}}
		>
			<Field labelText="Company" name="company" bind:value={company} required />
			<Field labelText="Point of contact" name="contactName" bind:value={contactName} required />
			<Field labelText="Email" name="email" type="email" bind:value={email} required />
			<Field labelText="Phone" name="phone" type="tel" bind:value={phone} helperText="Optional" />

			<CategoryTagPicker
				categories={serviceOptions}
				bind:selected={selectedServices}
				name="services"
				legend="Services"
				placeholder="Search or select services…"
				emptyHint="Create categories in Manage Briefs first. Those become the services you can track here."
			/>
			<p class="services-help">Track the services this client has requested so far.</p>

			{#if error}
				<Alert variant="error" title="Could not save client" subtitle={error} />
			{/if}

			<div class="modal-actions">
				<Btn variant="secondary" type="button" onclick={() => (open = false)}>Cancel</Btn>
				<Btn type="submit">Save client</Btn>
			</div>
		</form>
	</Modal>
{/if}

<style>
	.client-modal-overlay {
		position: fixed;
		inset: 0;
		z-index: 8000;
		display: flex;
		align-items: center;
		justify-content: center;
		padding: 1.25rem;
		background: rgb(15 23 42 / 55%);
		backdrop-filter: blur(3px);
		overflow-y: auto;
	}

	.client-modal-card {
		display: flex;
		flex-direction: column;
		width: min(100%, 52rem);
		min-height: min(88vh, 40rem);
		max-height: 92vh;
		background: var(--color-surface);
		border: 1px solid var(--color-border);
		border-radius: var(--radius-lg);
		box-shadow: 0 16px 48px rgb(0 0 0 / 22%);
		overflow: hidden;
	}

	.client-modal-header {
		display: flex;
		align-items: flex-start;
		justify-content: space-between;
		gap: 1rem;
		padding: 1.25rem 1.75rem;
		border-bottom: 1px solid var(--color-border);
		flex-shrink: 0;
	}

	.client-modal-header-main {
		display: flex;
		align-items: flex-start;
		gap: 0.75rem;
		min-width: 0;
		flex: 1;
	}

	.client-modal-heading {
		min-width: 0;
		flex: 1;
	}

	.client-modal-kicker {
		font-size: 0.875rem;
		color: var(--color-muted);
	}

	.client-modal-header h2 {
		margin-top: 0.2rem;
		font-size: 1.375rem;
		font-weight: 600;
		line-height: 1.3;
	}

	.back-button {
		display: inline-flex;
		align-items: center;
		gap: 0.35rem;
		padding: 0.35rem 0.5rem;
		border: 0;
		border-radius: var(--radius-md);
		background: transparent;
		color: var(--color-muted);
		font: inherit;
		font-size: 0.875rem;
		cursor: pointer;
		flex-shrink: 0;
	}

	.back-button:hover {
		color: var(--color-accent);
		background: var(--color-surface-hover);
	}

	.close-button {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		width: 2.25rem;
		height: 2.25rem;
		border: 0;
		border-radius: var(--radius);
		background: transparent;
		color: var(--color-ink);
		font-size: 1.625rem;
		line-height: 1;
		cursor: pointer;
		flex-shrink: 0;
	}

	.close-button:hover {
		background: var(--color-surface-hover);
	}

	.client-modal-viewport {
		position: relative;
		flex: 1;
		min-height: 0;
		overflow: hidden;
	}

	.client-modal-panel {
		display: flex;
		flex-direction: column;
		height: 100%;
		min-height: 0;
		animation-duration: 0.38s;
		animation-timing-function: cubic-bezier(0.34, 1.2, 0.64, 1);
		animation-fill-mode: both;
	}

	.client-modal-footer {
		display: grid;
		gap: 0.75rem;
		padding: 1rem 1.75rem 1.75rem;
		border-top: 1px solid var(--color-border);
		flex-shrink: 0;
	}

	.delete-form {
		display: flex;
		justify-content: flex-start;
	}

	.client-modal-panel--forward {
		animation-name: client-page-wipe-forward;
	}

	.client-modal-panel--back {
		animation-name: client-page-wipe-back;
	}

	@keyframes client-page-wipe-forward {
		from {
			transform: translateX(100%);
			opacity: 0.82;
		}

		to {
			transform: translateX(0);
			opacity: 1;
		}
	}

	@keyframes client-page-wipe-back {
		from {
			transform: translateX(-100%);
			opacity: 0.82;
		}

		to {
			transform: translateX(0);
			opacity: 1;
		}
	}

	.client-modal-body {
		display: flex;
		flex-direction: column;
		gap: 1.5rem;
		flex: 1;
		min-height: 0;
		padding: 1.5rem 1.75rem 1.75rem;
		overflow-y: auto;
	}

	.client-modal-body--brief {
		gap: 0;
	}

	.client-fields {
		display: grid;
	}

	.services-field {
		display: grid;
		gap: 0.35rem;
		padding: 0.75rem 0;
	}

	.inline-field-label {
		font-size: 0.75rem;
		font-weight: 600;
		color: var(--color-muted);
		text-transform: uppercase;
		letter-spacing: 0.04em;
	}

	.inline-field-display {
		display: flex;
		flex-wrap: wrap;
		align-items: baseline;
		gap: 0.5rem 0.75rem;
		cursor: text;
		min-width: 0;
	}

	.inline-field-value {
		font-size: 0.9375rem;
		line-height: 1.45;
	}

	.inline-field-hint {
		font-size: 0.75rem;
		color: var(--color-muted);
		opacity: 0;
		transition: opacity 0.15s ease;
	}

	.inline-field-display:hover .inline-field-hint,
	.services-field.inline-field--editing .inline-field-hint {
		opacity: 1;
	}

	.inline-field-actions {
		display: flex;
		flex-wrap: wrap;
		gap: 0.5rem;
	}

	.service-tags {
		display: flex;
		flex-wrap: wrap;
		gap: 0.35rem;
	}

	.service-tag {
		display: inline-flex;
		align-items: center;
		padding: 0.15rem 0.55rem;
		border-radius: var(--radius);
		font-size: 0.75rem;
		background: color-mix(in srgb, var(--service-color) 16%, transparent);
		border: 1px solid color-mix(in srgb, var(--service-color) 42%, transparent);
	}

	.briefs-section {
		display: grid;
		gap: 0.75rem;
		padding-top: 0.5rem;
		border-top: 1px solid var(--color-border);
	}

	.briefs-section-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 0.75rem;
		flex-wrap: wrap;
	}

	.briefs-section-header h3 {
		font-size: 1rem;
		font-weight: 600;
	}

	.briefs-status {
		color: var(--color-muted);
		font-size: 0.875rem;
	}

	.brief-list {
		display: grid;
		gap: 0.5rem;
		list-style: none;
		padding: 0;
		margin: 0;
	}

	.brief-row {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 1rem;
		width: 100%;
		padding: 0.875rem 1rem;
		border: 1px solid var(--color-border);
		border-radius: var(--radius-lg);
		background: var(--color-surface);
		color: inherit;
		font: inherit;
		text-align: left;
		cursor: pointer;
		transition:
			border-color 0.15s ease,
			background 0.15s ease;
	}

	.brief-row:hover {
		border-color: var(--color-accent);
		background: var(--color-surface-hover);
	}

	.brief-row-main {
		min-width: 0;
		flex: 1;
	}

	.brief-row-title {
		font-size: 0.9375rem;
		font-weight: 600;
	}

	.brief-row-meta,
	.brief-row-preview {
		margin-top: 0.2rem;
		font-size: 0.8125rem;
		color: var(--color-muted);
	}

	.brief-row-preview {
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.brief-row-side {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		flex-shrink: 0;
		color: var(--color-muted);
	}

	.brief-status {
		font-size: 0.75rem;
		font-weight: 600;
		color: var(--color-muted);
	}

	.client-form {
		display: grid;
		gap: 1rem;
	}

	.services-help {
		margin-top: -0.25rem;
		font-size: 0.8125rem;
		color: var(--color-muted);
	}

	.modal-actions {
		display: flex;
		justify-content: flex-end;
		gap: 0.75rem;
		flex-wrap: wrap;
		padding-top: 0.5rem;
		border-top: 1px solid var(--color-border);
		margin-top: 0.5rem;
	}

	@media (min-width: 672px) {
		.client-modal-card {
			width: min(calc(100% - 2.5rem), 56rem);
		}
	}

	@media (max-width: 767px) {
		.client-modal-overlay {
			padding: 0;
			align-items: stretch;
		}

		.client-modal-card {
			width: 100%;
			min-height: 100%;
			max-height: none;
			border: 0;
			border-radius: 0;
		}
	}
</style>
