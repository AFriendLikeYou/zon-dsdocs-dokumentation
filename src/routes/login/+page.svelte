<script lang="ts">
	import { Button } from '$components/ui/button';
	import LoginForm from './LoginForm.svelte';
	import type { ActionData } from './$types';

	let { form, data }: { form: ActionData; data: { isUserLoggedIn: boolean } } = $props();

	// Direkt ableitbar aus dem Action-Result — kein $state+$effect nötig.
	const isLoggedIn = $derived(!!form?.success);
</script>

{#if isLoggedIn || data.isUserLoggedIn}
	<p>You are already logged in.</p>

	<Button href="/">Go to Dashboard</Button>
{:else}
	<LoginForm {form} />
{/if}
