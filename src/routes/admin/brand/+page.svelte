<script lang="ts">
	let { data } = $props();
</script>

<svelte:head><title>Brand-Seiten bearbeiten – Admin</title></svelte:head>

<div class="admin">
	<nav class="crumb"><a href="/admin">← Admin</a></nav>
	<h1>Brand-Seiten bearbeiten</h1>
	<p class="lead">
		Redaktionelle Prosa der Brand-Seiten. Editierbar sind <strong>Frontmatter-Felder</strong>
		(v. a. der Titel) und <strong>reine Markdown-Prosa</strong>. Svelte-Inseln
		(<code>&lt;script&gt;</code>, Komponenten-Tags, <code>&lt;style&gt;</code>) bleiben
		geschützt und werden im Editor nur zum Kontext angezeigt.
	</p>

	{#if !data.writable}
		<p class="flash flash--warn">
			Nur-Lese-Vorschau: Schreiben ist im Prod-Modus deaktiviert (Phase 2b: GitHub-PR).
		</p>
	{/if}

	<ul class="list">
		{#each data.pages as p (p.url)}
			<li>
				{#if p.editable}
					<a href="/admin/brand/{p.path}">
						<span class="name">{p.title}</span>
						<span class="meta">
							<span class="path">{p.url}</span>
							<span class="badge badge--ok">{p.note}</span>
						</span>
					</a>
				{:else}
					<div class="row row--locked">
						<span class="name">{p.title}</span>
						<span class="meta">
							<span class="path">{p.url}</span>
							<span class="badge">{p.note}</span>
						</span>
					</div>
				{/if}
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
	.crumb {
		margin-bottom: var(--z-ds-space-m);
	}
	.crumb a {
		color: var(--ds-text-muted);
		text-decoration: none;
		font-size: var(--ds-text-sm);
	}
	.lead {
		color: var(--ds-text-muted);
		margin-bottom: var(--z-ds-space-l);
	}
	.flash {
		padding: var(--z-ds-space-s) var(--z-ds-space-m);
		border-radius: var(--ds-radius-sm);
		margin-bottom: var(--z-ds-space-l);
		font-size: var(--ds-text-sm);
	}
	.flash--warn {
		background: rgb(from var(--ds-warning) r g b / 0.15);
		color: var(--ds-text);
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
	.list a,
	.row {
		display: flex;
		align-items: baseline;
		justify-content: space-between;
		gap: var(--z-ds-space-m);
		padding: var(--z-ds-space-m) var(--z-ds-space-l);
		background: var(--ds-surface);
		text-decoration: none;
		color: var(--ds-text);
	}
	.list a {
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
	.row--locked {
		opacity: 0.6;
	}
	.name {
		font-weight: 600;
	}
	.meta {
		display: flex;
		align-items: baseline;
		gap: var(--z-ds-space-m);
		flex-wrap: wrap;
		justify-content: flex-end;
	}
	.path {
		font-size: var(--ds-text-xs);
		color: var(--ds-text-muted);
		font-family: var(--z-ds-font-mono, monospace);
	}
	.badge {
		font-size: var(--ds-text-xs);
		color: var(--ds-text-muted);
		border: 1px solid var(--ds-border);
		border-radius: 999px;
		padding: 0 var(--z-ds-space-8);
		white-space: nowrap;
	}
	.badge--ok {
		color: var(--ds-text-body);
		border-color: var(--ds-border);
	}
</style>
