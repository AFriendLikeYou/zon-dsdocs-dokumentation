<!--
  AdminPageHeader — einheitliche Kopfzone aller CMS-Übersichts-/Landing-Seiten
  (/admin, /admin/brand, /admin/media). Struktur: optionaler Zurück-Krümel, dann
  eine Kopf-Zeile aus H1 (links) + Aktions-Slot (rechts), darunter die gemuteten
  Beschreibungstexte (children). Orientiert an der Ästhetik der Editor-Seiten:
  ruhige Fläche, serifige H1, muted Prosa, rechts bündige Aktionen.

  Props:
  - title:   H1-Text.
  - crumb?:  { href, label } → „← …"-Zurücklink über der Überschrift.
  - actions? Snippet rechts neben der H1 (z. B. „+ Neue Seite"-Button).
  - children Snippet mit der Beschreibung (beliebiges HTML, wird gemutet gesetzt).
-->
<script lang="ts">
	import type { Snippet } from 'svelte';

	let {
		title,
		crumb,
		actions,
		children
	}: {
		title: string;
		crumb?: { href: string; label: string };
		actions?: Snippet;
		children?: Snippet;
	} = $props();
</script>

<header class="head">
	{#if crumb}
		<nav class="crumb"><a href={crumb.href}>← {crumb.label}</a></nav>
	{/if}
	<div class="head-row">
		<h1>{title}</h1>
		{#if actions}
			<div class="actions">{@render actions()}</div>
		{/if}
	</div>
	{#if children}
		<div class="lead">{@render children()}</div>
	{/if}
</header>

<style>
	.head {
		margin-bottom: var(--z-ds-space-l);
	}
	.crumb {
		margin-bottom: var(--z-ds-space-m);
	}
	.crumb a {
		color: var(--ds-text-muted);
		text-decoration: none;
		font-size: var(--ds-text-sm);
		transition: color var(--ds-dur) var(--ds-ease-out);
	}
	.crumb a:hover {
		color: var(--ds-text);
	}
	.crumb a:focus-visible {
		outline: 2px solid var(--ds-focus-ring);
		outline-offset: 2px;
	}
	.head-row {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: var(--z-ds-space-m);
		flex-wrap: wrap;
	}
	h1 {
		margin: 0;
	}
	.actions {
		display: inline-flex;
		align-items: center;
		gap: var(--z-ds-space-s);
		flex: none;
	}
	/* Beschreibung: gemutet, ruhige Zeilenhöhe, angenehm schmale Textspalte. */
	.lead {
		color: var(--ds-text-muted);
		max-width: 46rem;
		line-height: 1.5;
		margin-top: var(--z-ds-space-m);
	}
	/* :global, weil die Beschreibung als children-Snippet von der Seite kommt und
	   deren <code>/<strong> sonst nicht vom Scope dieser Komponente erreicht wird. */
	.lead :global(code) {
		font-family: var(--z-ds-font-mono, monospace);
		font-size: 0.9em;
		background: var(--ds-surface-raised);
		border-radius: var(--ds-radius-xs);
		padding: 0.1em 0.35em;
	}
</style>
