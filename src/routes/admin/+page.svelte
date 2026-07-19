<script lang="ts">
	import { AdminPageHeader, AdminRow, AdminBadge } from './ui';

	let { data }: import('./$types').PageProps = $props();

	// Einstiegs-Karten in die beiden „anderen Welten" (Medien, Brand-Seiten).
	const SECTIONS = [
		{ href: '/admin/media', name: 'Medien', desc: 'Bilder hochladen & verwalten' },
		{ href: '/admin/brand', name: 'Brand-Seiten', desc: 'Prosa & Frontmatter bearbeiten' }
	];

	const board = $derived(data.board);
	const AMPEL_LABEL = {
		vollstaendig: 'vollständig',
		teilweise: 'unvollständig',
		leer: 'leer'
	} as const;
</script>

<svelte:head><title>Inhalte bearbeiten – Admin</title></svelte:head>

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

	<!-- Pipeline-Board (Feature B): Komponenten-Status aus Figma-Import + Doku-Ampel. -->
	<section class="block">
		<div class="block-head block-head--board">
			<h2 class="block-title">Komponenten</h2>
			<p class="totals">
				raw {board.totals.raw}/{board.totals.total} · vollständig {board.totals.vollstaendig}/{board
					.totals.total}
				{#if board.totals.gate1}· <span class="totals__warn">Gate 1: {board.totals.gate1}</span>{/if}
				{#if board.totals.drift}· <span class="totals__warn">Drift: {board.totals.drift}</span>{/if}
			</p>
		</div>

		<ul class="list">
			<li class="board-head" aria-hidden="true">
				<span class="board-col board-col--name">Komponente</span>
				<span class="board-col board-col--sync">Figma-Sync</span>
				<span class="board-col board-col--doc">Doku</span>
				<span class="board-col board-col--hint">Hinweis</span>
			</li>
			{#each board.rows as row (row.slug)}
				<li>
					<AdminRow tag="div">
						<span class="board-col board-col--name">
							<a class="board-name" href={row.editHref}>{row.name}</a>
						</span>
						<span class="board-col board-col--sync">
							<span class="sync-date">{row.aktualisiertAm ?? '—'}</span>
							{#if !row.hasRaw}
								<AdminBadge tone="muted">kein raw</AdminBadge>
							{:else if row.gate1}
								<AdminBadge tone="accent">Gate 1</AdminBadge>
							{:else if row.drift}
								<AdminBadge tone="accent">⚠ Drift</AdminBadge>
							{/if}
						</span>
						<span class="board-col board-col--doc">
							<span
								class="ampel ampel--{row.doc.ampel}"
								title="{row.doc.erfuellt}/3 Kriterien (Zustände ≥ 2, a11y ≥ 2, Do/Don't)"
							></span>
							<span class="ampel-label">{AMPEL_LABEL[row.doc.ampel]}</span>
						</span>
						<span class="board-col board-col--hint">{row.hinweis}</span>
					</AdminRow>
				</li>
			{/each}
		</ul>
		<p class="hint board-legend">
			Doku-Ampel: grün = alle 3 Kriterien (Zustände&nbsp;≥&nbsp;2, a11y&nbsp;≥&nbsp;2, Do/Don't),
			gelb = teils, rot = keins. Vollprüfung macht
			<code>tooling/check-doc-coverage.mjs</code>.
		</p>
	</section>

	<section class="block">
		<div class="block-head">
			<h2 class="block-title">Design-System-Inhalte</h2>
			<p class="hint">
				Struktur &amp; Reihenfolge = Live-Sidebar. Umsortieren passiert im Code
				(<code>navigation.ts</code> · <code>CATALOG_OVERRIDES</code>), nicht per
				Drag&nbsp;&amp;&nbsp;Drop.
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
				{:else}
					<li>
						<AdminRow tag="div">
							<span class="name">
								{item.title}
								{#if item.badge}<AdminBadge tone="default">{item.badge}</AdminBadge>{/if}
							</span>
							<span class="actions">
								{#if item.editHref}
									<a class="act act--edit" href={item.editHref}>Bearbeiten</a>
								{:else}
									<AdminBadge tone="muted">Code-Seite</AdminBadge>
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
	</section>
</div>

<style>
	.admin {
		max-width: 56rem;
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
	.block-head--board {
		display: flex;
		align-items: baseline;
		justify-content: space-between;
		gap: var(--z-ds-space-m);
		flex-wrap: wrap;
	}
	.totals {
		margin: 0;
		font-size: var(--ds-text-xs);
		color: var(--ds-text-muted);
	}
	.totals__warn {
		color: var(--ds-warning-text, var(--ds-text-body));
		font-weight: 600;
	}

	/* ── Board-Spalten ── */
	.board-head {
		display: flex;
		align-items: center;
		gap: var(--z-ds-space-s);
		padding: 0 var(--z-ds-space-m) var(--z-ds-space-6);
		font-size: var(--ds-text-xs);
		text-transform: uppercase;
		letter-spacing: var(--ds-label-tracking);
		color: var(--ds-text-muted);
		font-weight: 700;
	}
	.board-col {
		display: inline-flex;
		align-items: center;
		gap: var(--z-ds-space-8);
		min-width: 0;
	}
	.board-col--name {
		flex: 1 1 10rem;
	}
	.board-col--sync {
		flex: 0 0 11rem;
	}
	.board-col--doc {
		flex: 0 0 9rem;
	}
	.board-col--hint {
		flex: 2 1 12rem;
		font-size: var(--ds-text-xs);
		color: var(--ds-text-muted);
	}
	.board-name {
		font-weight: 500;
		color: var(--ds-accent);
		text-decoration: none;
	}
	.board-name:hover {
		text-decoration: underline;
	}
	.board-name:focus-visible {
		outline: 2px solid var(--ds-focus-ring);
		outline-offset: 2px;
	}
	.sync-date {
		font-size: var(--ds-text-sm);
		color: var(--ds-text-body);
	}
	.ampel {
		display: inline-block;
		width: 10px;
		height: 10px;
		border-radius: 999px;
		flex: none;
		background: var(--ds-text-muted);
	}
	.ampel--vollstaendig {
		background: var(--ds-positive, #2e7d32);
	}
	.ampel--teilweise {
		background: var(--ds-warning, #e6a700);
	}
	.ampel--leer {
		background: var(--ds-negative, #c62828);
	}
	.ampel-label {
		font-size: var(--ds-text-sm);
		color: var(--ds-text-body);
	}
	.board-legend {
		margin-top: var(--z-ds-space-s);
	}
	.board-legend code {
		font-family: var(--ds-font-mono);
	}
	@media (max-width: 40rem) {
		.board-head {
			display: none;
		}
		.board-col--sync,
		.board-col--doc,
		.board-col--hint {
			flex-basis: auto;
		}
	}
	.block-title {
		font-size: var(--ds-text-base);
		margin: 0 0 var(--z-ds-space-xs);
	}
	.hint {
		font-size: var(--ds-text-xs);
		color: var(--ds-text-muted);
		margin: 0;
	}
	.hint code {
		font-family: var(--ds-font-mono);
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
