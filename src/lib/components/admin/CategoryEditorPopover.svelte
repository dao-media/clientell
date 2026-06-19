<script lang="ts">
	import { enhance } from '$app/forms';
	import { refreshAfterQuestionChange } from '$lib/admin/refresh-data';
	import Btn from '$lib/components/Btn.svelte';
	import Alert from '$lib/components/ui/Alert.svelte';
	import Field from '$lib/components/ui/Field.svelte';
	import { CATEGORY_COLOR_PRESETS, type QuestionCategory } from '$lib/categories';

	const PANEL_WIDTH = 20;

	function normalizeHex(value: string) {
		return value.trim().toLowerCase();
	}

	let {
		open = $bindable(false),
		anchor = null,
		setId,
		category = null,
		error = '',
		onclose
	}: {
		open?: boolean;
		anchor?: DOMRect | null;
		setId: string;
		category?: QuestionCategory | null;
		error?: string;
		onclose?: () => void;
	} = $props();

	let name = $state('');
	let color = $state<string>(CATEGORY_COLOR_PRESETS[0]);
	let colorInput = $state<HTMLInputElement | undefined>();

	$effect(() => {
		if (open) {
			name = category?.name ?? '';
			color = category?.color ?? CATEGORY_COLOR_PRESETS[0];
		}
	});

	const isPresetColor = $derived(
		CATEGORY_COLOR_PRESETS.some((preset) => normalizeHex(preset) === normalizeHex(color))
	);

	const isEdit = $derived(Boolean(category?.id));
	const heading = $derived(isEdit ? 'Edit category' : 'New category');

	const panelStyle = $derived.by(() => {
		if (!anchor) return 'display: none;';

		const widthRem = PANEL_WIDTH;
		const maxLeft = window.innerWidth - widthRem * 16 - 16;
		const left = Math.max(16, Math.min(anchor.left, maxLeft));
		const top = anchor.bottom + 8;

		return `top: ${top}px; left: ${left}px; width: min(${widthRem}rem, calc(100vw - 2rem));`;
	});

	function close() {
		open = false;
		onclose?.();
	}

	function onBackdropClick(event: MouseEvent) {
		if (event.target === event.currentTarget) close();
	}

	$effect(() => {
		if (!open) return;

		function onKeydown(event: KeyboardEvent) {
			if (event.key === 'Escape') close();
		}

		window.addEventListener('keydown', onKeydown);
		return () => window.removeEventListener('keydown', onKeydown);
	});
</script>

{#if open && anchor}
	<div class="category-popover-backdrop" onclick={onBackdropClick} role="presentation"></div>
	<div class="category-popover" role="dialog" aria-modal="true" aria-labelledby="category-popover-title" style={panelStyle}>
		<header class="popover-header">
			<h2 id="category-popover-title">{heading}</h2>
			<button type="button" class="close-button" aria-label="Close" onclick={close}>×</button>
		</header>

		<form
			method="POST"
			action="?/saveCategory"
			class="category-form"
			use:enhance={() => {
				return async ({ result, update }) => {
					await update({ reset: false, invalidateAll: false });
					if (result.type === 'success') {
						await refreshAfterQuestionChange();
						close();
					}
				};
			}}
		>
			<input type="hidden" name="setId" value={setId} />
			{#if category?.id}
				<input type="hidden" name="categoryId" value={category.id} />
			{/if}
			<input type="hidden" name="color" value={color} />

			<Field labelText="Category name" name="name" bind:value={name} required />

			<div class="color-section">
				<p class="color-label">Color</p>
				<div class="color-presets" role="radiogroup" aria-label="Category color">
					{#each CATEGORY_COLOR_PRESETS as preset (preset)}
						<button
							type="button"
							class="color-swatch"
							class:selected={normalizeHex(color) === normalizeHex(preset)}
							style:background={preset}
							role="radio"
							aria-checked={normalizeHex(color) === normalizeHex(preset)}
							aria-label="Use color {preset}"
							onclick={() => (color = preset)}
						></button>
					{/each}
					<button
						type="button"
						class="color-swatch color-swatch-custom"
						class:selected={!isPresetColor}
						class:has-custom-value={!isPresetColor}
						style:--custom-color={color}
						role="radio"
						aria-checked={!isPresetColor}
						aria-label="Custom color"
						onclick={() => colorInput?.click()}
					>
						<span class="color-swatch-custom-fill" aria-hidden="true"></span>
					</button>
					<input
						bind:this={colorInput}
						type="color"
						class="color-input-hidden"
						bind:value={color}
						tabindex="-1"
						aria-hidden="true"
					/>
				</div>
			</div>

			{#if error}
				<Alert variant="error" title="Could not save category" subtitle={error} />
			{/if}

			<div class="form-actions">
				<Btn variant="secondary" type="button" onclick={close}>Cancel</Btn>
				<Btn type="submit">{isEdit ? 'Save changes' : 'Add category'}</Btn>
			</div>
		</form>
	</div>
{/if}

<style>
	.category-popover-backdrop {
		position: fixed;
		inset: 0;
		z-index: 8400;
		background: transparent;
	}

	.category-popover {
		position: fixed;
		z-index: 8500;
		background: var(--color-surface);
		border: 1px solid var(--color-border);
		box-shadow: 0 8px 24px rgb(0 0 0 / 18%);
		padding: 1rem;
		border-radius: var(--radius-lg);
	}

	.popover-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 0.75rem;
		margin-bottom: 0.75rem;
	}

	.popover-header h2 {
		font-size: 0.95rem;
		font-weight: 600;
	}

	.close-button {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		width: 1.75rem;
		height: 1.75rem;
		border: 0;
		border-radius: var(--radius);
		background: transparent;
		color: var(--color-ink);
		font-size: 1.375rem;
		line-height: 1;
		cursor: pointer;
	}

	.close-button:hover {
		background: var(--color-surface-hover);
	}

	.category-form {
		display: grid;
		gap: 0.875rem;
	}

	.color-section {
		display: grid;
		gap: 0.5rem;
	}

	.color-label {
		font-size: 0.875rem;
		font-weight: 600;
	}

	.color-presets {
		display: flex;
		flex-wrap: wrap;
		gap: 0.5rem;
		align-items: center;
	}

	.color-swatch {
		width: 1.75rem;
		height: 1.75rem;
		border-radius: var(--radius);
		border: 2px solid transparent;
		cursor: pointer;
		padding: 0;
		flex-shrink: 0;
	}

	.color-swatch.selected {
		border-color: var(--color-ink);
		box-shadow: 0 0 0 2px var(--color-surface);
	}

	.color-swatch-custom {
		position: relative;
		overflow: hidden;
		background: transparent;
	}

	.color-swatch-custom-fill {
		position: absolute;
		inset: 0;
		border-radius: inherit;
		background: conic-gradient(
			from 210deg,
			#fa4d56 0deg,
			#f1c21b 60deg,
			#198038 120deg,
			#1192e8 210deg,
			#8a3ffc 300deg,
			#fa4d56 360deg
		);
	}

	.color-swatch-custom.has-custom-value .color-swatch-custom-fill {
		background: var(--custom-color);
	}

	.color-input-hidden {
		position: absolute;
		width: 1px;
		height: 1px;
		padding: 0;
		margin: -1px;
		overflow: hidden;
		clip: rect(0, 0, 0, 0);
		white-space: nowrap;
		border: 0;
	}

	.form-actions {
		display: flex;
		gap: 0.5rem;
		flex-wrap: wrap;
		justify-content: flex-end;
	}

	@media (max-width: 767px) {
		.category-popover-backdrop {
			background: rgb(15 23 42 / 40%);
		}

		.category-popover {
			top: auto !important;
			left: 0 !important;
			right: 0 !important;
			bottom: 0 !important;
			width: 100% !important;
			max-height: min(90vh, 100dvh);
			overflow-y: auto;
			border-left: 0;
			border-right: 0;
			border-bottom: 0;
			border-radius: var(--radius-lg) var(--radius-lg) 0 0;
			padding: 1.25rem 1rem calc(1.25rem + env(safe-area-inset-bottom, 0px));
		}
	}
</style>
