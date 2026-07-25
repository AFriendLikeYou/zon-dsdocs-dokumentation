<!--
  SearchPalette.svelte — globale Seitensuche (Cmd/Ctrl+K oder Klick).
  Rein client-seitig über den vorhandenen flachen Menü-Index (kein Backend/Algolia).
  Trigger + Dialog in einem; einfach <SearchPalette /> in die Navbar legen.
-->
<script lang="ts">
	import { FLAT_MENU_ITEMS_BRAND, FLAT_MENU_ITEMS_PRODUCT, type MenuItem } from '$data/navigation';
	import { Badge } from '$components/ui/badge';
	import { EmptyState } from '$components/ui/empty-state';
	import { Field } from '$components/ui/field';
	import { Kbd } from '$components/ui/kbd';
	import { goto } from '$app/navigation';
	import { SearchIcon } from '$lib/icons';

	/** Durchsuchbare Einträge; Default = Brand + Product zusammengeführt (dedupliziert). */
	function combinedIndex(): MenuItem[] {
		const seen = new Set<string>();
		return [...FLAT_MENU_ITEMS_BRAND, ...FLAT_MENU_ITEMS_PRODUCT].filter((item) => {
			if (!item.href || seen.has(item.href)) return false;
			seen.add(item.href);
			return true;
		});
	}

	let {
		/** Durchsuchbare Menü-Einträge; Default = kombinierter Brand+Product-Index. */
		items = combinedIndex()
	}: { items?: MenuItem[] } = $props();

	let dialog = $state<HTMLDialogElement>();
	let query = $state('');
	let activeIndex = $state(0);

	const results = $derived(
		query.trim()
			? items.filter((i) => i.label.toLowerCase().includes(query.toLowerCase().trim()))
			: items
	);

	// Aktiven Index zurücksetzen, wenn sich die Suche ändert (Lesen = Dependency-Tracking).
	$effect(() => {
		const _search = query;
		activeIndex = 0;
	});

	function open() {
		query = '';
		dialog?.showModal();
		// Fokus ins Eingabefeld (a11y) — nach dem Öffnen. Das Input liegt im Field-Atom,
		// darum per Query aus dem Dialog statt über ein Element-Binding.
		requestAnimationFrame(() => dialog?.querySelector('input')?.focus());
	}
	function close() {
		dialog?.close();
	}

	function onWindowKeydown(e: KeyboardEvent) {
		if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
			e.preventDefault();
			if (dialog?.open) {
				close();
			} else {
				open();
			}
		}
	}

	function onDialogKeydown(e: KeyboardEvent) {
		if (e.key === 'ArrowDown') {
			e.preventDefault();
			activeIndex = Math.min(activeIndex + 1, results.length - 1);
		} else if (e.key === 'ArrowUp') {
			e.preventDefault();
			activeIndex = Math.max(activeIndex - 1, 0);
		} else if (e.key === 'Enter') {
			e.preventDefault();
			const target = results[activeIndex];
			if (target?.href) {
				close();
				goto(target.href);
			}
		}
	}
</script>

<svelte:window onkeydown={onWindowKeydown} />

<button
	type="button"
	class="search-trigger field field--comfortable"
	onclick={open}
	aria-keyshortcuts="Meta+K Control+K"
>
	<span class="field__icon"><SearchIcon /></span>
	<span class="search-trigger__label">Suchen</span>
	<span class="search-trigger__kbd"><Kbd>⌘K</Kbd></span>
</button>

<dialog
	bind:this={dialog}
	class="search-dialog"
	aria-label="Seitensuche"
	onkeydown={onDialogKeydown}
	onclick={(e) => {
		if (e.target === dialog) close();
	}}
>
	<div class="panel">
		<div class="inputrow">
			<Field
				bind:value={query}
				density="comfortable"
				type="text"
				placeholder="Seiten durchsuchen…"
				aria-label="Seiten durchsuchen"
				autocomplete="off"
			>
				{#snippet icon()}<SearchIcon width={18} height={18} />{/snippet}
				{#snippet shortcut()}<Kbd>Esc</Kbd>{/snippet}
			</Field>
		</div>

		{#if results.length}
			<ul class="results" role="listbox" aria-label="Suchergebnisse">
				{#each results as item, i (item.href)}
					<li role="option" aria-selected={i === activeIndex}>
						<a
							href={item.href}
							class="result"
							class:active={i === activeIndex}
							onclick={close}
							onmouseenter={() => (activeIndex = i)}
						>
							<span class="result__label">{item.label}</span>
							{#if item.badge}
								<Badge tone={item.badgeVariant ?? 'machine'}>{item.badge}</Badge>
							{/if}
							<span class="result__path">{item.href}</span>
						</a>
					</li>
				{/each}
			</ul>
		{:else}
			<EmptyState title="Keine Treffer" description={`Für „${query}" wurde nichts gefunden.`} />
		{/if}
	</div>
</dialog>

<style>
	/* Trigger nutzt die geteilte Feld-Basis (.field .field--comfortable); hier nur
	   das Trigger-Spezifische: intrinsische Breite, Zeiger, Hover-Fläche, Text-Farbe. */
	.search-trigger {
		width: auto;
		gap: var(--z-ds-space-8);
		color: var(--ds-text-body);
		cursor: pointer;
	}
	@media (hover: hover) and (pointer: fine) {
		.search-trigger:hover {
			background: var(--ds-surface-sunken);
			color: var(--ds-text);
			border-color: var(--ds-border);
		}
	}
	.search-trigger:focus-visible {
		outline: 2px solid var(--ds-focus-ring);
		outline-offset: 2px;
	}
	@media (max-width: 560px) {
		.search-trigger__label,
		.search-trigger__kbd {
			display: none;
		}
	}

	.search-dialog {
		margin: 12vh auto auto;
		width: min(560px, 92vw);
		max-height: 70vh;
		padding: 0;
		border: 1px solid var(--ds-border);
		border-radius: var(--ds-radius);
		/* Overlay über beliebigem Seiteninhalt: im Dark-Mode lag die Palette exakt auf
		   der Seitenfarbe (--ds-surface auf --ds-surface) und wurde nur von der Border
		   gehalten — der Schatten trug 1,06 : 1 bei. Dark hebt jetzt die Fläche
		   (1,19 : 1), Light behält den Schatten. */
		background: var(--ds-elevation-overlay-bg);
		color: var(--ds-text);
		box-shadow: var(--ds-elevation-shadow-raised);
		overflow: hidden;
	}
	.search-dialog::backdrop {
		background: rgb(from var(--ds-surface) r g b / 0.55);
		backdrop-filter: blur(2px);
	}
	.panel {
		display: flex;
		flex-direction: column;
		max-height: 70vh;
	}
	.inputrow {
		padding: var(--z-ds-space-12) var(--z-ds-space-16);
		border-bottom: 1px solid var(--ds-border);
	}
	.results {
		list-style: none;
		margin: 0;
		padding: var(--z-ds-space-8);
		overflow-y: auto;
	}
	.result {
		display: flex;
		align-items: center;
		gap: var(--z-ds-space-8);
		padding: var(--z-ds-space-8) var(--z-ds-space-12);
		border-radius: var(--ds-radius-sm);
		text-decoration: none;
		color: var(--ds-text);
	}
	.result.active {
		background: var(--ds-surface-raised);
	}
	.result__label {
		font-weight: 500;
	}
	.result__path {
		margin-left: auto;
		font-family: var(--ds-font-mono);
		font-size: var(--ds-text-xs);
		color: var(--ds-text-muted);
		white-space: nowrap;
	}

	@media (prefers-reduced-motion: reduce) {
		.search-trigger {
			transition: none;
		}
	}
</style>
