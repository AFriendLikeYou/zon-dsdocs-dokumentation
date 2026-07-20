<script lang="ts">
	import { deserialize } from '$app/forms';
	import { invalidateAll, goto } from '$app/navigation';
	import { getToastState } from '$stores/toast-state.svelte';
	import { Icon } from '$lib/icons/cms';
	import { AdminPageHeader, AdminRow } from '../ui';
	import { Badge } from '$components/ui/badge';
	import { Alert } from '$components/ui/alert';
	import { Button } from '$components/ui/button';
	import { sectionKind, type NavSection } from './core/brand-nav';
	import { slugify } from './core/new-page';

	let { data }: import('./$types').PageProps = $props();
	const toast = getToastState();

	// Editierbarkeits-Lookup je öffentlicher URL (aus den gelisteten Brand-Seiten):
	// sagt pro Nav-Knoten, ob er im CMS editierbar ist und unter welchem Editor-Pfad.
	const pageByUrl = new Map(data.pages.map((p) => [p.url, p]));

	// Arbeits-Baum (umsortierbar) — aus der Server-Config geklont. Reihenfolge +
	// Hierarchie leben in src/lib/data/brand-nav.json (SSOT, ADR-028); die Sidebar
	// leitet daraus ab. Ein Reorder persistiert via ?/reorder zurück in die Config.
	let tree = $state<NavSection[]>(structuredClone(data.navTree));
	let saving = $state(false);

	// Resync auf den Server-Stand: data.navTree ändert sich nach invalidateAll (unten)
	// und nach einem HMR-Remount. Beides soll die Ansicht dem gespeicherten Stand
	// folgen lassen — den Arbeits-Baum daher neu aus data.navTree aufbauen, sobald der
	// sich WIRKLICH ändert (Signatur-Vergleich, damit optimistische Edits ungestört
	// bleiben, solange der Server noch nichts Neues gemeldet hat).
	let serverSig = JSON.stringify(data.navTree);
	$effect(() => {
		const sig = JSON.stringify(data.navTree);
		if (sig !== serverSig) {
			serverSig = sig;
			tree = structuredClone(data.navTree);
		}
	});

	// Persistenz per direktem Action-fetch. Nach Erfolg invalidateAll(): der Server-Load
	// liest die Config frisch → data.navTree spiegelt den gespeicherten Stand. Nötig,
	// weil das Schreiben der Config im Dev einen Vite-HMR-Remount von Layout/Seite
	// auslöst (die Sidebar importiert die Config); der neu gemountete Baum initialisiert
	// dann aus frischem data.navTree statt aus dem veralteten SSR-Stand.
	async function persist() {
		if (!data.writable) return; // Prod: read-only (Phase 2b: GitHub-PR)
		const body = new FormData();
		body.set('tree', JSON.stringify($state.snapshot(tree)));
		saving = true;
		try {
			const res = await fetch('?/reorder', {
				method: 'POST',
				headers: { 'x-sveltekit-action': 'true' },
				body
			});
			const result = deserialize(await res.text());
			if (result.type === 'success') {
				toast?.add('Reihenfolge gespeichert', 'Sidebar & Übersicht wurden aktualisiert.');
				await invalidateAll();
			} else {
				const msg =
					result.type === 'failure'
						? (result.data as { message?: string } | undefined)?.message
						: undefined;
				toast?.add('Nicht gespeichert', msg ?? 'Speichern fehlgeschlagen.');
				tree = structuredClone(data.navTree); // optimistische Änderung verwerfen
			}
		} catch (e) {
			toast?.add('Fehler', e instanceof Error ? e.message : 'Speichern fehlgeschlagen.');
			tree = structuredClone(data.navTree);
		} finally {
			saving = false;
		}
	}

	// ---- Move-Operationen (mutieren tree an eine ZIEL-Endposition, dann persist) ----
	function repositionTop(from: number, final: number) {
		if (final < 0 || final >= tree.length || from === final) return;
		const a = tree.slice();
		const [item] = a.splice(from, 1);
		a.splice(final, 0, item);
		tree = a;
		persist();
	}
	function repositionChild(group: number, from: number, final: number) {
		const items = tree[group].items;
		if (!items || final < 0 || final >= items.length || from === final) return;
		const a = items.slice();
		const [item] = a.splice(from, 1);
		a.splice(final, 0, item);
		tree[group].items = a;
		persist();
	}
	// Drop auf die Anzeige-Zeile „to" = „vor diesem Eintrag einfügen" → Endindex.
	const dropFinal = (from: number, to: number) => (from < to ? to - 1 : to);
	// ↑/↓ (barrierefreie, präzise Basis — Tastatur/ohne Maus). dir −1 = nach oben.
	const nudgeTop = (i: number, dir: -1 | 1) => repositionTop(i, i + dir);
	const nudgeChild = (g: number, i: number, dir: -1 | 1) => repositionChild(g, i, i + dir);

	// ---- Native HTML5 Drag&Drop (dep-frei), zwei Ebenen, gleicher Scope nötig ----
	type DragCtx = { kind: 'top'; index: number } | { kind: 'child'; group: number; index: number };
	let drag = $state<DragCtx | null>(null);
	let overKey = $state<string | null>(null);

	const keyOf = (c: DragCtx) => (c.kind === 'top' ? `t${c.index}` : `c${c.group}.${c.index}`);
	const sameScope = (a: DragCtx, b: DragCtx) =>
		a.kind === 'top' ? b.kind === 'top' : b.kind === 'child' && a.group === b.group;

	// stopPropagation: Kind-Drags dürfen NICHT zum umschließenden Top-Level-<li>
	// hochblubbern (sonst überschriebe der Gruppen-Kontext den Kind-Kontext).
	function onDragStart(e: DragEvent, ctx: DragCtx) {
		e.stopPropagation();
		drag = ctx;
		if (e.dataTransfer) e.dataTransfer.effectAllowed = 'move';
	}
	function onDragOver(e: DragEvent, ctx: DragCtx) {
		if (!drag || !sameScope(drag, ctx)) return;
		e.preventDefault();
		e.stopPropagation();
		if (e.dataTransfer) e.dataTransfer.dropEffect = 'move';
		overKey = keyOf(ctx);
	}
	function onDrop(e: DragEvent, ctx: DragCtx) {
		if (!drag || !sameScope(drag, ctx)) return;
		e.preventDefault();
		e.stopPropagation();
		if (drag.kind === 'top' && ctx.kind === 'top')
			repositionTop(drag.index, dropFinal(drag.index, ctx.index));
		else if (drag.kind === 'child' && ctx.kind === 'child')
			repositionChild(ctx.group, drag.index, dropFinal(drag.index, ctx.index));
		drag = null;
		overKey = null;
	}
	const onDragEnd = () => {
		drag = null;
		overKey = null;
	};

	const canEdit = (href?: string) => (href ? (pageByUrl.get(href)?.editable ?? false) : false);
	const editPath = (href: string) => pageByUrl.get(href)?.path ?? '';

	// ── Neue Seite anlegen (create-Action): Slug folgt dem Titel, bis er manuell
	// angefasst wird; nach Erfolg direkt in den Inhalts-Editor der neuen Seite. ──
	let showNew = $state(false);
	let newTitle = $state('');
	let newSlug = $state('');
	let slugTouched = $state(false);
	let creating = $state(false);
	const effSlug = $derived(slugTouched ? newSlug : slugify(newTitle));

	async function createPage(e: SubmitEvent) {
		e.preventDefault();
		if (creating) return;
		creating = true;
		try {
			const body = new FormData();
			body.set('title', newTitle);
			body.set('slug', effSlug);
			const res = await fetch('?/create', {
				method: 'POST',
				headers: { 'x-sveltekit-action': 'true' },
				body
			});
			const result = deserialize(await res.text());
			if (result.type === 'success' && (result.data as { created?: boolean })?.created) {
				toast?.add('Seite angelegt', `/brand/${effSlug} — viel Spaß beim Befüllen.`);
				await goto(`/admin/brand/${effSlug}`);
			} else if (result.type === 'failure') {
				const msg = (result.data as { message?: string } | undefined)?.message;
				toast?.add('Nicht angelegt', msg ?? 'Anlegen fehlgeschlagen.');
			} else {
				toast?.add('Fehler', 'Anlegen fehlgeschlagen.');
			}
		} catch (err) {
			toast?.add('Fehler', err instanceof Error ? err.message : 'Anlegen fehlgeschlagen.');
		} finally {
			creating = false;
		}
	}
</script>

<svelte:head><title>Brand-Seiten – Übersicht & Reihenfolge</title></svelte:head>

<div class="admin">
	<AdminPageHeader title="Brand-Seiten" crumb={{ href: '/admin', label: 'Admin' }}>
		{#snippet actions()}
			{#if data.writable}
				<Button
					variant="accent"
					aria-expanded={showNew}
					onclick={() => (showNew = !showNew)}>+ Neue Seite</Button
				>
			{/if}
		{/snippet}
		Diese Übersicht spiegelt die <strong>reale Reihenfolge &amp; Hierarchie</strong> der
		Brand-Sidebar (Single Source of Truth). Ziehe Einträge am Griff
		<span class="grip-inline" aria-hidden="true"></span>
		oder nutze die Pfeile, um sie umzusortieren — die Änderung wird sofort gespeichert und wirkt in der
		ganzen Brand-Sektion. Ein Klick auf editierbare Seiten öffnet den Inhalts-Editor.
	</AdminPageHeader>

	{#if showNew}
		<form class="new-panel" onsubmit={createPage}>
			<label class="np-field">
				<span class="np-lbl">Titel</span>
				<!-- svelte-ignore a11y_autofocus — bewusst: Panel öffnet auf Klick, Fokus gehört ins Feld -->
				<input bind:value={newTitle} placeholder="Seitentitel eingeben …" autofocus />
			</label>
			<label class="np-field">
				<span class="np-lbl">URL</span>
				<span class="np-slug">
					<span class="np-prefix">/brand/</span>
					<input
						value={effSlug}
						placeholder="neue-seite"
						spellcheck="false"
						oninput={(e) => {
							slugTouched = true;
							newSlug = e.currentTarget.value;
						}}
					/>
				</span>
			</label>
			<div class="np-actions">
				<Button
					type="submit"
					variant="accent"
					disabled={creating || !newTitle.trim() || !effSlug}
					>{creating ? 'Wird angelegt …' : 'Anlegen & bearbeiten'}</Button
				>
				<Button variant="quiet" onclick={() => (showNew = false)}>Abbrechen</Button>
				<span class="np-hint"
					>Erscheint am Ende der Sidebar — Position danach per Drag&nbsp;&amp;&nbsp;Drop.</span
				>
			</div>
		</form>
	{/if}

	{#if !data.writable}
		<Alert compact variant="warning">
			Nur-Lese-Vorschau: Umsortieren ist im Prod-Modus deaktiviert (Phase 2b: GitHub-PR).
		</Alert>
	{/if}

	<ul class="tree" class:is-saving={saving}>
		{#each tree as section, i (section.title)}
			{@const kind = sectionKind(section)}
			<!-- Top-Level-<li> ist die Drag-Quelle (implizite listitem-Rolle → a11y ok);
			     der Drop-Indikator sitzt auf der sichtbaren .row darunter. -->
			<li
				class="item"
				draggable={data.writable}
				ondragstart={(e) => onDragStart(e, { kind: 'top', index: i })}
				ondragover={(e) => onDragOver(e, { kind: 'top', index: i })}
				ondrop={(e) => onDrop(e, { kind: 'top', index: i })}
				ondragend={onDragEnd}
			>
				{#if kind === 'category'}
					<!-- Kategorie = Abschnitts-Überschrift (kein Link, aber umsortierbar). -->
					<AdminRow tag="div" class="row--cat" dragover={overKey === `t${i}`}>
						{@render grip(data.writable)}
						<span class="cat-title">{section.title}</span>
						{@render nudges(
							() => nudgeTop(i, -1),
							() => nudgeTop(i, 1),
							i === 0,
							i === tree.length - 1
						)}
					</AdminRow>
				{:else if kind === 'group'}
					<!-- Thema mit Unterseiten. -->
					<AdminRow tag="div" class="row--group" dragover={overKey === `t${i}`}>
						{@render grip(data.writable)}
						<span class="icon" aria-hidden="true">{@render folderIcon()}</span>
						<span class="name">{section.title}</span>
						<Badge tone="accent">Thema</Badge>
						<span class="count">{section.items?.length} Seiten</span>
						{@render nudges(
							() => nudgeTop(i, -1),
							() => nudgeTop(i, 1),
							i === 0,
							i === tree.length - 1
						)}
					</AdminRow>
					<ul class="children">
						{#each section.items ?? [] as child, ci (child.href)}
							{@const ed = canEdit(child.href)}
							<AdminRow
								tag="li"
								indent
								dragover={overKey === `c${i}.${ci}`}
								draggable={data.writable}
								ondragstart={(e: DragEvent) => onDragStart(e, { kind: 'child', group: i, index: ci })}
								ondragover={(e: DragEvent) => onDragOver(e, { kind: 'child', group: i, index: ci })}
								ondrop={(e: DragEvent) => onDrop(e, { kind: 'child', group: i, index: ci })}
								ondragend={onDragEnd}
							>
								{@render grip(data.writable)}
								<span class="icon" aria-hidden="true">{@render pageIcon()}</span>
								{#if ed}
									<a class="name" href="/admin/brand/{editPath(child.href)}" draggable="false"
										>{child.label}</a
									>
								{:else}
									<span class="name name--locked">{child.label}</span>
								{/if}
								{#if child.badge}<Badge tone="default">{child.badge}</Badge>{/if}
								<span class="path">{child.href}</span>
								{@render nudges(
									() => nudgeChild(i, ci, -1),
									() => nudgeChild(i, ci, 1),
									ci === 0,
									ci === (section.items?.length ?? 0) - 1
								)}
							</AdminRow>
						{/each}
					</ul>
				{:else}
					<!-- Blatt-Seite. -->
					{@const ed = canEdit(section.href)}
					<AdminRow tag="div" class="row--leaf" dragover={overKey === `t${i}`}>
						{@render grip(data.writable)}
						<span class="icon" aria-hidden="true">{@render pageIcon()}</span>
						{#if ed && section.href}
							<a class="name" href="/admin/brand/{editPath(section.href)}" draggable="false"
								>{section.title}</a
							>
						{:else}
							<span class="name name--locked">{section.title}</span>
						{/if}
						{#if section.badge}<Badge tone="default">{section.badge}</Badge>{/if}
						<span class="path">{section.href}</span>
						{@render nudges(
							() => nudgeTop(i, -1),
							() => nudgeTop(i, 1),
							i === 0,
							i === tree.length - 1
						)}
					</AdminRow>
				{/if}
			</li>
		{/each}
	</ul>
</div>

<!-- Inline-Icons (kein externer Fetch) — Ordner (Thema) & Seite (Blatt/Unterseite). -->
{#snippet folderIcon()}
	<svg
		width="16"
		height="16"
		viewBox="0 0 16 16"
		fill="none"
		stroke="currentColor"
		stroke-width="1.4"
	>
		<path
			d="M1.5 4.5a1 1 0 0 1 1-1h3l1.5 1.5h5.5a1 1 0 0 1 1 1v6a1 1 0 0 1-1 1h-11a1 1 0 0 1-1-1z"
		/>
	</svg>
{/snippet}
{#snippet pageIcon()}
	<svg
		width="16"
		height="16"
		viewBox="0 0 16 16"
		fill="none"
		stroke="currentColor"
		stroke-width="1.4"
	>
		<path d="M4 1.5h5L12.5 5v9a.5.5 0 0 1-.5.5H4a.5.5 0 0 1-.5-.5v-12a.5.5 0 0 1 .5-.5z" />
		<path d="M9 1.5V5h3.5" />
	</svg>
{/snippet}

<!-- Griff-Affordanz (CMS-Icon), nur wenn schreibbar. -->
{#snippet grip(enabled: boolean)}
	<span class="grip" class:grip--off={!enabled} aria-hidden="true"><Icon name="grip" /></span>
{/snippet}

<!-- ↑/↓-Buttons (präzise, barrierefreie Umsortierung; CMS-Pfeil-Icons). -->
{#snippet nudges(up: () => void, down: () => void, atTop: boolean, atBottom: boolean)}
	{#if data.writable}
		<span class="nudge">
			<button type="button" onclick={up} disabled={atTop} aria-label="Nach oben"
				><Icon name="arrow-up" /></button
			>
			<button type="button" onclick={down} disabled={atBottom} aria-label="Nach unten"
				><Icon name="arrow-down" /></button
			>
		</span>
	{/if}
{/snippet}

<style>
	.admin {
		max-width: 56rem;
		margin: 0 auto;
		padding: var(--z-ds-space-xl) var(--z-ds-space-l);
	}
	/* Griff-Glyphe im Beschreibungstext (erklärt die Drag-Affordanz). */
	.grip-inline {
		display: inline-block;
		width: 0.6em;
		height: 0.9em;
		vertical-align: -0.1em;
		background-image: radial-gradient(currentColor 1px, transparent 1px);
		background-size: 0.3em 0.3em;
		opacity: 0.5;
	}

	.tree {
		list-style: none;
		margin: 0;
		padding: 0;
	}
	.tree > li {
		list-style: none;
	}
	.tree.is-saving {
		opacity: 0.7;
		pointer-events: none;
	}
	.children {
		list-style: none;
		margin: 0 0 0 var(--z-ds-space-l);
		padding: 0;
		border-left: 2px solid var(--ds-border-soft);
	}

	/* Zeilen-Gehäuse (Höhe/Radius/Hover) liegt in AdminRow. Hier nur die
	   Brand-spezifischen Modifier auf dessen Element (daher :global). */
	.tree :global(.row--cat) {
		margin-top: var(--z-ds-space-m);
	}
	.cat-title {
		flex: 1;
		font-size: var(--ds-text-xs);
		font-weight: 700;
		letter-spacing: 0.06em;
		text-transform: uppercase;
		color: var(--ds-text-muted);
	}
	:global(.row--group) .name {
		font-weight: 600;
	}

	.grip {
		display: inline-flex;
		color: var(--ds-text-muted);
		cursor: grab;
		opacity: 0.3;
		transition: opacity var(--ds-dur) var(--ds-ease-out);
	}
	:global(.admin-row:hover) .grip {
		opacity: 0.7;
	}
	.grip:active {
		cursor: grabbing;
	}
	.grip--off {
		visibility: hidden;
	}
	.icon {
		display: inline-flex;
		color: var(--ds-text-muted);
	}
	.name {
		color: var(--ds-text);
		text-decoration: none;
	}
	a.name:hover {
		text-decoration: underline;
	}
	.name--locked {
		color: var(--ds-text-muted);
	}
	.path {
		margin-left: auto;
		font-size: var(--ds-text-xs);
		color: var(--ds-text-muted);
		font-family: var(--ds-font-mono);
	}
	.count {
		font-size: var(--ds-text-xs);
		color: var(--ds-text-muted);
	}

	.nudge {
		display: inline-flex;
		gap: 2px;
		margin-left: var(--z-ds-space-s);
		opacity: 0.35;
		transition: opacity var(--ds-dur) var(--ds-ease-out);
	}
	:global(.admin-row:hover) .nudge,
	:global(.admin-row:focus-within) .nudge {
		opacity: 1;
	}
	.nudge button {
		width: 1.4rem;
		height: 1.4rem;
		display: inline-flex;
		align-items: center;
		justify-content: center;
		border: 1px solid var(--ds-border);
		border-radius: var(--ds-radius-xs, 0.25rem);
		background: var(--ds-surface);
		color: var(--ds-text);
		cursor: pointer;
		font-size: var(--ds-text-xs);
		line-height: 1;
	}
	.nudge button:hover:not(:disabled) {
		background: var(--ds-surface-raised);
	}
	.nudge button:disabled {
		opacity: 0.3;
		cursor: not-allowed;
	}
	.nudge button:focus-visible {
		outline: 2px solid var(--ds-focus-ring);
		outline-offset: 1px;
	}

	/* ── Neue Seite anlegen ── (Buttons: <Button variant="accent|quiet">) */
	.new-panel {
		display: grid;
		gap: var(--z-ds-space-s);
		background: var(--ds-surface-raised, var(--ds-surface));
		border-radius: var(--ds-radius, 8px);
		padding: var(--z-ds-space-m);
		margin: var(--z-ds-space-m) 0;
	}
	.np-field {
		display: grid;
		gap: 4px;
	}
	.np-lbl {
		font-size: var(--ds-text-xs);
		color: var(--ds-text-muted);
	}
	.np-field input {
		width: 100%;
		font: inherit;
		font-size: var(--ds-text-base);
		color: var(--ds-text);
		background: var(--ds-surface);
		border: 1px solid var(--ds-border);
		border-radius: var(--ds-radius, 8px);
		padding: 9px 12px;
	}
	.np-field input:focus-visible {
		outline: 2px solid var(--ds-focus-ring);
		outline-offset: 1px;
	}
	.np-slug {
		display: flex;
		align-items: center;
		gap: var(--z-ds-space-6);
	}
	.np-prefix {
		font-family: var(--ds-font-mono);
		font-size: var(--ds-text-sm);
		color: var(--ds-text-muted);
		white-space: nowrap;
	}
	.np-slug input {
		font-family: var(--ds-font-mono);
		font-size: var(--ds-text-sm);
	}
	.np-actions {
		display: flex;
		align-items: center;
		gap: var(--z-ds-space-s);
		flex-wrap: wrap;
	}
	.np-hint {
		font-size: var(--ds-text-xs);
		color: var(--ds-text-muted);
	}
</style>
