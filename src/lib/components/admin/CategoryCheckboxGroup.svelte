<script lang="ts">
	import CategoryTagPicker from '$lib/components/admin/CategoryTagPicker.svelte';
	import type { QuestionCategory } from '$lib/categories';

	let {
		categories,
		selected = $bindable([]),
		name = 'categories',
		disabled = false,
		legend = 'Categories',
		required = false
	}: {
		categories: QuestionCategory[];
		selected?: string[];
		name?: string;
		disabled?: boolean;
		legend?: string;
		required?: boolean;
	} = $props();
</script>

<CategoryTagPicker
	{categories}
	bind:selected
	{name}
	{disabled}
	{legend}
	{required}
	placeholder="Search or select categories…"
/>
