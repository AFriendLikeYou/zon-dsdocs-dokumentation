<script lang="ts">
	import { AdminPageHeader, AdminRow } from './ui';
	import { Badge } from '$components/ui/badge';

	let { data }: import('./$types').PageProps = $props();

	// Einstiegs-Karten in die beiden „anderen Welten" (Medien, Brand-Seiten).
	const SECTIONS = [
		{ href: '/admin/media', name: 'Medien', desc: 'Bilder hochladen & verwalten' },
		{ href: '/admin/brand', name: 'Brand-Seiten', desc: 'Prosa & Frontmatter bearbeiten' }
	];

	const totals = $derived(data.totals);

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
				Struktur &amp; Reihenfolge = Live-Sidebar. Umsortieren passiert im Code (<code
					>navigation.ts</code
				>
				· <code>CATALOG_OVERRIDES</code>), nicht per Drag&nbsp;&amp;&nbsp;Drop.
			</p>
			<p class="totals">
				raw {totals.raw}/{totals.total} · vollständig {totals.vollstaendig}/{totals.total}
				{#if totals.gate1}· <span class="totals__warn">Gate 1: {totals.gate1}</span>{/if}
				{#if totals.drift}· <span class="totals__warn">Drift: {totals.drift}</span>{/if}
			</p>
		</div>

		<ul class="list">
			{#each data.productNav as item (item.title + (item.href ?? ''))}
				{#if item.isCategory}
					<li>
						<AdminRow tag="div" interactive={false} class="cat">
							<span class="cat-title" aria-hidden="true">{item.title}</span>
						</AdminRow>
					</li>
				{:else if item.isComponent}
					<!-- Komponenten-Zeile: EIN Eintrag, Status als Chips, Link auf den Spec-Editor. -->
					<li>
						<AdminRow tag="div">
							<span class="name">
								{#if item.editHref}
									<a class="comp-name" href={item.editHref}>{item.title}</a>
								{:else}
									<span class="comp-name comp-name--muted">{item.title}</span>
								{/if}
							</span>
							{#if item.planned}
								<span class="chips">
									<Badge tone="ghost" title="Geplant — wartet auf den Figma-Import.">Geplant</Badge>
								</span>
							{:else if item.status}
								{@render componentChips(item.status, item.editHref)}
							{/if}
							{#if item.href}
								<a class="act act--view" href={item.href} title="Live-Seite ansehen"
									>Ansehen&nbsp;↗</a
								>
							{/if}
						</AdminRow>
					</li>
				{:else}
					<li>
						<AdminRow tag="div">
							<span class="name">
								{item.title}
								{#if item.badge}<Badge tone="default">{item.badge}</Badge>{/if}
							</span>
							<span class="actions">
								{#if item.editHref}
									<a class="act act--edit" href={item.editHref}>Bearbeiten</a>
								{:else}
									<Badge tone="ghost">Code-Seite</Badge>
								{/if}
								{#if item.href}
									<a class="act" href={item.href} title="Live-Seite ansehen">Ansehen&nbsp;↗</a>
								{/if}
							</span>
						</AdminRow>
					</li>
				{/if}
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
	.list {
		list-style: none;
		margin: 0;
		padding: 0;
	}
	.list > li {
		list-style: none;
	}
	/* Kategorie-Zeile: Abschnitts-Label wie in der Sidebar (kein Link, kein Hover). */
	.list :global(.cat) {
		margin-top: var(--z-ds-space-m);
	}
	.cat-title {
		font-size: var(--ds-label-size, var(--ds-text-xs));
		text-transform: uppercase;
		letter-spacing: var(--ds-label-tracking);
		font-weight: 700;
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
