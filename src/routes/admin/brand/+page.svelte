<script lang="ts">
	import { deserialize } from '$app/forms';
	import { goto } from '$app/navigation';
	import { getToastState } from '$stores/toast-state.svelte';
	import { AdminPageHeader, AdminRow, DragGrip, NudgeButtons } from '../ui';
	import { Badge } from '$components/ui/badge';
	import { Banner } from '$components/ui/banner';
	import { Button } from '$components/ui/button';
	import { Field } from '$components/ui/field';
	import { Reorder } from '../core/reorder.svelte';
	import { sectionKind, type NavSection } from './core/brand-nav';
	import { slugify } from './core/new-page';

	let { data }: import('./$types').PageProps = $props();
	const toast = getToastState();

	// Editierbarkeits-Lookup je öffentlicher URL (aus den gelisteten Brand-Seiten):
	// sagt pro Nav-Knoten, ob er im CMS editierbar ist und unter welchem Editor-Pfad.
	const pageByUrl = new Map(data.pages.map((p) => [p.url, p]));

	// Arbeits-Baum (umsortierbar) — Reihenfolge + Hierarchie leben in
	// src/lib/data/brand-nav.json (SSOT, ADR-028); die Sidebar leitet daraus ab. Die
	// gesamte Mechanik (Klonen, Server-Resync, optimistisches Persistieren via
	// ?/reorder, ↑/↓-Nudges, natives Drag&Drop auf zwei Ebenen) liegt in der
	// gemeinsamen Reorder-Klasse — dieselbe Quelle nutzt die Design-System-Übersicht
	// auf /admin (ADR-030).
	const reorder = new Reorder<NavSection>({
		initial: data.navTree,
		writable: () => data.writable,
		notify: (title, body) => toast?.add(title, body)
	});
	$effect(() => reorder.sync(data.navTree));

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
				<Button variant="accent" aria-expanded={showNew} onclick={() => (showNew = !showNew)}
					>+ Neue Seite</Button
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
				<!-- autofocus ist bewusst: Panel öffnet auf Klick, der Fokus gehört ins Feld.
				     (Kein svelte-ignore nötig — der Compiler warnt hier nicht, weil `autofocus`
				     als Prop an <Field> geht und nicht direkt am Element steht.) -->
				<Field bind:value={newTitle} placeholder="Seitentitel eingeben …" autofocus />
			</label>
			<label class="np-field">
				<span class="np-lbl">URL</span>
				<Field
					class="np-slug"
					font="mono"
					value={effSlug}
					placeholder="neue-seite"
					spellcheck="false"
					oninput={(e) => {
						slugTouched = true;
						newSlug = e.currentTarget.value;
					}}
				>
					{#snippet icon()}<span class="np-prefix">/brand/</span>{/snippet}
				</Field>
			</label>
			<div class="np-actions">
				<Button type="submit" variant="accent" disabled={creating || !newTitle.trim() || !effSlug}
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
		<Banner compact variant="warning">
			Nur-Lese-Vorschau: Umsortieren ist im Prod-Modus deaktiviert (Phase 2b: GitHub-PR).
		</Banner>
	{/if}

	<ul class="tree" class:is-saving={reorder.saving}>
		{#each reorder.tree as section, i (section.title)}
			{@const kind = sectionKind(section)}
			<!-- Top-Level-<li> ist die Drag-Quelle (implizite listitem-Rolle → a11y ok);
			     der Drop-Indikator sitzt auf der sichtbaren .row darunter. -->
			<li
				class="item"
				draggable={data.writable}
				ondragstart={(e) => reorder.onDragStart(e, { kind: 'top', index: i })}
				ondragover={(e) => reorder.onDragOver(e, { kind: 'top', index: i })}
				ondrop={(e) => reorder.onDrop(e, { kind: 'top', index: i })}
				ondragend={reorder.onDragEnd}
			>
				{#if kind === 'category'}
					<!-- Kategorie = Abschnitts-Überschrift (kein Link, aber umsortierbar). -->
					<AdminRow tag="div" class="row--cat" dragover={reorder.isOver({ kind: 'top', index: i })}>
						<DragGrip enabled={data.writable} />
						<span class="cat-title">{section.title}</span>
						{#if data.writable}
							<NudgeButtons
								up={() => reorder.nudgeTop(i, -1)}
								down={() => reorder.nudgeTop(i, 1)}
								atTop={i === 0}
								atBottom={i === reorder.tree.length - 1}
							/>
						{/if}
					</AdminRow>
				{:else if kind === 'group'}
					<!-- Thema mit Unterseiten. -->
					<AdminRow tag="div" class="row--group" dragover={reorder.isOver({ kind: 'top', index: i })}>
						<DragGrip enabled={data.writable} />
						<span class="icon" aria-hidden="true">{@render folderIcon()}</span>
						<span class="name">{section.title}</span>
						<Badge tone="accent">Thema</Badge>
						<span class="count">{section.items?.length} Seiten</span>
						{#if data.writable}
							<NudgeButtons
								up={() => reorder.nudgeTop(i, -1)}
								down={() => reorder.nudgeTop(i, 1)}
								atTop={i === 0}
								atBottom={i === reorder.tree.length - 1}
							/>
						{/if}
					</AdminRow>
					<ul class="children">
						{#each section.items ?? [] as child, ci (child.href)}
							{@const ed = canEdit(child.href)}
							<AdminRow
								tag="li"
								indent
								dragover={reorder.isOver({ kind: 'child', group: i, index: ci })}
								draggable={data.writable}
								ondragstart={(e: DragEvent) =>
									reorder.onDragStart(e, { kind: 'child', group: i, index: ci })}
								ondragover={(e: DragEvent) =>
									reorder.onDragOver(e, { kind: 'child', group: i, index: ci })}
								ondrop={(e: DragEvent) => reorder.onDrop(e, { kind: 'child', group: i, index: ci })}
								ondragend={reorder.onDragEnd}
							>
								<DragGrip enabled={data.writable} />
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
								{#if data.writable}
									<NudgeButtons
										up={() => reorder.nudgeChild(i, ci, -1)}
										down={() => reorder.nudgeChild(i, ci, 1)}
										atTop={ci === 0}
										atBottom={ci === (section.items?.length ?? 0) - 1}
									/>
								{/if}
							</AdminRow>
						{/each}
					</ul>
				{:else}
					<!-- Blatt-Seite. -->
					{@const ed = canEdit(section.href)}
					<AdminRow tag="div" class="row--leaf" dragover={reorder.isOver({ kind: 'top', index: i })}>
						<DragGrip enabled={data.writable} />
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
						{#if data.writable}
							<NudgeButtons
								up={() => reorder.nudgeTop(i, -1)}
								down={() => reorder.nudgeTop(i, 1)}
								atTop={i === 0}
								atBottom={i === reorder.tree.length - 1}
							/>
						{/if}
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

<style>
	.admin {
		max-width: var(--ds-container-admin);
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
	/* Titel/URL-Felder = ui/Field (Fläche/Kontur/Fokus trägt das Atom). Der /brand/-Präfix
	   sitzt als führendes Icon im Slug-Feld; hier bleibt nur seine Typografie. */
	.np-prefix {
		font-family: var(--ds-font-mono);
		font-size: var(--ds-text-sm);
		color: var(--ds-text-muted);
		white-space: nowrap;
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
