<script lang="ts">
	import Field from '$lib/components/ui/Field.svelte';
	import Plus from '@lucide/svelte/icons/plus';
	import X from '@lucide/svelte/icons/x';

	type Link = { label: string; url: string };
	type LinkRow = Link & { key: number };

	let {
		values = {},
		errors = {},
		socialLinks = [],
		minPasswordLength = 8,
		passwordMode = 'create'
	}: {
		values?: Record<string, string>;
		errors?: Record<string, string>;
		socialLinks?: Link[];
		minPasswordLength?: number;
		passwordMode?: 'create' | 'change';
	} = $props();

	let nextKey = 1;
	const blank = () => ({ key: nextKey++, label: '', url: '' });
	// Seed once from props; the rows are local editing state after that.
	// svelte-ignore state_referenced_locally
	let links = $state<LinkRow[]>(
		socialLinks.length ? socialLinks.map((link) => ({ key: nextKey++, ...link })) : [blank()]
	);

	function addLink() {
		const row = blank();
		links = [...links, row];
		queueMicrotask(() => document.getElementById(`social-label-${row.key}`)?.focus());
	}

	function removeLink(key: number) {
		links = links.length === 1 ? [blank()] : links.filter((l) => l.key !== key);
	}
</script>

<fieldset class="form-section">
	<legend class="form-section__legend">You</legend>
	<div class="form-row">
		<Field labelText="First name" name="firstName" id="setup-first" required autocomplete="given-name" value={values.firstName ?? ''} invalidText={errors.firstName} />
		<Field labelText="Last name" name="lastName" id="setup-last" required autocomplete="family-name" value={values.lastName ?? ''} invalidText={errors.lastName} />
	</div>
	<div class="form-row">
		<Field labelText="Email" type="email" name="email" id="setup-email" required autocomplete="email" value={values.email ?? ''} invalidText={errors.email} />
		<Field labelText="Phone" type="tel" name="phone" id="setup-phone" autocomplete="tel" value={values.phone ?? ''} />
	</div>
</fieldset>

<fieldset class="form-section">
	<legend class="form-section__legend">Business</legend>
	<div class="form-row">
		<Field
			labelText="Business, brand, agency or DBA"
			name="businessName"
			id="setup-business"
			required
			autocomplete="organization"
			value={values.businessName ?? ''}
			invalidText={errors.businessName}
		/>
		<Field labelText="Website" type="url" name="website" id="setup-website" placeholder="yourstudio.com" autocomplete="url" value={values.website ?? ''} />
	</div>

	<div class="social-links" role="group" aria-labelledby="social-links-label">
		<p class="social-links__title" id="social-links-label">Social media links</p>
		<ul class="social-list">
			{#each links as link, index (link.key)}
				<li class="social-row">
					<div class="float-field">
						<input
							class="field"
							id="social-label-{link.key}"
							name="socialLabel"
							placeholder="LinkedIn"
							bind:value={link.label}
						/>
						<label class="float-field__label" for="social-label-{link.key}">Platform</label>
					</div>
					<div class="float-field">
						<input
							class="field"
							id="social-url-{link.key}"
							name="socialUrl"
							type="url"
							placeholder="linkedin.com/in/you"
							bind:value={link.url}
						/>
						<label class="float-field__label" for="social-url-{link.key}">Profile URL</label>
					</div>
					<button
						type="button"
						class="social-remove"
						aria-label="Remove link {index + 1}{link.label ? ` (${link.label})` : ''}"
						onclick={() => removeLink(link.key)}
					>
						<X size={18} aria-hidden="true" />
					</button>
				</li>
			{/each}
		</ul>
		<button type="button" class="social-add" onclick={addLink}>
			<Plus size={16} aria-hidden="true" /> Add link
		</button>
	</div>
</fieldset>

<fieldset class="form-section" aria-describedby="setup-password-hint">
	<legend class="form-section__legend">{passwordMode === 'create' ? 'Admin password' : 'Change password'}</legend>
	<div class="form-row" class:form-row--3={passwordMode === 'change'}>
		{#if passwordMode === 'change'}
			<Field
				labelText="Current password"
				type="password"
				name="currentPassword"
				id="setup-password-current"
				autocomplete="current-password"
				invalidText={errors.currentPassword}
			/>
		{/if}
		<Field
			labelText={passwordMode === 'create' ? 'Password' : 'New password'}
			type="password"
			name="password"
			id="setup-password"
			required={passwordMode === 'create'}
			autocomplete="new-password"
			minlength={minPasswordLength}
			invalidText={errors.password}
		/>
		<Field
			labelText="Confirm password"
			type="password"
			name="passwordConfirm"
			id="setup-password-confirm"
			required={passwordMode === 'create'}
			autocomplete="new-password"
			invalidText={errors.passwordConfirm}
		/>
	</div>
	<p class="help" id="setup-password-hint">
		{passwordMode === 'create'
			? `Use at least ${minPasswordLength} characters.`
			: `Leave these blank to keep your current password. New passwords need at least ${minPasswordLength} characters.`}
	</p>
</fieldset>

<style>
	.social-links {
		display: grid;
		gap: var(--space-3);
	}

	.social-links__title {
		margin: 0;
		color: var(--color-ink);
		font-size: 0.875rem;
		font-weight: 600;
	}

	.social-list {
		display: grid;
		gap: var(--field-gap);
		margin: 0;
		padding: 0;
		list-style: none;
	}

	.social-row {
		display: grid;
		grid-template-columns: minmax(0, 2fr) minmax(0, 3fr) auto;
		gap: var(--space-3);
		align-items: center;
	}

	.social-remove,
	.social-add {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		gap: var(--space-2);
		min-width: 2.75rem;
		min-height: 2.75rem;
		border: 0;
		border-radius: var(--control-radius);
		background: transparent;
		font: inherit;
		cursor: pointer;
	}

	.social-remove {
		color: var(--color-muted);
	}

	.social-remove:hover {
		color: var(--color-error);
		background: var(--color-surface-hover);
	}

	.social-add {
		justify-self: start;
		padding-inline: var(--space-2);
		color: var(--color-accent);
		font-size: 0.9375rem;
		font-weight: 600;
	}

	.social-add:hover {
		background: var(--color-surface-hover);
	}

	.social-remove:focus-visible,
	.social-add:focus-visible {
		outline: 2px solid var(--color-focus-ring);
		outline-offset: 2px;
	}

	@media (max-width: 640px) {
		.social-row {
			grid-template-columns: minmax(0, 1fr) auto;
		}

		.social-row > :first-child {
			grid-column: 1 / -1;
		}
	}
</style>
