<script lang="ts">
	let {
		label = '',
		labelText = '',
		checked = $bindable(false),
		hideLabel = false,
		id,
		onchange,
		...rest
	}: {
		label?: string;
		labelText?: string;
		checked?: boolean;
		hideLabel?: boolean;
		id?: string;
		onchange?: (event: Event) => void;
		[key: string]: unknown;
	} = $props();

	const resolvedLabel = $derived(labelText || label);
</script>

<label class="checkbox" class:checkbox-hide-label={hideLabel}>
	<input type="checkbox" bind:checked {id} {onchange} {...rest} />
	{#if !hideLabel && resolvedLabel}
		<span>{resolvedLabel}</span>
	{/if}
</label>
