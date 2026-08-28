<script lang="ts">
	import logoForLightBackground from '../../../brand/ClienTell_Wide - dark.svg';
	import logoForDarkBackground from '../../../brand/ClienTell_Wide - light.svg';
</script>

<span class="brand-logo">
	<img
		class="brand-logo-image brand-logo-image--light-background"
		src={logoForLightBackground}
		alt="ClienTell"
	/>
	<img
		class="brand-logo-image brand-logo-image--dark-background"
		src={logoForDarkBackground}
		alt=""
		aria-hidden="true"
	/>
</span>

<style>
	.brand-logo {
		position: relative;
		display: block;
		width: var(--brand-logo-width, 8rem);
		aspect-ratio: 6.05;
		overflow: hidden;
	}

	.brand-logo-image {
		position: absolute;
		top: -89.25%;
		left: -8.73%;
		display: block;
		width: 118.47%;
		height: auto;
		max-width: none;
		transition: opacity 0.15s ease;
	}

	.brand-logo-image--light-background {
		opacity: 1;
	}

	.brand-logo-image--dark-background {
		opacity: 0;
	}

	:global([data-theme='dark']) .brand-logo-image--light-background {
		opacity: 0;
	}

	:global([data-theme='dark']) .brand-logo-image--dark-background {
		opacity: 1;
	}
</style>
