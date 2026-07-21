<!--
	Tabs.svelte — barrierefreies Tabs-Atom (ARIA tablist/tab/tabpanel, roving
	tabindex, Pfeiltasten ←/→ + Home/End) mit gleitendem Aktiv-Unterstrich.
	Strukturiert u. a. die Design-Tabs der Component-Doku-Seiten
	(src/routes/product/components/*/+page.svx, via Exporter-Template).

	API (Atom):
	  tabs:   { id?; label; icon?; component? }[]  — je Tab. `component` = Panel-
	          Snippet; fehlt er, rendert das Atom nur die Leiste (kontrollierter
	          Modus, Panels extern). `id` fällt auf den Index zurück.
	  active: aktive Tab-ID ($bindable, Default = erste Tab).
	  onchange(id): zusätzlicher Callback bei Tab-Wechsel.
	  label:  ARIA-Label der Leiste.
	  sticky: Leiste beim Scrollen oben andocken.

	Abgrenzung: KEIN Tabs-Fall ist die AnchorBar
	(admin/product/components/[slug]/AnchorBar.svelte) — das ist Sprungmarken-
	Navigation (Scrollspy, <nav>/aria-current), sie wechselt keine Panels und bleibt
	daher bewusst ein eigenes Muster.
-->
<script lang="ts">
	import type { Snippet } from 'svelte';

	type TabItem = {
		/** Stabile ID (aria-controls/Panel-Verknüpfung). Fällt auf den Index zurück. */
		id?: string;
		/** Beschriftung des Tab-Buttons. */
		label: string;
		/** Optionales Icon vor dem Label. */
		icon?: Snippet;
		/** Panel-Inhalt (Svelte-Snippet). Fehlt er, rendert das Atom nur die Leiste. */
		component?: Snippet;
	};

	type Props = {
		/** Tabs mit Label, optionalem Icon und Panel-Snippet. */
		tabs: TabItem[];
		/** Aktive Tab-ID ($bindable). Default: erste Tab. */
		active?: string;
		/** ARIA-Label der Tab-Leiste. */
		label?: string;
		/** Callback bei Tab-Wechsel (zusätzlich zum $bindable-Wert). */
		onchange?: (id: string) => void;
		/** Tab-Leiste beim Scrollen oben andocken. */
		sticky?: boolean;
	};

	const idOf = (t: TabItem, i: number) => t.id ?? `tab-${i}`;

	let {
		tabs,
		active = $bindable(),
		label = 'Tab-Navigation',
		onchange,
		sticky = false
	}: Props = $props();

	// Aktive Tab robust bestimmen: gesetzte ID, sonst erste Tab (Fallback bei
	// leerem/ungültigem `active`).
	const activeId = $derived(
		tabs.some((t, i) => idOf(t, i) === active) ? (active as string) : tabs[0] && idOf(tabs[0], 0)
	);

	function select(id: string) {
		active = id;
		onchange?.(id);
	}

	function handleKeyDown(event: KeyboardEvent) {
		const currentIndex = tabs.findIndex((t, i) => idOf(t, i) === activeId);
		let nextIndex: number;

		switch (event.key) {
			case 'ArrowRight':
				nextIndex = (currentIndex + 1) % tabs.length;
				break;
			case 'ArrowLeft':
				nextIndex = (currentIndex - 1 + tabs.length) % tabs.length;
				break;
			case 'Home':
				nextIndex = 0;
				break;
			case 'End':
				nextIndex = tabs.length - 1;
				break;
			default:
				return; // andere Tasten ignorieren
		}

		event.preventDefault();
		const nextId = idOf(tabs[nextIndex], nextIndex);
		select(nextId);
		document.getElementById(`tab-btn-${nextId}`)?.focus();
	}
</script>

<ul role="tablist" aria-label={label} class:sticky>
	{#each tabs as tab, index (idOf(tab, index))}
		{@const id = idOf(tab, index)}
		<li role="presentation">
			<button
				id={`tab-btn-${id}`}
				role="tab"
				aria-selected={activeId === id}
				aria-controls={`tab-panel-${id}`}
				tabindex={activeId === id ? 0 : -1}
				class:active={activeId === id}
				onclick={() => select(id)}
				onkeydown={handleKeyDown}
			>
				{#if tab.icon}<span class="tab-icon">{@render tab.icon()}</span>{/if}
				{tab.label}
			</button>
		</li>
	{/each}
</ul>
{#each tabs as tab, index (idOf(tab, index))}
	{@const id = idOf(tab, index)}
	{#if activeId === id && tab.component}
		<div
			id={`tab-panel-${id}`}
			role="tabpanel"
			aria-labelledby={`tab-btn-${id}`}
			tabindex="0"
			class="tab-panel"
		>
			{@render tab.component()}
		</div>
	{/if}
{/each}

<style>
	.tab-panel {
		padding-block: var(--z-ds-space-m);
		max-width: var(--width-tablet);
	}

	ul {
		display: flex;
		flex-wrap: wrap;
		list-style: none;
		border-bottom: 1px solid var(--ds-border);
		margin-block: var(--z-ds-space-m);
		padding: 0;
		gap: 2px;
	}

	ul.sticky {
		position: sticky;
		top: var(--header-height, 0px);
		z-index: 20;
		flex-wrap: nowrap;
		overflow-x: auto;
		scrollbar-width: none;
		margin-block: var(--z-ds-space-m) 0;
		background: var(--ds-surface);
	}
	ul.sticky::-webkit-scrollbar {
		display: none;
	}

	ul li {
		margin-bottom: 0;
	}

	button {
		all: unset;
		cursor: pointer;
		position: relative;
		display: inline-flex;
		align-items: center;
		gap: var(--z-ds-space-xs);
		padding: var(--z-ds-space-xs) var(--z-ds-space-s);
		color: var(--ds-text-body);
		white-space: nowrap;
		transition: color var(--ds-dur) var(--ds-ease);
	}

	.tab-icon {
		display: inline-flex;
		align-items: center;
	}

	button.active {
		color: var(--ds-text);
	}

	/* Unterstrich erscheint instant — Tab-Wechsel ist tastatur-initiiert/-wiederholbar
	   (Pfeiltasten), darf also nicht bei jedem Schritt eine Keyframe-Animation neu
	   abspielen (Emil-Skill: keine Animation auf Keyboard-/High-Frequency-Aktionen).
	   Das smoothe, interruptierbare Color-Transition auf dem Button bleibt. */
	button.active::after {
		content: '';
		position: absolute;
		left: var(--z-ds-space-s);
		right: var(--z-ds-space-s);
		bottom: -1px;
		height: 2px;
		background: var(--ds-text);
		border-radius: 2px;
	}

	@media (hover: hover) and (pointer: fine) {
		button:not(.active):hover {
			color: var(--ds-text);
		}
	}

	button:focus-visible {
		outline: 2px solid var(--ds-focus-ring);
		outline-offset: -2px;
		border-radius: 4px;
	}

	@media (prefers-reduced-motion: reduce) {
		button {
			transition: none;
		}
	}
</style>
