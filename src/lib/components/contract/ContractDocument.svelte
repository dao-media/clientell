<script lang="ts">
	import SignaturePad from './SignaturePad.svelte';
	import { packAssembly } from '$lib/contract/document-model';
	import {
		COLOR,
		PAGE,
		paginateContract,
		type LaidCard
	} from '$lib/contract/layout';
	import type { AssemblyResult, ContractSignatures } from '$lib/contract/types';

	let {
		assembly,
		signatures = {
			clientPng: null,
			designerPng: null,
			clientSignedAt: null,
			designerSignedAt: null
		},
		role = null,
		clientName,
		designerName,
		clientPng = $bindable(null),
		designerPng = $bindable(null)
	}: {
		assembly: AssemblyResult;
		signatures?: ContractSignatures;
		role?: 'client' | 'designer' | null;
		clientName?: string;
		designerName?: string;
		clientPng?: string | null;
		designerPng?: string | null;
	} = $props();

	const pages = $derived.by(() => {
		const packed = packAssembly(assembly);
		const vars = assembly.variables;
		return paginateContract({
			documents: packed,
			lastUpdated: vars.last_updated || '',
			clientName: clientName ?? vars.legal_name ?? '',
			designerName: designerName ?? vars.designer_display ?? '',
			clientDate: formatSigned(signatures.clientSignedAt),
			designerDate: formatSigned(signatures.designerSignedAt)
		});
	});

	function formatSigned(value: Date | null): string {
		if (!value) return '';
		return new Intl.DateTimeFormat('en-US', { dateStyle: 'long' }).format(value);
	}

	function radius(card: LaidCard): string {
		const { tl, tr, br, bl } = card.radius;
		return `${tl}px ${tr}px ${br}px ${bl}px`;
	}

	function cardStyle(card: LaidCard) {
		return {
			background: card.kind === 'preamble' ? COLOR.preamble : COLOR.section,
			borderRadius: radius(card)
		};
	}
</script>

<div class="packet" style:--page-w="{PAGE.width}px" style:--page-h="{PAGE.height}px">
	{#each pages as page (page.page)}
		<article class="page" aria-label="Page {page.page} of {page.total}">
			<div class="page-stack">
				<header class="header" class:is-full={page.header === 'full'}>
					<div class="header-titles">
						<p class="doc-line1">{page.line1}</p>
						<p class="doc-line2">{page.line2}</p>
					</div>
					<p class="updated">
						Last Updated: <strong>{page.lastUpdated}</strong>
					</p>
				</header>

				<div class="body">
					{#each page.cards as card, index (card.sectionId + index)}
						<section
							class="card"
							class:is-preamble={card.kind === 'preamble'}
							style:background={cardStyle(card).background}
							style:border-radius={cardStyle(card).borderRadius}
						>
							{#if card.title}
								<div class="card-title">
									{#if card.title.number}
										<span class="num">{card.title.number}</span>
									{/if}
									<span>{card.title.text}</span>
								</div>
							{/if}

							{#if card.columns}
								<div class="preamble-cols">
									<div class="col">
										{#each card.columns.left as para}
											<p class="para">
												{#each para as line, li (li)}
													<span class="line">
														{#each line as run}
															{#if run.bold}<strong>{run.text}</strong>{:else}{run.text}{/if}
														{/each}
													</span>
												{/each}
											</p>
										{/each}
									</div>
									<div class="col">
										{#each card.columns.right as para}
											<p class="para">
												{#each para as line, li (li)}
													<span class="line">
														{#each line as run}
															{#if run.bold}<strong>{run.text}</strong>{:else}{run.text}{/if}
														{/each}
													</span>
												{/each}
											</p>
										{/each}
									</div>
								</div>
							{/if}

							{#if card.items.length}
								<div class="items">
									{#each card.items as item}
										<div class="item">
											<span class="item-num">{item.number}</span>
											<div class="item-body">
												{#each item.paragraphs as para}
													<p class="para">
														{#each para as line, li (li)}
															<span class="line">
																{#each line as run}
																	{#if run.bold}<strong>{run.text}</strong>{:else}{run.text}{/if}
																{/each}
															</span>
														{/each}
													</p>
												{/each}
												{#if item.bullets.length}
													<ul>
														{#each item.bullets as bullet}
															<li>
																{#each bullet as line, li (li)}
																	<span class="line">
																		{#each line as run}
																			{#if run.bold}<strong>{run.text}</strong>{:else}{run.text}{/if}
																		{/each}
																	</span>
																{/each}
															</li>
														{/each}
													</ul>
												{/if}
											</div>
										</div>
									{/each}
								</div>
							{/if}
						</section>
					{/each}

					{#if page.signatures}
						<section class="signatures">
							<div class="sig-heading">Signatures</div>
							<div class="sig-fields">
								<div class="sig-row">
									<div class="sig-col">
										<p class="sig-label">
											<strong>{page.signatures.clientName || '{{Client Name}}'}</strong>
											<span> / “The Client”</span>
										</p>
										<SignaturePad
											bind:value={clientPng}
											disabled={role !== 'client' || Boolean(signatures.clientPng)}
											label="Client signature"
										/>
									</div>
									<div class="sig-col">
										<p class="sig-label">
											<strong>{page.signatures.designerName}</strong>
											<span> / “The Designer”</span>
										</p>
										<SignaturePad
											bind:value={designerPng}
											disabled={role !== 'designer' || Boolean(signatures.designerPng)}
											label="Designer signature"
										/>
									</div>
								</div>
								<div class="sig-dates">
									<p>
										<span class="date-label">Date Signed:</span>
										<strong>{page.signatures.clientDate || '—'}</strong>
									</p>
									<p>
										<span class="date-label">Date Signed:</span>
										<strong>{page.signatures.designerDate || '—'}</strong>
									</p>
								</div>
							</div>
						</section>
					{/if}
				</div>
			</div>

			<footer class="footer">
				<div class="on-page">
					<span class="on-page-label">On this page:</span>
					<span class="on-page-list">{page.footerLabels.join(', ')}</span>
				</div>
				<div class="page-badge">
					<span>{page.page}</span>
					<span class="pipe">|</span>
					<span>{page.total}</span>
				</div>
			</footer>
		</article>
	{/each}
</div>

<style>
	.packet {
		display: grid;
		gap: 24px;
		justify-items: center;
		font-family: 'Segoe UI', Inter, ui-sans-serif, system-ui, sans-serif;
		color: #141414;
	}

	.page {
		width: var(--page-w);
		height: var(--page-h);
		display: flex;
		flex-direction: column;
		gap: 12px;
		padding: 16px;
		background: #fff;
		box-shadow: 0 8px 32px rgba(20, 20, 20, 0.08);
		overflow: hidden;
	}

	.page-stack {
		flex: 1 0 0;
		min-height: 0;
		display: flex;
		flex-direction: column;
		gap: 8px;
		width: 100%;
	}

	.header {
		display: flex;
		align-items: flex-end;
		justify-content: space-between;
		width: 100%;
		flex-shrink: 0;
	}

	.header.is-full .doc-line1 {
		font-size: 22px;
		font-weight: 700;
		letter-spacing: -0.22px;
		line-height: normal;
	}

	.header.is-full .doc-line2 {
		font-size: 20px;
		font-weight: 300;
		letter-spacing: -0.4px;
		line-height: 20px;
	}

	.header:not(.is-full) {
		gap: 0;
	}

	.page:has(.header:not(.is-full)) .page-stack {
		gap: 6px;
	}

	.header:not(.is-full) .doc-line1 {
		font-size: 12px;
		font-weight: 600;
		letter-spacing: -0.12px;
		line-height: normal;
	}

	.header:not(.is-full) .doc-line2 {
		font-size: 10px;
		font-weight: 400;
		letter-spacing: -0.2px;
		line-height: normal;
	}

	.header-titles {
		flex: 1;
		min-width: 0;
	}

	.header-titles p {
		margin: 0;
	}

	.updated {
		margin: 0;
		padding-bottom: 4px;
		font-size: 10px;
		letter-spacing: -0.2px;
		white-space: nowrap;
	}

	.updated strong {
		font-weight: 600;
	}

	.body {
		flex: 1 0 0;
		min-height: 0;
		display: flex;
		flex-direction: column;
		gap: 4px;
		width: 100%;
		overflow: hidden;
	}

	.card {
		padding: 16px;
		width: 100%;
		flex-shrink: 0;
		overflow: hidden;
	}

	.card-title {
		display: flex;
		gap: 2px;
		align-items: center;
		font-size: 16px;
		font-weight: 600;
		letter-spacing: -0.32px;
		line-height: normal;
		margin-bottom: 16px;
	}

	.is-preamble .card-title {
		margin-bottom: 10px;
	}

	.card-title .num {
		width: 28px;
		flex-shrink: 0;
	}

	.preamble-cols {
		display: flex;
		gap: 18px;
		width: 100%;
	}

	.col {
		flex: 1 0 0;
		min-width: 0;
		font-size: 12px;
		letter-spacing: -0.24px;
	}

	.items {
		display: flex;
		flex-direction: column;
		gap: 12px;
		width: 100%;
	}

	.item {
		display: flex;
		gap: 2px;
		align-items: flex-start;
		padding-left: 30px;
		width: 100%;
		font-size: 12px;
		letter-spacing: -0.24px;
	}

	.item-num {
		width: 28px;
		flex-shrink: 0;
		font-weight: 600;
		line-height: 16px;
	}

	.item-body {
		flex: 1 0 0;
		min-width: 0;
	}

	.para {
		margin: 0 0 12px;
	}

	.para strong,
	.line strong {
		font-weight: 700;
	}

	.para:last-child {
		margin-bottom: 0;
	}

	.line {
		display: block;
		line-height: 16px;
	}

	.item-body ul {
		margin: 0;
		padding-left: 18px;
	}

	.item-body li {
		line-height: 16px;
	}

	.signatures {
		display: flex;
		flex-direction: column;
		gap: 12px;
		margin-top: auto;
		padding-top: 12px;
		width: 100%;
	}

	.sig-fields {
		display: flex;
		flex-direction: column;
		gap: 4px;
		width: 100%;
	}

	.sig-heading {
		border-bottom: 1px solid #474747;
		padding-bottom: 6px;
		font-size: 14px;
		font-weight: 600;
		letter-spacing: -0.28px;
		color: #141414;
	}

	.sig-row,
	.sig-dates {
		display: flex;
		gap: 12px;
		width: 100%;
	}

	.sig-col,
	.sig-dates p {
		flex: 1 0 0;
		min-width: 0;
	}

	.sig-col {
		display: flex;
		flex-direction: column;
		gap: 6px;
	}

	.sig-label,
	.sig-dates p {
		margin: 0;
		font-size: 10px;
		letter-spacing: -0.2px;
		color: #474747;
	}

	.sig-dates p {
		display: flex;
		gap: 6px;
		color: #000;
		align-items: flex-start;
	}

	.date-label {
		width: 64px;
		flex-shrink: 0;
	}

	.footer {
		display: flex;
		align-items: flex-end;
		justify-content: space-between;
		width: 100%;
		flex-shrink: 0;
		min-height: 22px;
	}

	.on-page {
		display: flex;
		gap: 10px;
		flex: 1 0 0;
		min-width: 0;
		padding-right: 86px;
		font-size: 8px;
		letter-spacing: -0.16px;
		line-height: normal;
	}

	.on-page-label {
		white-space: nowrap;
	}

	.on-page-list {
		font-weight: 600;
		min-width: 0;
	}

	.page-badge {
		display: flex;
		align-items: center;
		gap: 2px;
		padding: 2px 6px;
		border: 0.6px solid rgba(128, 128, 128, 0.4);
		border-radius: 4px;
		background: rgba(128, 128, 128, 0.1);
		color: #474747;
		font-family: 'Space Grotesk', Inter, sans-serif;
		font-size: 7px;
		font-weight: 500;
		letter-spacing: -0.14px;
		line-height: 7px;
		white-space: nowrap;
		flex-shrink: 0;
	}

	.pipe {
		font-weight: 300;
	}

	@media (max-width: 640px) {
		.packet {
			justify-items: stretch;
		}

		.page {
			width: 100%;
			height: auto;
			min-height: auto;
			aspect-ratio: auto;
		}

		.body {
			overflow: visible;
		}
	}
</style>
