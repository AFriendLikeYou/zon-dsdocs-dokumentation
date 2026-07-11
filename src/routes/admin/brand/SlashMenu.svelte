<!--
  SlashMenu — das am Cursor verankerte Insert-Menü (Notion-artig, „/"-Trigger).
  Desktop: fixes Popover an der Cursorposition. Mobile: Bottom-Sheet mit Overlay +
  Scroll-Lock (Muster von Editor.js' popover-mobile, mit unseren Tokens + ease-out).

  Präsentational: Items sind bereits gefiltert, der aktive Index wird vom Editor
  gesteuert (Tastatur läuft dort, weil der Fokus im Textarea bleibt). `pointerdown`
  wird abgefangen, damit das Textarea beim Klick nicht den Fokus verliert.
-->
<script lang="ts">
	import BlockMenuList from './BlockMenuList.svelte';

	type Item = { name: string; label: string; icon: string };
	let {
		items,
		activeIndex = 0,
		x = 0,
		y = 0,
		mobile = false,
		onpick,
		onhover,
		onclose
	}: {
		items: Item[];
		activeIndex?: number;
		x?: number;
		y?: number;
		mobile?: boolean;
		onpick: (name: string) => void;
		onhover?: (i: number) => void;
		onclose: () => void;
	} = $props();

	// Auf Mobile den Body-Scroll sperren, solange das Sheet offen ist.
	$effect(() => {
		if (!mobile) return;
		const prev = document.body.style.overflow;
		document.body.style.overflow = 'hidden';
		return () => {
			document.body.style.overflow = prev;
		};
	});

	// Popover innerhalb des Viewports halten (horizontale Klammer genügt meist).
	const PANEL = 240;
	const clampedX = $derived(
		Math.max(8, Math.min(x, (typeof window !== 'undefined' ? window.innerWidth : 9999) - PANEL - 8))
	);
</script>

{#if mobile}
	<div
		class="overlay"
		role="presentation"
		onpointerdown={(e) => {
			e.preventDefault();
			onclose();
		}}
	></div>
	<div
		class="sheet"
		role="dialog"
		aria-label="Element einfügen"
		onpointerdown={(e) => e.preventDefault()}
	>
		<div class="grip" aria-hidden="true"></div>
		<BlockMenuList {items} {activeIndex} {onpick} {onhover} />
	</div>
{:else}
	<div
		class="pop"
		role="presentation"
		style="left:{clampedX}px; top:{y}px;"
		onpointerdown={(e) => e.preventDefault()}
	>
		<BlockMenuList {items} {activeIndex} {onpick} {onhover} />
	</div>
{/if}

<style>
	/* Desktop: Popover am Cursor. */
	.pop {
		position: fixed;
		z-index: 50;
		width: 15rem;
		max-width: calc(100vw - 1rem);
		background: var(--ds-surface);
		border: 1px solid var(--ds-border);
		border-radius: var(--ds-radius-sm);
		box-shadow: 0 8px 24px rgb(from var(--ds-text) r g b / 0.18);
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
	.overlay {
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
	.sheet {
		position: fixed;
		left: 0;
		right: 0;
		bottom: 0;
		z-index: 50;
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
	.grip {
		width: 2.25rem;
		height: 0.25rem;
		margin: 0 auto var(--z-ds-space-6);
		border-radius: 999px;
		background: var(--ds-border);
	}

	@media (prefers-reduced-motion: reduce) {
		.pop,
		.overlay,
		.sheet {
			animation: none;
		}
	}
</style>
