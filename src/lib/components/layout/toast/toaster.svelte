<script lang="ts">
	import { getToastState } from '$stores/toast-state.svelte';
	import Toast from './toast.svelte';

	const toastState = getToastState();
</script>

<div class="toaster">
	{#each toastState.toasts as toast, index (toast.id)}
		<Toast {toast} total={toastState.toasts.length} {index} />
	{/each}
</div>

<style>
	/* Bühne für den Stapel: feste Breite, Toasts liegen darin absolut übereinander
	   (bottom-anchored), damit ältere hinter dem neuesten hervorlugen. */
	.toaster {
		position: fixed;
		right: 3rem;
		bottom: 1.5rem;
		width: 320px;
		height: 60px;
		pointer-events: none;
	}

	.toaster :global(.toast) {
		pointer-events: auto;
	}
</style>
