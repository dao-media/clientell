<script lang="ts">
	import Select from '$lib/components/ui/Select.svelte';
	import {
		DEFAULT_LOGIN_DURATION,
		LOGIN_DURATION_OPTIONS,
		type LoginDuration
	} from '$lib/auth/login-duration';

	let {
		name = 'loginDuration',
		id = 'login-duration',
		value = $bindable<LoginDuration>(DEFAULT_LOGIN_DURATION)
	}: {
		name?: string;
		id?: string;
		value?: LoginDuration;
	} = $props();
</script>

<Select
	labelText="Keep me logged in for:"
	{name}
	{id}
	bind:value
	options={[...LOGIN_DURATION_OPTIONS]}
/>
