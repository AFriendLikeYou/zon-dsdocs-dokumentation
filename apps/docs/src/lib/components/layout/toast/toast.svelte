<!-- toast.svelte — einzelner Toast im Sonner-Stapel (Titel, Nachricht, optionale Aktion, Schließen); wird von toaster.svelte gerendert. -->
<script lang="ts">
	import { getToastState } from '$stores/toast-state.svelte';
	import { fade, fly } from 'svelte/transition';
	import { cubicOut } from 'svelte/easing';
	import { CloseIcon } from '$lib/icons';
	import type { ToastType } from '$types/global';

	type Props = {
		/** Anzuzeigender Toast (Titel, Nachricht, Count, optionale Aktion). */
		toast: ToastType;
		/** Position im Stapel; bestimmt Tiefe, Versatz und Skalierung. */
		index: number;
		/** Gesamtzahl der Toasts im Stapel. */
		total: number;
	};

	let { toast, index, total }: Props = $props();

	const toastState = getToastState();

	// Sonner-Stapel: der neueste Toast (höchster Index) liegt vorn/unten mit voller
	// Deckung, ältere rücken je Stufe nach oben und schrumpfen leicht.
	let depth = $derived(total - 1 - index);
	let offsetY = $derived(depth * -8); // px nach oben je Stufe
	let scale = $derived(1 - depth * 0.05); // 1 · 0.95 · 0.9
	let zIndex = $derived(total - depth);

	// prefers-reduced-motion: Cross-Fade statt Fly (Bewegung raus, Feedback bleibt).
	const reducedMotion =
		typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
</script>

<!-- Äußere Hülle trägt die Stapel-Transform (per CSS transition), damit die
     Ein-/Ausblend-Transition der inneren .toast nicht damit kollidiert. -->
<div
	class="toast-slot"
	style="
		transform: translateY({offsetY}px) scale({scale});
		z-index: {zIndex};
		opacity: {depth === 0 ? 1 : 0.72};
	"
>
	<div
		in:fly={{ y: reducedMotion ? 0 : 16, duration: reducedMotion ? 120 : 240, easing: cubicOut }}
		out:fade={{ duration: reducedMotion ? 80 : 160 }}
		class="toast"
	>
		<div class="toast__body">
			<span class="toast__title">
				{toast.title}
				{#if toast.count >= 2}
					<span class="toast__count" aria-hidden="true">×{toast.count}</span>
				{/if}
			</span>
			<span class="toast__message">{toast.message}</span>
		</div>

		{#if toast.action}
			<button
				class="toast__action"
				onclick={() => {
					toast.action?.run();
					toastState.remove(toast.id);
				}}
			>
				{toast.action.label}
			</button>
		{/if}

		<button class="toast__close" onclick={() => toastState.remove(toast.id)}>
			<span class="sr-only">Schließen</span>
			<CloseIcon width={14} height={14} />
		</button>
	</div>
</div>

<style>
	.toast-slot {
		position: absolute;
		right: 0;
		bottom: 0;
		width: 320px;
		transform-origin: bottom center;
		/* Nachrücken beim Entfernen: kurz, stark ease-out. */
		transition:
			transform 0.24s cubic-bezier(0.22, 1, 0.36, 1),
			opacity 0.24s cubic-bezier(0.22, 1, 0.36, 1);
		will-change: transform, opacity;
	}

	.toast {
		position: relative;
		display: flex;
		align-items: center;
		gap: var(--z-ds-space-s);
		width: 100%;
		height: 60px;
		padding: 0 2.25rem 0 var(--z-ds-space-m);
		border: 1px solid var(--ds-border-soft);
		border-radius: var(--ds-radius);
		/* Fläche ist bereits eine Stufe über der Seite (im Dark 1,19 : 1) — die trägt
		   die Höhe. Der Schatten bleibt nur im Light-Mode. */
		background-color: var(--ds-surface-raised);
		color: var(--ds-text);
		box-shadow: var(--ds-elevation-shadow-raised);
	}

	.toast__body {
		display: flex;
		flex-direction: column;
		gap: 2px;
		min-width: 0; /* erlaubt Ellipsis in Kindern */
		flex: 1 1 auto;
	}

	.toast__title {
		font-size: var(--ds-text-sm);
		font-weight: 500;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	.toast__count {
		margin-left: 0.25rem;
		color: var(--ds-text-muted);
		font-weight: 400;
		font-variant-numeric: tabular-nums;
	}

	.toast__message {
		font-size: var(--ds-text-xs);
		color: var(--ds-text-muted);
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	/* Ghost-Button auf der erhöhten Fläche — wie die Doku-Buttons, nicht invertiert. */
	.toast__action {
		flex: none;
		padding: 4px var(--z-ds-space-s);
		border: 1px solid var(--ds-border-soft);
		border-radius: var(--ds-radius-sm);
		background: transparent;
		color: var(--ds-text);
		font-size: var(--ds-text-xs);
		font-weight: 600;
		cursor: pointer;
		transition: background-color 0.16s cubic-bezier(0.22, 1, 0.36, 1);
	}

	.toast__action:hover {
		background: var(--ds-surface-raised);
		filter: brightness(0.96);
	}

	.toast__action:active {
		filter: brightness(0.92);
	}

	.toast__action:focus-visible {
		outline: 2px solid var(--ds-focus-ring);
		outline-offset: 2px;
	}

	.toast__close {
		position: absolute;
		top: 0.5rem;
		right: 0.5rem;
		display: inline-flex;
		align-items: center;
		justify-content: center;
		width: 1.25rem;
		height: 1.25rem;
		border: none;
		border-radius: var(--ds-radius-sm);
		background: transparent;
		color: var(--ds-text-muted);
		cursor: pointer;
		transition: color 0.16s cubic-bezier(0.22, 1, 0.36, 1);
	}

	.toast__close:hover {
		color: var(--ds-text);
	}

	.toast__close:focus-visible {
		outline: 2px solid var(--ds-focus-ring);
		outline-offset: 2px;
	}

	@media (prefers-reduced-motion: reduce) {
		.toast-slot {
			transition: opacity 0.16s ease;
		}
	}
</style>
