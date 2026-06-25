<script lang="ts">
	import { page } from '$app/stores';
	import { AUTH_DEBUG_PREFIX, getAuthDebugLog, type AuthDebugEntry } from '$lib/debug/auth-debug';

	let {
		serverDebug
	}: {
		serverDebug?: Record<string, unknown> | null;
	} = $props();

	let visible = $derived($page.url.searchParams.get('debug') === 'auth');
	let entries = $state<readonly AuthDebugEntry[]>([]);

	$effect(() => {
		if (!visible) return;

		const refresh = () => {
			entries = getAuthDebugLog();
		};

		refresh();
		const id = window.setInterval(refresh, 500);
		return () => window.clearInterval(id);
	});
</script>

{#if visible}
	<aside class="auth-debug-panel" aria-label="Auth debug log">
		<p class="auth-debug-title">{AUTH_DEBUG_PREFIX} client log ({entries.length})</p>
		<p class="auth-debug-hint">
			Share this panel if sign-in fails. PINs are masked; char codes help spot hidden characters.
		</p>
		{#if serverDebug}
			<div class="auth-debug-server">
				<p class="auth-debug-title">Last server response</p>
				<pre>{JSON.stringify(serverDebug, null, 2)}</pre>
			</div>
		{/if}
		{#if entries.length === 0}
			<p class="auth-debug-empty">No events yet. Try signing in to populate the log.</p>
		{:else}
			<ol class="auth-debug-list">
				{#each entries as entry, index (entry.ts + entry.scope + index)}
					<li>
						<span class="auth-debug-ts">{entry.ts.slice(11, 19)}</span>
						<strong>{entry.scope}</strong>
						<pre>{JSON.stringify(entry.data, null, 2)}</pre>
					</li>
				{/each}
			</ol>
		{/if}
	</aside>
{/if}

<style>
	.auth-debug-panel {
		margin: 1rem 0 0;
		padding: 0.75rem;
		border: 1px dashed var(--color-warning);
		border-radius: var(--radius);
		background: color-mix(in srgb, var(--color-warning) 8%, var(--color-surface));
		font-size: 0.75rem;
		max-height: 16rem;
		overflow: auto;
	}

	.auth-debug-title {
		margin: 0 0 0.35rem;
		font-weight: 600;
	}

	.auth-debug-hint,
	.auth-debug-empty {
		margin: 0 0 0.5rem;
		color: var(--color-muted);
	}

	.auth-debug-server {
		margin: 0 0 0.75rem;
	}

	.auth-debug-list {
		margin: 0;
		padding: 0;
		list-style: none;
		display: grid;
		gap: 0.5rem;
	}

	.auth-debug-ts {
		color: var(--color-muted);
		margin-right: 0.35rem;
	}

	pre {
		margin: 0.25rem 0 0;
		padding: 0.35rem 0.45rem;
		border-radius: var(--radius);
		background: var(--color-surface-muted);
		overflow-x: auto;
		white-space: pre-wrap;
		word-break: break-word;
	}
</style>
