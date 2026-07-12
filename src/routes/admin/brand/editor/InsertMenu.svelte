<!--
  InsertMenu — Button-getriggertes Insert-Menü (Notion-artig). Desktop: Such-Popover.
  Mobile: Bottom-Sheet mit Overlay + Scroll-Lock (Muster von Editor.js, mit unseren
  Tokens). Die Item-Liste ist in BlockMenuList ausgelagert (geteilt mit dem Slash-Menü).
-->
<script lang="ts">
	import BlockMenuList from './BlockMenuList.svelte';
	import { Icon } from '$lib/icons/cms';
	import { matchesMedia } from '../core/media.svelte';
	import { placePopover } from '../core/popover-position';

	type Item = { name: string; label: string; icon: string };
	let {
		items,
		onpick,
		label = 'Einfügen',
		compact = false
	}: {
		items: Item[];
		onpick: (name: string) => void;
		label?: string;
		compact?: boolean;
	} = $props();

	const mobile = matchesMedia('(max-width: 640px)');

	let open = $state(false);
	let query = $state('');
	let activeIdx = $state(0);
	let wrap = $state<HTMLElement | null>(null);
	let input = $state<HTMLInputElement | null>(null);
	let triggerEl = $state<HTMLElement | null>(null);
	let popEl = $state<HTMLElement | null>(null);

	const filtered = $derived(
		items.filter((i) => i.label.toLowerCase().includes(query.trim().toLowerCase()))
	);

	function toggle() {
		open = !open;
		if (open) {
			query = '';
			activeIdx = 0;
			queueMicrotask(() => input?.focus());
		}
	}
	function close() {
		open = false;
	}
	function pick(name: string) {
		onpick(name);
		close();
	}
	function onkey(e: KeyboardEvent) {
		if (e.key === 'Escape') {
			close();
			return;
		}
		const n = filtered.length;
		if (e.key === 'ArrowDown') {
			e.preventDefault();
			activeIdx = n ? (activeIdx + 1) % n : 0;
		} else if (e.key === 'ArrowUp') {
			e.preventDefault();
			activeIdx = n ? (activeIdx - 1 + n) % n : 0;
		} else if (e.key === 'Enter') {
			e.preventDefault();
			const it = filtered[activeIdx];
			if (it) pick(it.name);
		}
	}

	// Desktop: Klick außerhalb schließt. Mobile: das Overlay übernimmt das.
	$effect(() => {
		if (!open || mobile.value) return;
		const onDown = (e: MouseEvent) => {
			if (wrap && !wrap.contains(e.target as Node)) close();
		};
		document.addEventListener('pointerdown', onDown, true);
		return () => document.removeEventListener('pointerdown', onDown, true);
	});

	// Auf Mobile den Body-Scroll sperren, solange das Sheet offen ist.
	$effect(() => {
		if (!open || !mobile.value) return;
		const prev = document.body.style.overflow;
		document.body.style.overflow = 'hidden';
		return () => {
			document.body.style.overflow = prev;
		};
	});

	// Desktop: fixed am Trigger platzieren (Flip + Viewport-Klammer); die Liste
	// bekommt die verbleibende Höhe (Suche bleibt stehen). Folgt Scroll/Resize.
	$effect(() => {
		// eslint-disable-next-line @typescript-eslint/no-unused-expressions -- reaktive Abhängigkeit: bei Filter-Änderung neu messen
		filtered.length;
		const a = triggerEl;
		const p = popEl;
		if (!open || mobile.value || !a || !p) return;
		const place = () => {
			placePopover(a, p, { gap: 4 });
			const mh = parseFloat(p.style.maxHeight) || 300;
			const list = p.querySelector<HTMLElement>('.opts');
			if (list) list.style.maxHeight = `${Math.max(96, mh - 64)}px`;
		};
		place();
		window.addEventListener('scroll', place, true);
		window.addEventListener('resize', place);
		return () => {
			window.removeEventListener('scroll', place, true);
			window.removeEventListener('resize', place);
		};
	});
</script>

{#snippet body()}
	<input
		bind:this={input}
		class="search"
		type="text"
		placeholder="Suchen…"
		bind:value={query}
		oninput={() => (activeIdx = 0)}
		onkeydown={onkey}
	/>
	<BlockMenuList
		items={filtered}
		activeIndex={activeIdx}
		onpick={pick}
		onhover={(i) => (activeIdx = i)}
	/>
{/snippet}

<div class="insert-menu" bind:this={wrap}>
	<button
		type="button"
		class="trigger"
		class:trigger--compact={compact}
		bind:this={triggerEl}
		aria-haspopup="listbox"
		aria-expanded={open}
		onclick={toggle}
	>
		<span class="plus" aria-hidden="true"><Icon name="plus" /></span>
		{#if !compact}<span>{label}</span>{/if}
	</button>

	{#if open}
		{#if mobile.value}
			<div
				class="overlay"
				role="presentation"
				onpointerdown={(e) => {
					e.preventDefault();
					close();
				}}
			></div>
			<div class="sheet" role="dialog" aria-label={label}>
				<div class="grip" aria-hidden="true"></div>
				{@render body()}
			</div>
		{:else}
			<div class="pop" role="dialog" aria-label={label} bind:this={popEl}>
				{@render body()}
			</div>
		{/if}
	{/if}
</div>

<style>
	.insert-menu {
		position: relative;
		display: inline-block;
	}
	.trigger {
		display: inline-flex;
		align-items: center;
		gap: var(--z-ds-space-6);
		border: 1px solid var(--ds-border);
		background: var(--ds-surface-raised, var(--ds-surface));
		border-radius: var(--ds-radius-sm);
		padding: 3px var(--z-ds-space-s);
		font-size: var(--ds-text-xs);
		color: var(--ds-text-body);
		cursor: pointer;
		white-space: nowrap;
	}
	.trigger:hover {
		border-color: var(--ds-accent);
	}
	.trigger:focus-visible {
		outline: 2px solid var(--ds-focus-ring);
		outline-offset: 2px;
	}
	.trigger--compact {
		padding: 2px var(--z-ds-space-6);
		border-style: dashed;
		background: var(--ds-surface);
		color: var(--ds-text-muted);
	}
	.plus {
		display: inline-flex;
		flex: none;
	}

	/* Desktop-Popover: fixed (entkommt Karten-/Viewport-Grenzen); Position setzt
	   placePopover (Flip + Klammer + Scroll-Follow). */
	.pop {
		position: fixed;
		z-index: 60;
		width: 15rem;
		max-width: 80vw;
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
	.grip {
		width: 2.25rem;
		height: 0.25rem;
		margin: 0 auto var(--z-ds-space-6);
		border-radius: 999px;
		background: var(--ds-border);
	}

	.search {
		width: 100%;
		font: inherit;
		font-size: var(--ds-text-sm);
		color: var(--ds-text);
		background: var(--ds-surface);
		border: 1px solid var(--ds-border);
		border-radius: var(--ds-radius-sm);
		padding: var(--z-ds-space-6) var(--z-ds-space-8);
		margin-bottom: var(--z-ds-space-6);
	}
	.search:focus-visible {
		outline: 2px solid var(--ds-focus-ring);
		outline-offset: 1px;
	}

	@media (prefers-reduced-motion: reduce) {
		.pop,
		.overlay,
		.sheet {
			animation: none;
		}
	}
</style>
