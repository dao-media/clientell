<script lang="ts">
	let {
		value = $bindable(null),
		disabled = false,
		label
	}: {
		value?: string | null;
		disabled?: boolean;
		label: string;
	} = $props();

	let canvas: HTMLCanvasElement | undefined = $state();
	let drawing = false;

	function pad(node: HTMLCanvasElement, png: string | null | undefined) {
		canvas = node;
		let lastWidth = 0;
		let current = png ?? null;

		function strokeStyle() {
			const ctx = node.getContext('2d');
			if (!ctx) return null;
			const dpr = Math.max(window.devicePixelRatio || 1, 1);
			ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
			ctx.lineCap = 'round';
			ctx.lineJoin = 'round';
			ctx.strokeStyle = '#141414';
			ctx.lineWidth = 1.75;
			return ctx;
		}

		function paint(src: string | null) {
			if (!src) return;
			const rect = node.getBoundingClientRect();
			const ctx = node.getContext('2d');
			if (!ctx || rect.width < 2) return;
			const img = new Image();
			img.onload = () => ctx.drawImage(img, 0, 0, rect.width, rect.height);
			img.src = src;
		}

		function size() {
			const rect = node.getBoundingClientRect();
			if (rect.width < 2) return;
			if (Math.abs(rect.width - lastWidth) < 0.5 && node.width > 0) return;
			lastWidth = rect.width;
			const dpr = Math.max(window.devicePixelRatio || 1, 1);
			node.width = Math.round(rect.width * dpr);
			node.height = Math.round(rect.height * dpr);
			strokeStyle();
			paint(current);
		}

		const observer = new ResizeObserver(size);
		observer.observe(node);
		size();
		paint(current);

		return {
			update(next: string | null | undefined) {
				current = next ?? null;
				paint(current);
			},
			destroy() {
				observer.disconnect();
			}
		};
	}

	function point(event: PointerEvent) {
		if (!canvas) return { x: 0, y: 0 };
		const rect = canvas.getBoundingClientRect();
		return { x: event.clientX - rect.left, y: event.clientY - rect.top };
	}

	function start(event: PointerEvent) {
		if (disabled || !canvas) return;
		event.preventDefault();
		canvas.setPointerCapture(event.pointerId);
		drawing = true;
		const ctx = canvas.getContext('2d');
		if (!ctx) return;
		const { x, y } = point(event);
		ctx.beginPath();
		ctx.moveTo(x, y);
	}

	function move(event: PointerEvent) {
		if (!drawing || !canvas) return;
		event.preventDefault();
		const ctx = canvas.getContext('2d');
		if (!ctx) return;
		const { x, y } = point(event);
		ctx.lineTo(x, y);
		ctx.stroke();
		ctx.beginPath();
		ctx.moveTo(x, y);
	}

	function end() {
		if (!drawing || !canvas) return;
		drawing = false;
		value = canvas.toDataURL('image/png');
	}

	function clear() {
		if (disabled || !canvas) return;
		const ctx = canvas.getContext('2d');
		if (!ctx) return;
		ctx.clearRect(0, 0, canvas.width, canvas.height);
		value = null;
	}
</script>

<div class="sig">
	<canvas
		bind:this={canvas}
		use:pad={value}
		class="sig-pad"
		class:is-disabled={disabled}
		aria-label={label}
		onpointerdown={start}
		onpointermove={move}
		onpointerup={end}
		onpointercancel={end}
	></canvas>
	{#if !disabled}
		<button class="sig-clear" type="button" onclick={clear}>Clear</button>
	{/if}
</div>

<style>
	.sig {
		position: relative;
		width: 100%;
	}

	.sig-pad {
		display: block;
		width: 100%;
		height: 56px;
		border: 1px solid rgba(118, 118, 128, 0.12);
		border-radius: 4px;
		background: rgba(118, 118, 128, 0.12);
		touch-action: none;
		cursor: crosshair;
	}

	.sig-pad.is-disabled {
		cursor: default;
	}

	.sig-clear {
		position: absolute;
		top: 4px;
		right: 6px;
		border: 0;
		background: transparent;
		color: #474747;
		font-size: 8px;
		letter-spacing: -0.16px;
		cursor: pointer;
	}
</style>
