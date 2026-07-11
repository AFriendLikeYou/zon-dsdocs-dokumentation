<script lang="ts">
	let { data }: import('./$types').PageProps = $props();
</script>

<svelte:head><title>Inhalte bearbeiten – Admin</title></svelte:head>

<div class="admin">
	<h1>Inhalte bearbeiten</h1>
	<p class="lead">
		Redaktionelle Texte der Komponenten-Doku (die <code>content.json</code>-Felder). Modell,
		Maße und Tokens kommen aus Figma und sind hier bewusst nicht editierbar.
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

	<h2 class="h2">Komponenten</h2>
	<ul class="list">
		{#each data.components as c (c.slug)}
			<li>
				<a href="/admin/{c.slug}">
					<span class="name">{c.name}</span>
					{#if c.kategorie}<span class="kat">{c.kategorie}</span>{/if}
				</a>
			</li>
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
	.list a {
		display: flex;
		align-items: baseline;
		justify-content: space-between;
		gap: var(--z-ds-space-m);
		padding: var(--z-ds-space-m) var(--z-ds-space-l);
		background: var(--ds-surface);
		text-decoration: none;
		color: var(--ds-text);
		transition: background var(--ds-dur) var(--ds-ease-out);
	}
	@media (hover: hover) {
		.list a:hover {
			background: var(--ds-surface-raised);
		}
	}
	.list a:focus-visible {
		outline: 2px solid var(--ds-focus-ring);
		outline-offset: -2px;
	}
	.name {
		font-weight: 600;
	}
	.kat {
		font-size: var(--ds-text-sm);
		color: var(--ds-text-muted);
	}
</style>
