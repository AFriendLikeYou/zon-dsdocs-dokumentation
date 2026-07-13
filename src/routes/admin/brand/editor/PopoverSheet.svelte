<!--
  PopoverSheet — geteilte Hülle für die CMS-Popover (Slash-, Insert-, Media-Menü).
  Kapselt das vorher 3× byte-nah duplizierte Muster:
    · Desktop: verankertes `position: fixed`-Popover (via anchoredPopover/placePopover)
      ODER Koordinaten-Popover an x/y (Cursor, Slash-Menü); Outside-Click schließt.
    · Mobile (≤640px): Overlay + Bottom-Sheet mit Grip, Body-Scroll-Lock; Overlay schließt.
    · Keyframes pop-in / fade-in / sheet-up, reduced-motion-fest.
  Der Aufrufer liefert nur noch seinen Body (Default-Snippet) und die Verankerung.
-->
<script lang="ts">
	import type { Snippet } from 'svelte';
	import { matchesMedia, MOBILE_QUERY } from '../core/media.svelte';
	import { clickOutside, anchoredPopover } from '../core/actions';

	let {
		open,
		label,
		onclose,
		anchor = null,
		x = 0,
		y = 0,
		reflowKey = undefined,
		width = '15rem',
		maxWidth = 'calc(100vw - 1rem)',
		contentOffset = undefined,
		closeOnOutside = true,
		preservePointerFocus = false,
		desktopRole = 'dialog',
		children
	}: {
		open: boolean;
		label: string;
		onclose: () => void;
		/** Anker-Element für die verankerte Desktop-Positionierung. */
		anchor?: HTMLElement | null;
		/** Koordinaten für die verankerungsfreie Positionierung (Cursor), falls kein `anchor`. */
		x?: number;
		y?: number;
		/** Reaktiver Wert → bei Änderung neu platzieren (z. B. Trefferzahl). */
		reflowKey?: unknown;
		width?: string;
		maxWidth?: string;
		/** Offset für inneren Scroll-Bereich (setzt --popover-content-max-height im Anker-Modus). */
		contentOffset?: number;
		/** Desktop-Klick-ausserhalb schliesst (Default an; Slash-Menü lässt das Parent steuern). */
		closeOnOutside?: boolean;
		/** Pointerdown im Popover abfangen, damit ein darunterliegendes Textarea den Fokus behält. */
		preservePointerFocus?: boolean;
		desktopRole?: 'dialog' | 'presentation';
		children: Snippet;
	} = $props();

	const mobile = matchesMedia(MOBILE_QUERY);

	// Koordinaten-Modus (Slash-Menü): horizontal in den Viewport klammern.
	const COORD_PANEL = 240; // 15rem — Breite des Cursor-Popovers
	const clampedX = $derived(
		Math.max(
			8,
			Math.min(x, (typeof window !== 'undefined' ? window.innerWidth : 9999) - COORD_PANEL - 8)
		)
	);

	// Mobile: Body-Scroll sperren, solange das Sheet offen ist.
	$effect(() => {
		if (!open || !mobile.value) return;
		const prev = document.body.style.overflow;
		document.body.style.overflow = 'hidden';
		return () => {
			document.body.style.overflow = prev;
		};
	});

	function grabPointer(e: PointerEvent) {
		if (preservePointerFocus) e.preventDefault();
	}
</script>

{#if open}
	{#if mobile.value}
		<div
			class="popover-sheet__overlay"
			role="presentation"
			onpointerdown={(e) => {
				e.preventDefault();
				onclose();
			}}
		></div>
		<div
			class="popover-sheet__sheet"
			role="dialog"
			aria-label={label}
			onpointerdown={grabPointer}
		>
			<div class="popover-sheet__grip" aria-hidden="true"></div>
			{@render children()}
		</div>
	{:else if anchor}
		<div
			class="popover-sheet__popover"
			role={desktopRole}
			aria-label={desktopRole === 'dialog' ? label : undefined}
			style:width
			style:max-width={maxWidth}
			onpointerdown={grabPointer}
			use:anchoredPopover={{ anchor, reflowKey, gap: 4, maxHeightOffset: contentOffset }}
			use:clickOutside={{
				onOutside: () => {
					if (closeOnOutside) onclose();
				},
				ignore: [anchor]
			}}
		>
			{@render children()}
		</div>
	{:else}
		<div
			class="popover-sheet__popover"
			role={desktopRole}
			aria-label={desktopRole === 'dialog' ? label : undefined}
			style:width
			style:max-width={maxWidth}
			style:left="{clampedX}px"
			style:top="{y}px"
			onpointerdown={grabPointer}
		>
			{@render children()}
		</div>
	{/if}
{/if}

<style>
	/* Desktop: verankertes/Koordinaten-Popover. Position/maxHeight setzt die
	   anchoredPopover-Action (Anker-Modus) bzw. inline left/top (Koordinaten-Modus). */
	.popover-sheet__popover {
		position: fixed;
		z-index: 60;
		display: flex;
		flex-direction: column;
		min-height: 0;
		background: var(--ds-surface);
		border: 1px solid var(--ds-border);
		border-radius: var(--ds-radius-sm);
		box-shadow: 0 8px 24px rgb(from var(--ds-text) r g b / 0.28);
		padding: var(--z-ds-space-6);
		animation: pop-in 0.13s var(--ds-ease-out, ease-out);
	}
	@keyframes pop-in {
		from {
			opacity: 0;
			transform: translateY(-4px) scale(0.98);
		}
		to {
			opacity: 1;
			transform: translateY(0) scale(1);
		}
	}

	/* Mobile: Overlay + Bottom-Sheet. */
	.popover-sheet__overlay {
		position: fixed;
		inset: 0;
		z-index: 49;
		background: rgb(from var(--ds-text) r g b / 0.35);
		animation: fade-in 0.16s var(--ds-ease-out, ease-out);
	}
	@keyframes fade-in {
		from {
			opacity: 0;
		}
		to {
			opacity: 1;
		}
	}
	.popover-sheet__sheet {
		position: fixed;
		left: 0;
		right: 0;
		bottom: 0;
		z-index: 50;
		display: flex;
		flex-direction: column;
		max-height: 70vh;
		overflow-y: auto;
		background: var(--ds-surface);
		border-top-left-radius: var(--ds-radius, 12px);
		border-top-right-radius: var(--ds-radius, 12px);
		box-shadow: 0 -8px 24px rgb(from var(--ds-text) r g b / 0.18);
		padding: var(--z-ds-space-6) var(--z-ds-space-s)
			calc(var(--z-ds-space-s) + env(safe-area-inset-bottom));
		animation: sheet-up 0.24s var(--ds-ease-out, ease-out);
	}
	@keyframes sheet-up {
		from {
			transform: translateY(100%);
		}
		to {
			transform: translateY(0);
		}
	}
	/* Greif-Indikator wie bei nativen Bottom-Sheets. */
	.popover-sheet__grip {
		flex: none;
		width: 2.25rem;
		height: 0.25rem;
		margin: 0 auto var(--z-ds-space-6);
		border-radius: 999px;
		background: var(--ds-border);
	}

	@media (prefers-reduced-motion: reduce) {
		.popover-sheet__popover,
		.popover-sheet__overlay,
		.popover-sheet__sheet {
			animation: none;
		}
	}
</style>
