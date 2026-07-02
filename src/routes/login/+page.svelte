<script lang="ts">
	import LoginForm from './LoginForm.svelte';
	import type { ActionData } from './$types';

	let { form, data }: { form: ActionData; data: { isUserLoggedIn: boolean } } = $props();

	let isLoggedIn = $state(false);

	$effect(() => {
		if (form && form.success) {
			isLoggedIn = true;
		} else {
			isLoggedIn = false;
		}
	});
</script>

{#if isLoggedIn || data.isUserLoggedIn}
	<p>You are already logged in.</p>

	<a class="app-button" href="/">Go to Dashboard</a>
{:else}
	<LoginForm {form} />
{/if}
