<script lang="ts">
	import { getToastState } from '$stores/toast-state.svelte';
	import { AdminPageHeader, AdminRow, DragGrip, NudgeButtons } from './ui';
	import { Badge } from '$components/ui/badge';
	import { Banner } from '$components/ui/banner';
	import { Reorder } from './core/reorder.svelte';

	let { data }: import('./$types').PageProps = $props();
	const toast = getToastState();

	// Einstiegs-Karten in die übrigen Welten (Startseite, Medien, Brand-Seiten).
	// Die Startseite ist eine komponierte Seite → Formular-Editor, kein Block-Editor.
	const SECTIONS = [
		{ href: '/admin/start', name: 'Startseite', desc: 'Hero, Welten-Karten & „Was ist neu"' },
		{ href: '/admin/media', name: 'Medien', desc: 'Bilder hochladen & verwalten' },
		{ href: '/admin/brand', name: 'Brand-Seiten', desc: 'Prosa & Frontmatter bearbeiten' }
	];

	const totals = $derived(data.totals);

	// Arbeits-Baum (umsortierbar) — Reihenfolge der statischen Design-System-Einträge
	// lebt in src/lib/data/product-nav.json (SSOT, ADR-030); die Sidebar leitet daraus
	// ab. Mechanik (Klonen, Server-Resync, Persistieren via ?/reorder, ↑/↓-Nudges,
	// natives Drag&Drop) kommt aus derselben Reorder-Klasse wie bei /admin/brand.
	type NavRow = (typeof data.navTree)[number];
	const reorder = new Reorder<NavRow>({
		initial: data.navTree,
		writable: () => data.writable,
		notify: (title, body) => toast?.add(title, body)
	});
	$effect(() => reorder.sync(data.navTree));

	// ── Doku-Lücken → Chips mit Deep-Link in den passenden Editor-Abschnitt ──────
	// Jedes fehlende Kriterium ergibt EINEN kleinen warn-Chip, der genau auf seinen
	// Abschnitt springt (a11y → sec-a11y, Zustände → Design-Cluster, Do/Don't →
	// sec-doDont). Vollständig = keine Lücke = kein Chip (Ruhe ist der Normalzustand).
	type Kriterien = { zustaende: boolean; a11y: boolean; doDont: boolean };
	type Gap = { label: string; anchor: string; title: string };
	function docGaps(k: Kriterien): Gap[] {
		const gaps: Gap[] = [];
		if (!k.zustaende)
			gaps.push({
				label: 'Zustände',
				anchor: 'cluster-design',
				title:
					'Weniger als 2 Zustände dokumentiert — im Design-Cluster prüfen (Varianten & Zustände).'
			});
		if (!k.a11y)
			gaps.push({
				label: 'a11y',
				anchor: 'sec-a11y',
				title: 'Weniger als 2 Barrierefreiheits-Einträge — im Editor ergänzen.'
			});
		if (!k.doDont)
			gaps.push({
				label: 'Do/Don’t',
				anchor: 'sec-doDont',
				title: 'Kein Do & Don’t dokumentiert — im Editor ergänzen.'
			});
		return gaps;
	}
</script>

<svelte:head><title>Inhalte bearbeiten – Admin</title></svelte:head>

<!-- Ein kleiner Status-Chip an der Komponenten-Zeile (nur bei Handlungsbedarf). -->
{#snippet componentChips(
	status: {
		hasRaw: boolean;
		drift: boolean;
		gate1: boolean;
		aktualisiertAm: string | null;
		kriterien: Kriterien;
	},
	editHref: string | null
)}
	<span class="chips">
		{#if status.drift}
			{#if editHref}
				<a
					class="chip-link"
					href="{editHref}#cluster-design"
					title="Design-Drift — figma-raw.json ist neuer als model.json. Re-Import prüfen."
				>
					<Badge tone="warn">⚠ Drift</Badge>
				</a>
			{:else}
				<Badge tone="warn" title="Design-Drift — Re-Import prüfen.">⚠ Drift</Badge>
			{/if}
		{/if}
		{#if !status.hasRaw}
			<Badge tone="ghost" title="Kein figma-raw.json — Design-Drift lässt sich nicht prüfen."
				>kein raw</Badge
			>
		{:else if status.gate1}
			<Badge tone="ghost" title="Gate 1 — Import unvollständig, Token-Namen fehlen.">Gate 1</Badge>
		{/if}
		{#each docGaps(status.kriterien) as gap (gap.anchor)}
			{#if editHref}
				<a class="chip-link" href="{editHref}#{gap.anchor}" title={gap.title}>
					<Badge tone="warn">{gap.label}</Badge>
				</a>
			{:else}
				<Badge tone="warn" title={gap.title}>{gap.label}</Badge>
			{/if}
		{/each}
	</span>
	{#if status.aktualisiertAm}
		<span class="sync-quiet" title="Letzter Figma-Sync">{status.aktualisiertAm}</span>
	{/if}
{/snippet}

<div class="admin">
	<AdminPageHeader title="Inhalte bearbeiten">
		Redaktionelle Inhalte ohne Git/Editor pflegen. Die Liste unten spiegelt die
		<strong>echte Produkt-Sidebar</strong> in Live-Struktur und -Reihenfolge — editierbar sind die
		redaktionellen <code>content.json</code>-Felder der Komponenten; Modell, Maße und Tokens kommen
		aus Figma und sind bewusst nicht editierbar.
	</AdminPageHeader>

	<!-- Einstiegs-Karten (Caps-Titel, ruhige Fläche — wie die Editor-Karten). -->
	<nav class="sections" aria-label="Bereiche">
		{#each SECTIONS as s (s.href)}
			<a class="section" href={s.href}>
				<span class="section-name">{s.name}</span>
				<span class="section-desc">{s.desc}</span>
			</a>
		{/each}
	</nav>

	<!-- EINE Liste: Design-System-Inhalte spiegeln die Sidebar; Komponenten tragen ihren
	     Sync-/Doku-Status als kompakte Chips (nur bei Handlungsbedarf) direkt an der Zeile. -->
	<section class="block">
		<div class="block-head">
			<h2 class="block-title">Design-System-Inhalte</h2>
			<p class="hint">
				Struktur &amp; Reihenfolge = Live-Sidebar. Ziehe Einträge am Griff
				<span class="grip-inline" aria-hidden="true"></span>
				oder nutze die Pfeile — die Änderung wird sofort gespeichert und wirkt in der ganzen
				Design-System-Sektion. Der <strong>Komponenten-Block</strong> ist katalog-getrieben: seine
				Position lässt sich verschieben, seine Einträge kommen automatisch aus den
				<code>model.json</code> (Reihenfolge via <code>CATALOG_OVERRIDES</code>).
			</p>
			<p class="totals">
				raw {totals.raw}/{totals.total} · vollständig {totals.vollstaendig}/{totals.total}
				{#if totals.gate1}· <span class="totals__warn">Gate 1: {totals.gate1}</span>{/if}
				{#if totals.drift}· <span class="totals__warn">Drift: {totals.drift}</span>{/if}
			</p>
		</div>

		{#if !data.writable}
			<Banner compact variant="warning">
				Nur-Lese-Vorschau: Umsortieren ist im Prod-Modus deaktiviert (Phase 2b: GitHub-PR).
			</Banner>
		{/if}

		<ul class="tree" class:is-saving={reorder.saving}>
			{#each reorder.tree as entry, i (entry.title + (entry.href ?? ''))}
				<!-- Top-Level-<li> ist die Drag-Quelle (implizite listitem-Rolle → a11y ok);
				     der Drop-Indikator sitzt auf der sichtbaren Zeile darunter. -->
				<li
					class="item"
					draggable={data.writable}
					ondragstart={(e) => reorder.onDragStart(e, { kind: 'top', index: i })}
					ondragover={(e) => reorder.onDragOver(e, { kind: 'top', index: i })}
					ondrop={(e) => reorder.onDrop(e, { kind: 'top', index: i })}
					ondragend={reorder.onDragEnd}
				>
					{#if entry.isCategory}
						<!-- Kategorie = Abschnitts-Überschrift (kein Link, aber umsortierbar). -->
						<AdminRow tag="div" class="row--cat" dragover={reorder.isOver({ kind: 'top', index: i })}>
							<DragGrip enabled={data.writable} />
							<span class="cat-title">{entry.title}</span>
							{@render nudges(i)}
						</AdminRow>
					{:else if entry.isCatalog}
						<!-- Katalog-Block: POSITION sortierbar, INHALT automatisch (ADR-025). -->
						<AdminRow
							tag="div"
							class="row--catalog"
							dragover={reorder.isOver({ kind: 'top', index: i })}
						>
							<DragGrip enabled={data.writable} />
							<span class="name">{entry.title}</span>
							<Badge tone="ghost" title="Aus den model.json generiert — nicht von Hand sortierbar."
								>automatisch</Badge
							>
							<span class="count">{entry.components?.length ?? 0} Einträge</span>
							{@render nudges(i)}
						</AdminRow>
						<ul class="children">
							{#each entry.components ?? [] as comp (comp.href)}
								<!-- Komponenten-Zeile: EIN Eintrag, Status als Chips, Link auf den Spec-Editor.
								     Bewusst NICHT ziehbar — die Reihenfolge kommt aus dem Katalog. -->
								<AdminRow tag="li" indent>
									<span class="name">
										{#if comp.editHref}
											<a class="comp-name" href={comp.editHref} draggable="false">{comp.title}</a>
										{:else}
											<span class="comp-name comp-name--muted">{comp.title}</span>
										{/if}
									</span>
									{#if comp.planned}
										<span class="chips">
											<Badge tone="ghost" title="Geplant — wartet auf den Figma-Import."
												>Geplant</Badge
											>
										</span>
									{:else if comp.status}
										{@render componentChips(comp.status, comp.editHref)}
									{/if}
									{#if comp.href}
										<a class="act act--view" href={comp.href} title="Live-Seite ansehen"
											>Ansehen&nbsp;↗</a
										>
									{/if}
								</AdminRow>
							{/each}
						</ul>
					{:else}
						<!-- Statische Seite (Foundations, Patterns, Resources …). -->
						<AdminRow tag="div" dragover={reorder.isOver({ kind: 'top', index: i })}>
							<DragGrip enabled={data.writable} />
							<span class="name">
								{entry.title}
								{#if entry.badge}<Badge tone="default">{entry.badge}</Badge>{/if}
							</span>
							<span class="actions">
								{#if entry.editHref}
									<a class="act act--edit" href={entry.editHref} draggable="false">Bearbeiten</a>
								{:else}
									<Badge tone="ghost">Code-Seite</Badge>
								{/if}
								{#if entry.href}
									<a class="act" href={entry.href} draggable="false" title="Live-Seite ansehen"
										>Ansehen&nbsp;↗</a
									>
								{/if}
							</span>
							{@render nudges(i)}
						</AdminRow>
					{/if}
				</li>
			{/each}
		</ul>
		<p class="hint list-legend">
			Chips erscheinen nur bei Handlungsbedarf: <strong>Drift</strong> (Figma neuer als Modell),
			<strong>Gate&nbsp;1</strong>/<strong>kein&nbsp;raw</strong> (Import unvollständig) und
			Doku-Lücken (<strong>Zustände</strong>, <strong>a11y</strong>, <strong>Do/Don’t</strong>) —
			ein Klick springt in den passenden Editor-Abschnitt. Vollprüfung macht
			<code>tooling/check-doc-coverage.mjs</code>.
		</p>
	</section>
</div>

<!-- ↑/↓ für einen Top-Level-Eintrag (nur wenn schreibbar). -->
{#snippet nudges(i: number)}
	{#if data.writable}
		<NudgeButtons
			up={() => reorder.nudgeTop(i, -1)}
			down={() => reorder.nudgeTop(i, 1)}
			atTop={i === 0}
			atBottom={i === reorder.tree.length - 1}
		/>
	{/if}
{/snippet}

<style>
	.admin {
		max-width: var(--ds-container-admin);
		margin: 0 auto;
		padding: var(--z-ds-space-xl) var(--z-ds-space-l);
	}

	/* ── Einstiegs-Karten ── */
	.sections {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(14rem, 1fr));
		gap: var(--z-ds-space-m);
		margin-bottom: var(--z-ds-space-xl);
	}
	.section {
		display: flex;
		flex-direction: column;
		gap: 2px;
		padding: var(--z-ds-space-m) var(--z-ds-space-l);
		border: 1px solid var(--ds-border-soft);
		border-radius: var(--ds-radius);
		background: var(--ds-surface-raised);
		text-decoration: none;
		color: var(--ds-text);
		transition:
			border-color var(--ds-dur) var(--ds-ease-out),
			background var(--ds-dur) var(--ds-ease-out);
	}
	@media (hover: hover) {
		.section:hover {
			border-color: var(--ds-border);
		}
	}
	.section:focus-visible {
		outline: 2px solid var(--ds-focus-ring);
		outline-offset: 2px;
	}
	.section-name {
		font-weight: 600;
	}
	.section-desc {
		font-size: var(--ds-text-sm);
		color: var(--ds-text-muted);
	}

	/* ── Listen-Block ── */
	.block-head {
		margin-bottom: var(--z-ds-space-s);
	}
	.block-title {
		font-size: var(--ds-text-base);
		margin: 0 0 var(--z-ds-space-xs);
	}
	.totals {
		margin: var(--z-ds-space-6) 0 0;
		font-size: var(--ds-text-xs);
		color: var(--ds-text-muted);
	}
	.totals__warn {
		color: var(--ds-tint-warning-text, var(--ds-text-body));
		font-weight: 600;
	}
	.hint {
		font-size: var(--ds-text-xs);
		color: var(--ds-text-muted);
		margin: 0;
	}
	.hint code {
		font-family: var(--ds-font-mono);
	}
	.list-legend {
		margin-top: var(--z-ds-space-s);
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
		margin: var(--z-ds-space-s) 0 0;
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

	/* Kategorie-Zeile: Abschnitts-Label wie in der Sidebar. */
	.tree :global(.row--cat) {
		margin-top: var(--z-ds-space-m);
	}
	.cat-title {
		flex: 1;
		font-size: var(--ds-label-size, var(--ds-text-xs));
		text-transform: uppercase;
		letter-spacing: var(--ds-label-tracking);
		font-weight: 700;
		color: var(--ds-text-muted);
	}
	:global(.row--catalog) .name {
		font-weight: 600;
	}
	.count {
		font-size: var(--ds-text-xs);
		color: var(--ds-text-muted);
	}
	.name {
		flex: 1;
		font-weight: 500;
		color: var(--ds-text);
		display: inline-flex;
		align-items: center;
		gap: var(--z-ds-space-8);
		min-width: 0;
	}
	/* Komponenten-Name = Link in den Spec-Editor. */
	.comp-name {
		color: var(--ds-accent);
		text-decoration: none;
		font-weight: 500;
	}
	.comp-name:hover {
		text-decoration: underline;
	}
	.comp-name:focus-visible {
		outline: 2px solid var(--ds-focus-ring);
		outline-offset: 2px;
		border-radius: var(--ds-radius-xs);
	}
	.comp-name--muted {
		color: var(--ds-text-muted);
	}
	/* Status-Chips: kompakt, rechts vor der Ansehen-Aktion; Wrap auf Schmal. */
	.chips {
		display: inline-flex;
		align-items: center;
		flex-wrap: wrap;
		gap: var(--z-ds-space-6);
		flex: none;
	}
	.chip-link {
		text-decoration: none;
		border-radius: 999px;
	}
	.chip-link:focus-visible {
		outline: 2px solid var(--ds-focus-ring);
		outline-offset: 2px;
	}
	.sync-quiet {
		flex: none;
		font-size: var(--ds-text-xs);
		color: var(--ds-text-faint);
		white-space: nowrap;
	}
	.actions {
		display: inline-flex;
		align-items: center;
		gap: var(--z-ds-space-m);
		flex: none;
	}
	.act {
		font-size: var(--ds-text-sm);
		color: var(--ds-text-muted);
		text-decoration: none;
		border-radius: var(--ds-radius-sm);
		transition: color var(--ds-dur) var(--ds-ease-out);
	}
	.act--edit {
		color: var(--ds-accent);
		font-weight: 600;
	}
	.act--view {
		flex: none;
		white-space: nowrap;
	}
	@media (hover: hover) {
		.act:hover {
			color: var(--ds-text);
		}
	}
	.act:focus-visible {
		outline: 2px solid var(--ds-focus-ring);
		outline-offset: 2px;
	}
</style>
