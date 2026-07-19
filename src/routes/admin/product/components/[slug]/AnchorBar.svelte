<!--
  AnchorBar — schmale Sprungleiste unter dem Editor-Kopf: je Cluster ein Link, Klick
  scrollt smooth zum Ziel-Anker. Bei `prefers-reduced-motion` wird der Sprung hart
  (kein Smooth-Scroll). Die scroll-margin liegt bewusst an den ZIELEN
  (Cluster-Eyebrows / erste Karte), nicht hier — so bleibt der Offset am Anker.

  Props:
  - items: Sprungziele — je { id (DOM-id des Ankers) · label (Anzeigetext) }.
-->
<script lang="ts">
	let { items }: { items: { id: string; label: string }[] } = $props();

	function jumpTo(e: MouseEvent, id: string) {
		e.preventDefault();
		const el = document.getElementById(id);
		if (!el) return;
		const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
		el.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' });
	}
</script>

<nav class="anchor-bar" aria-label="Zu Abschnitt springen">
	{#each items as a (a.id)}
		<a class="anchor-bar__link" href={`#${a.id}`} onclick={(e) => jumpTo(e, a.id)}>{a.label}</a>
	{/each}
</nav>

<style>
	/* ── Cluster-Ankerleiste: schmale Sprungzeile unter dem Kopf ── */
	.anchor-bar {
		display: flex;
		flex-wrap: wrap;
		gap: var(--z-ds-space-m);
		padding: var(--z-ds-space-6) var(--z-ds-space-l);
		border-bottom: 1px solid var(--ds-border);
		background: var(--ds-surface-soft);
	}
	.anchor-bar__link {
		font-size: var(--ds-text-xs);
		font-weight: 500;
		color: var(--ds-text-muted);
		text-decoration: none;
		border-radius: var(--ds-radius-sm);
		padding: 1px var(--z-ds-space-4);
		transition: color var(--ds-dur) var(--ds-ease-out);
	}
	.anchor-bar__link:hover {
		color: var(--ds-text);
	}
	.anchor-bar__link:focus-visible {
		outline: 2px solid var(--ds-focus-ring);
		outline-offset: 2px;
	}
	@media (prefers-reduced-motion: reduce) {
		.anchor-bar__link {
			transition: none;
		}
	}
</style>
