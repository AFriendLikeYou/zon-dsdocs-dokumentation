<script lang="ts">
	let { data }: import('./$types').PageProps = $props();
</script>

<svelte:head><title>Inhalte bearbeiten – Admin</title></svelte:head>

<div class="admin">
	<h1>Inhalte bearbeiten</h1>
	<p class="lead">
		Redaktionelle Inhalte ohne Git/Editor pflegen. Die Liste unten spiegelt die
		<strong>echte Produkt-Sidebar</strong> in Live-Struktur und -Reihenfolge — editierbar sind die
		redaktionellen <code>content.json</code>-Felder der Komponenten; Modell, Maße und Tokens
		kommen aus Figma und sind bewusst nicht editierbar.
	</p>

	<nav class="sections" aria-label="Bereiche">
		<a class="section" href="/admin/media">
			<span class="section-name">Medien</span>
			<span class="section-desc">Bilder hochladen &amp; verwalten</span>
		</a>
		<a class="section" href="/admin/brand">
			<span class="section-name">Brand-Seiten</span>
			<span class="section-desc">Prosa &amp; Frontmatter bearbeiten</span>
		</a>
	</nav>

	<h2 class="h2">Design-System-Inhalte</h2>
	<p class="hint">
		Struktur &amp; Reihenfolge = Live-Sidebar. Umsortieren passiert im Code
		(<code>navigation.ts</code> · <code>CATALOG_OVERRIDES</code>), nicht per Drag&nbsp;&amp;&nbsp;Drop.
	</p>

	<ul class="list">
		{#each data.productNav as item (item.title + (item.href ?? ''))}
			{#if item.isCategory}
				<li class="cat" aria-hidden="true">{item.title}</li>
			{:else}
				<li>
					<div class="row">
						<span class="name"
							>{item.title}{#if item.badge}<span class="badge">{item.badge}</span>{/if}</span
						>
						<span class="actions">
							{#if item.editHref}
								<a class="act act--edit" href={item.editHref}>Bearbeiten</a>
							{:else}
								<span class="code-note" title="Diese Seite lebt im Code, nicht im CMS."
									>Code-Seite</span
								>
							{/if}
							{#if item.href}
								<a class="act" href={item.href} title="Live-Seite ansehen">Ansehen&nbsp;↗</a>
							{/if}
						</span>
					</div>
				</li>
			{/if}
		{/each}
	</ul>
</div>

<style>
	.admin {
		max-width: 52rem;
		margin: 0 auto;
		padding: var(--z-ds-space-xl) var(--z-ds-space-l);
	}
	.lead {
		color: var(--ds-text-muted);
		margin-bottom: var(--z-ds-space-l);
	}
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
		border: 1px solid var(--ds-border);
		border-radius: var(--ds-radius);
		background: var(--ds-surface);
		text-decoration: none;
		color: var(--ds-text);
		transition:
			border-color var(--ds-dur) var(--ds-ease-out),
			background var(--ds-dur) var(--ds-ease-out);
	}
	@media (hover: hover) {
		.section:hover {
			border-color: var(--ds-border-strong);
			background: var(--ds-surface-raised);
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
	.h2 {
		font-size: var(--ds-text-base);
		margin: 0 0 var(--z-ds-space-xs);
	}
	.hint {
		font-size: var(--ds-text-xs);
		color: var(--ds-text-muted);
		margin: 0 0 var(--z-ds-space-s);
	}
	.list {
		list-style: none;
		margin: 0;
		padding: 0;
		display: grid;
		gap: 1px;
		background: var(--ds-border-soft);
		border: 1px solid var(--ds-border-soft);
		border-radius: var(--ds-radius);
		overflow: hidden;
	}
	/* Kategorie-Zeile wie in der Sidebar: Label, kein Link. */
	.cat {
		background: var(--ds-surface-sunken, var(--ds-surface));
		padding: var(--z-ds-space-s) var(--z-ds-space-l) var(--z-ds-space-4);
		font-size: var(--ds-label-size, var(--ds-text-xs));
		text-transform: uppercase;
		letter-spacing: var(--ds-label-tracking);
		font-weight: 600;
		color: var(--ds-text-muted);
	}
	.row {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: var(--z-ds-space-m);
		padding: var(--z-ds-space-s) var(--z-ds-space-l);
		background: var(--ds-surface);
	}
	.name {
		font-weight: 500;
		display: inline-flex;
		align-items: center;
		gap: var(--z-ds-space-8);
	}
	.badge {
		font-size: var(--ds-text-xs);
		font-weight: 600;
		color: var(--ds-text-muted);
		background: var(--ds-surface-sunken, var(--ds-surface));
		border: 1px solid var(--ds-border-soft);
		border-radius: 999px;
		padding: 0 var(--z-ds-space-8);
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
	.code-note {
		font-size: var(--ds-text-xs);
		color: var(--ds-text-faint, var(--ds-text-muted));
		font-style: italic;
	}
</style>
