<script lang="ts">
	let { data } = $props();
</script>

<svelte:head><title>Inhalte bearbeiten – Admin</title></svelte:head>

<div class="admin">
	<h1>Inhalte bearbeiten</h1>
	<p class="lead">
		Redaktionelle Texte der Komponenten-Doku (die <code>content.json</code>-Felder). Modell,
		Maße und Tokens kommen aus Figma und sind hier bewusst nicht editierbar.
	</p>

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
		margin-bottom: var(--z-ds-space-xl);
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
