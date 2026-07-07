<script lang="ts">
	import { getToastState } from '$lib/toast-state.svelte';
	import { fade, fly } from 'svelte/transition';
	import type { ToastType } from '$types/global';

	type Props = {
		toast: ToastType;
		index: number;
		total: number;
	};

	let { toast, index, total }: Props = $props();

	const toastState = getToastState();
</script>

<div
	in:fly={{ y: 20, duration: 300 }}
	out:fade={{ duration: 200 }}
	class="toast"
	style="
		transform: translateY(calc({index} * 0.15rem));
		z-index: {total - index};
	"
>
	<span class="toast__title">{toast.title}</span>
	<span class="toast__message">{toast.message}</span>
	<button class="toast__close" onclick={() => toastState.remove(toast.id)}>
		<span class="sr-only">Close toast</span>
		x
	</button>
</div>

<style>
	.toast {
		position: relative;
		display: flex;
		flex-direction: column;
		justify-content: center;
		height: 4rem;
		padding: 0 var(--z-ds-space-l);
		border-radius: 0.375rem;
		border: 1px solid var(--ds-border);
		background-color: var(--ds-text);
		color: var(--ds-surface);
		box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
		transition:
			transform 0.2s ease,
			opacity 0.2s ease;
		will-change: transform, opacity, z-index;
	}

	.toast__title {
		font-size: var(--ds-text-sm);
		font-weight: 500;
	}

	.toast__message {
		font-size: var(--ds-text-xs);
	}

	.toast__close {
		position: absolute;
		top: 0.5rem;
		right: 0.5rem;
		width: 1.25rem;
		height: 1.25rem;
		border: none;
		background: transparent;
		cursor: pointer;
		color: var(--ds-surface);
	}

	.toast__close:focus-visible {
		outline: 2px solid var(--ds-focus-ring);
		outline-offset: 2px;
		border-radius: var(--ds-radius-xs);
	}
</style>
