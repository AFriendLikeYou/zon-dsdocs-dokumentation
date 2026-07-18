<script lang="ts">
	import { AdminPageHeader, AdminRow, AdminBadge } from './ui';

	let { data }: import('./$types').PageProps = $props();

	// Einstiegs-Karten in die beiden „anderen Welten" (Medien, Brand-Seiten).
	const SECTIONS = [
		{ href: '/admin/media', name: 'Medien', desc: 'Bilder hochladen & verwalten' },
		{ href: '/admin/brand', name: 'Brand-Seiten', desc: 'Prosa & Frontmatter bearbeiten' }
	];
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
