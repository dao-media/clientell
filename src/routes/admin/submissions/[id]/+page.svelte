<script lang="ts">
	import Btn from '$lib/components/Btn.svelte';
	import Alert from '$lib/components/ui/Alert.svelte';
	import Chip from '$lib/components/ui/Chip.svelte';
	import AttachmentPreviewCard from '$lib/components/AttachmentPreviewCard.svelte';
	import PageHeader from '$lib/components/layout/PageHeader.svelte';
	import PageShell from '$lib/components/layout/PageShell.svelte';
	import { attachmentAnswerKey, parseAttachments } from '$lib/attachments';
	import { formatAnswer, formatRelativeTime } from '$lib/utils';
	import { formatUsPhoneDisplay } from '$lib/phone';
	import { formatCategoryList } from '$lib/categories';
	import type { ActionData, PageData } from './$types';

	let { data, form }: { data: PageData; form: ActionData } = $props();

	const answers = $derived((data.response?.answers ?? {}) as Record<string, unknown>);
	const statusLabel = $derived(
		data.response?.status === 'submitted' ? 'Completed' : data.response ? 'Unfinished' : 'Not started'
	);
	const statusVariant = $derived(
		data.response?.status === 'submitted' ? 'submitted' : 'gray'
	);
</script>

<PageShell>
	<PageHeader kicker="Submission" title={data.client.company} lead={data.client.contactName} />

	{#if form?.emailResult}
		<Alert
			variant={form.emailResult.ok ? 'success' : 'error'}
			title={form.emailResult.ok ? 'Email sent' : 'Email failed'}
			subtitle={form.emailResult.message}
		/>
	{/if}

	{#if form?.rotatedPin}
		<Alert
			variant="warning"
			title="New PIN generated"
			subtitle="Share manually with the client: {form.rotatedPin}"
		/>
	{/if}

	<div class="detail-actions">
		{#if data.canSendBrief}
			<form method="POST" action="?/sendBrief">
				<Btn type="submit">Send brief</Btn>
			</form>
		{:else if data.assignment.sentAt}
			<p class="sent-note">Sent to client {formatRelativeTime(new Date(data.assignment.sentAt))}</p>
		{/if}
		{#if data.assignment.sentAt}
			<form method="POST" action="?/sendReminder">
				<Btn variant="secondary" type="submit">Send email reminder</Btn>
			</form>
			<form method="POST" action="?/sendPortalLink">
				<Btn variant="secondary" type="submit">Send portal link</Btn>
			</form>
		{/if}
		<Btn variant="ghost" href="/admin/submissions/{data.assignment.id}/pdf">Export PDF</Btn>
		<form method="POST" action="?/rotatePin">
			<Btn variant="ghost" type="submit">Generate new PIN</Btn>
		</form>
		<form method="POST" action="?/toggleActive">
			<Btn variant="ghost" type="submit">
				{data.assignment.isActive ? 'Deactivate' : 'Activate'}
			</Btn>
		</form>
		{#if data.response?.status === 'submitted'}
			<form method="POST" action="?/reopen">
				<Btn variant="ghost" type="submit">Reopen for edits</Btn>
			</form>
		{/if}
	</div>

	<div class="bento-grid bento-grid--detail">
		<div class="card">
			<h2>Progress</h2>
			<div class="progress-summary">
				<Chip variant={statusVariant}>{statusLabel}</Chip>
				<span>{data.progress}% complete</span>
			</div>
			<div class="progress-bar" aria-hidden="true">
				<span style:width="{data.progress}%"></span>
			</div>
			<p class="tile-meta">
				{#if data.response?.status === 'submitted' && data.response.submittedAt}
					Submitted {formatRelativeTime(new Date(data.response.submittedAt))}
				{:else if data.response}
					Last saved {formatRelativeTime(new Date(data.response.updatedAt))}
				{:else}
					No response saved yet
				{/if}
			</p>
		</div>

		<div class="card">
			<h2>Client access</h2>
			<p><strong>Company:</strong> {data.client.company}</p>
			<p><strong>Point of contact:</strong> {data.client.contactName}</p>
			<p><strong>Email:</strong> <span class="text-break">{data.client.email}</span></p>
			{#if data.client.phone}
				<p><strong>Phone:</strong> {formatUsPhoneDisplay(data.client.phone)}</p>
			{/if}
			<p><strong>Portal:</strong> <span class="text-break">{data.portalUrl}</span></p>
			<p><strong>Created:</strong> {formatRelativeTime(new Date(data.assignment.createdAt))}</p>
			<p><strong>Categories:</strong> {formatCategoryList(data.briefCategories, data.setCategories)}</p>
			<p>
				<strong>Assignment:</strong>
				{data.assignment.isActive ? 'Active' : 'Inactive'}
			</p>
		</div>
	</div>

	<section class="answers-section card bento-tile--full">
		<h2>Questions and answers</h2>
		{#if data.questions.length === 0}
			<p class="empty-state">This brief has no questions yet.</p>
		{:else}
			<div class="answers-grid">
				{#each data.questions as question (question.id)}
					<article class="answer-card">
						<h3>{question.label}</h3>
						{#if question.helpText}
							<p class="help-text">{question.helpText}</p>
						{/if}
						<p>{formatAnswer(answers[question.id])}</p>
						{#if question.allowAttachments}
							{@const items = parseAttachments(answers[attachmentAnswerKey(question.id)])}
							{#if items.length > 0}
								<div class="attachment-list">
									{#each items as item (item.id)}
										<AttachmentPreviewCard {item} disabled />
									{/each}
								</div>
							{/if}
						{/if}
					</article>
				{/each}
			</div>
		{/if}
	</section>
</PageShell>

<style>
	.detail-actions {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: 0.75rem;
	}

	.sent-note {
		font-size: 0.875rem;
		color: var(--color-muted);
	}

	.progress-summary {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		margin-top: 0.75rem;
	}

	.tile-meta,
	.help-text {
		color: var(--color-muted);
	}

	.tile-meta {
		margin-top: 0.75rem;
	}

	.answers-section h2 {
		font-size: 1.125rem;
		font-weight: 600;
		margin-bottom: 1rem;
	}

	.answers-grid {
		display: grid;
		gap: 1rem;
	}

	.help-text {
		margin-top: 0.35rem;
		font-size: 0.875rem;
	}

	.attachment-list {
		display: grid;
		gap: 0.75rem;
		margin-top: 0.75rem;
	}
</style>
