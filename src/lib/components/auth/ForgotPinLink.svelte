<script lang="ts">
	import { base } from '$app/paths';
</script>

<a class="auth-helper-link" href="{base}/portal/forgot-pin">Forgot PIN?</a>

<style>
	.auth-helper-link {
		font-size: 0.875rem;
		color: var(--color-muted);
		text-decoration: underline;
		text-underline-offset: 0.15em;
	}

	.auth-helper-link:hover {
		color: var(--color-text);
	}
</style>
