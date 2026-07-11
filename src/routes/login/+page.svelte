<script lang="ts">
	import LoginForm from './LoginForm.svelte';
	import type { ActionData } from './$types';

	let { form, data }: { form: ActionData; data: { isUserLoggedIn: boolean } } = $props();

	// Direkt ableitbar aus dem Action-Result — kein $state+$effect nötig.
	const isLoggedIn = $derived(!!form?.success);
</script>

{#if isLoggedIn || data.isUserLoggedIn}
	<p>You are already logged in.</p>

	<a class="app-button" href="/">Go to Dashboard</a>
{:else}
	<LoginForm {form} />
{/if}
