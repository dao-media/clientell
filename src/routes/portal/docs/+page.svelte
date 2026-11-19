<script lang="ts">
	import PageHeader from '$lib/components/layout/PageHeader.svelte';
	import PageShell from '$lib/components/layout/PageShell.svelte';
	import FileText from '@lucide/svelte/icons/file-text';
	import FileSignature from '@lucide/svelte/icons/file-signature';
	import ArrowRight from '@lucide/svelte/icons/arrow-right';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	const dateFormat = new Intl.DateTimeFormat('en-US', {
		month: 'short',
		day: 'numeric',
		year: 'numeric'
	});

	function formatDate(value: Date | string | null | undefined) {
		return value ? dateFormat.format(new Date(value)) : '—';
	}

	function briefStatus(brief: PageData['briefs'][number]) {
		if (brief.status === 'submitted') return 'Submitted';
		if (brief.progress > 0) return 'In progress';
		return 'Not started';
	}

	function contractStatus(contract: PageData['contracts'][number]) {
		if (contract.progress === 100) return 'Fully signed';
		if (contract.clientSignedAt) return 'Signed by you';
		return 'Awaiting your signature';
	}
</script>

<svelte:head>
	<title>My Docs · ClienTell</title>
</svelte:head>

<PageShell>
	<PageHeader
		kicker={data.client?.company ?? 'Client portal'}
		title="My Docs"
		lead="Everything we've sent you, in one place. Pick up a brief where you left off or review a contract."
	/>

	<div class="docs-grid">
		<section class="card docs-panel" aria-labelledby="docs-briefs-heading">
			<header class="docs-panel-head">
				<FileText size={20} aria-hidden="true" />
				<h2 id="docs-briefs-heading">Briefs</h2>
				<span class="docs-count">{data.briefs.length}</span>
			</header>

			{#if data.briefs.length === 0}
				<p class="docs-empty">No briefs yet.</p>
			{:else}
				<ul class="docs-list">
					{#each data.briefs as brief (brief.id)}
						<li>
							<form method="POST" action="?/openBrief" class="docs-item-form">
								<input type="hidden" name="assignmentId" value={brief.id} />
								<button type="submit" class="docs-item">
									<span class="docs-item-top">
										<span class="docs-item-title">{brief.title}</span>
										<span class="docs-badge" data-tone={brief.status === 'submitted' ? 'done' : brief.progress > 0 ? 'active' : 'idle'}>
											{briefStatus(brief)}
										</span>
									</span>
									{#if brief.categoriesLabel}
										<span class="docs-item-sub">{brief.categoriesLabel}</span>
									{/if}
									<span class="docs-progress" aria-hidden="true">
										<span class="docs-progress-bar" style:width="{brief.progress}%"></span>
									</span>
									<span class="docs-item-meta">
										<span>{brief.progress}% complete</span>
										<span>Sent {formatDate(brief.sentAt)}</span>
									</span>
									<span class="docs-item-cta">
										{brief.status === 'submitted' ? 'View brief' : brief.progress > 0 ? 'Continue' : 'Start brief'}
										<ArrowRight size={14} aria-hidden="true" />
									</span>
								</button>
							</form>
						</li>
					{/each}
				</ul>
			{/if}
		</section>

		<section class="card docs-panel" aria-labelledby="docs-contracts-heading">
			<header class="docs-panel-head">
				<FileSignature size={20} aria-hidden="true" />
				<h2 id="docs-contracts-heading">Contracts</h2>
				<span class="docs-count">{data.contracts.length}</span>
			</header>

			{#if data.contracts.length === 0}
				<p class="docs-empty">No contracts yet. They'll show up here when they're ready for you.</p>
			{:else}
				<ul class="docs-list">
					{#each data.contracts as contract (contract.id)}
						<li>
							<a class="docs-item" href={contract.href}>
								<span class="docs-item-top">
									<span class="docs-item-title">{contract.title}</span>
									<span class="docs-badge" data-tone={contract.progress === 100 ? 'done' : contract.clientSignedAt ? 'active' : 'idle'}>
										{contractStatus(contract)}
									</span>
								</span>
								<span class="docs-progress" aria-hidden="true">
									<span class="docs-progress-bar" style:width="{contract.progress}%"></span>
								</span>
								<span class="docs-item-meta">
									<span>{contract.progress}% signed</span>
									<span>Sent {formatDate(contract.sentAt)}</span>
								</span>
								<span class="docs-item-cta">
									{contract.clientSignedAt ? 'View contract' : 'Review & sign'}
									<ArrowRight size={14} aria-hidden="true" />
								</span>
							</a>
						</li>
					{/each}
				</ul>
			{/if}
		</section>
	</div>
</PageShell>

<style>
	.docs-grid {
		display: grid;
		grid-template-columns: repeat(2, minmax(0, 1fr));
		gap: var(--layout-grid-gap, 1.5rem);
		align-items: start;
	}

	.docs-panel {
		display: grid;
		gap: 1rem;
		min-width: 0;
	}

	.docs-panel-head {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		color: var(--color-accent);
	}

	.docs-panel-head h2 {
		margin: 0;
		font-size: 1.125rem;
		font-weight: 600;
		color: var(--color-text, inherit);
	}

	.docs-count {
		margin-left: auto;
		min-width: 1.75rem;
		padding: 0.1rem 0.5rem;
		border-radius: 999px;
		background: var(--color-surface-hover, rgb(15 23 42 / 5%));
		color: var(--color-muted);
		font-size: 0.8125rem;
		font-variant-numeric: tabular-nums;
		text-align: center;
	}

	.docs-empty {
		margin: 0;
		color: var(--color-muted);
		font-size: 0.9375rem;
	}

	.docs-list {
		display: grid;
		gap: 0.75rem;
		margin: 0;
		padding: 0;
		list-style: none;
	}

	.docs-item-form {
		margin: 0;
	}

	.docs-item {
		display: grid;
		gap: 0.5rem;
		width: 100%;
		padding: 1rem;
		border: 1px solid var(--color-border);
		border-radius: var(--radius-lg, 12px);
		background: transparent;
		color: inherit;
		font: inherit;
		text-align: left;
		text-decoration: none;
		cursor: pointer;
		transition:
			border-color 0.15s ease,
			background 0.15s ease;
	}

	.docs-item:hover {
		border-color: var(--color-accent);
		background: var(--color-surface-hover, rgb(15 23 42 / 3%));
	}

	.docs-item:focus-visible {
		outline: 2px solid var(--color-accent);
		outline-offset: 2px;
	}

	.docs-item-top {
		display: flex;
		align-items: flex-start;
		justify-content: space-between;
		gap: 0.75rem;
	}

	.docs-item-title {
		font-weight: 600;
		line-height: 1.35;
	}

	.docs-item-sub {
		color: var(--color-muted);
		font-size: 0.8125rem;
	}

	.docs-badge {
		flex-shrink: 0;
		padding: 0.15rem 0.55rem;
		border-radius: 999px;
		font-size: 0.75rem;
		font-weight: 600;
		white-space: nowrap;
		background: var(--color-surface-hover, rgb(15 23 42 / 6%));
		color: var(--color-muted);
	}

	.docs-badge[data-tone='active'] {
		background: rgb(234 179 8 / 15%);
		color: #92400e;
	}

	.docs-badge[data-tone='done'] {
		background: rgb(34 197 94 / 15%);
		color: #166534;
	}

	:global([data-theme='dark']) .docs-badge[data-tone='active'] {
		color: #fcd34d;
	}

	:global([data-theme='dark']) .docs-badge[data-tone='done'] {
		color: #86efac;
	}

	.docs-progress {
		display: block;
		height: 6px;
		border-radius: 999px;
		background: var(--color-border);
		overflow: hidden;
	}

	.docs-progress-bar {
		display: block;
		height: 100%;
		border-radius: inherit;
		background: var(--color-accent);
	}

	.docs-item-meta {
		display: flex;
		justify-content: space-between;
		gap: 0.75rem;
		color: var(--color-muted);
		font-size: 0.8125rem;
		font-variant-numeric: tabular-nums;
	}

	.docs-item-cta {
		display: inline-flex;
		align-items: center;
		gap: 0.3rem;
		color: var(--color-accent);
		font-size: 0.875rem;
		font-weight: 500;
	}

	@media (max-width: 767px) {
		.docs-grid {
			grid-template-columns: minmax(0, 1fr);
		}
	}
</style>
