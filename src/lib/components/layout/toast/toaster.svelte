<script lang="ts">
	import { getToastState } from '$stores/toast-state.svelte';
	import Toast from './toast.svelte';

	const toastState = getToastState();
</script>

<div class="toaster">
	{#each toastState.toasts as toast, index}
		<Toast {toast} total={toastState.toasts.length} {index} />
	{/each}
</div>

<style>
	.toaster {
		position: fixed;
		right: 3rem;
		bottom: 1.5rem;
		display: flex;
		flex-direction: column;
		align-items: flex-end;
		pointer-events: none;
	}

	.toaster :global(.toast) {
		pointer-events: auto;
		/* margin-bottom: -2.5rem; Create overlapping effect, TODO: let's talk about thissss */
	}

	.toaster :global(.toast:first-child) {
		margin-bottom: 0;
	}
</style>
