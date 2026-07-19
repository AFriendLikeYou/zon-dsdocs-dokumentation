<!--
  AnchorBar — schmale Sprungleiste unter dem Editor-Kopf: je Cluster ein Link, Klick
  scrollt smooth zum Ziel-Anker. Bei `prefers-reduced-motion` wird der Sprung hart
  (kein Smooth-Scroll). Die scroll-margin liegt bewusst an den ZIELEN
  (Cluster-Eyebrows / erste Karte), nicht hier — so bleibt der Offset am Anker.

  Scrollspy: ein IntersectionObserver markiert den Cluster, dessen Kopf gerade oben
  im Viewport steht (dezenter aktiver Zustand — Pill + kräftige Textfarbe, an die
  öffentliche TableOfContents angelehnt). Nur Farbe/Fläche wechseln → für
  `prefers-reduced-motion` bleibt es ruhig (keine Bewegung). Der Observer wird beim
  Zerstören sauber getrennt.

  Props:
  - items: Sprungziele — je { id (DOM-id des Ankers) · label (Anzeigetext) }.
-->
<script lang="ts">
	import { onMount } from 'svelte';

	let { items }: { items: { id: string; label: string }[] } = $props();

	let activeId = $state('');

	function jumpTo(e: MouseEvent, id: string) {
		e.preventDefault();
		const el = document.getElementById(id);
		if (!el) return;
		const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
		el.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' });
		// Klick setzt den aktiven Zustand sofort (der Observer zieht beim Scrollen nach).
		activeId = id;
	}

	onMount(() => {
		const els = items
			.map((a) => document.getElementById(a.id))
			.filter((el): el is HTMLElement => el !== null);
		if (!els.length) return;

		// Aktiv = der Cluster-Kopf, der die obere Viewport-Zone erreicht hat. rootMargin
		// wie bei der öffentlichen TOC: unteres Drittel „abgeschnitten", damit der jeweils
		// oberste sichtbare Kopf gewinnt.
		const observer = new IntersectionObserver(
			(entries) => {
				const visible = entries.find((entry) => entry.isIntersecting);
				if (visible) activeId = visible.target.id;
			},
			{ rootMargin: '0px 0px -66% 0px' }
		);
		for (const el of els) observer.observe(el);
		return () => observer.disconnect();
	});
</script>

<nav class="anchor-bar" aria-label="Zu Abschnitt springen">
	{#each items as a (a.id)}
		<a
			class="anchor-bar__link"
			class:is-active={activeId === a.id}
			href={`#${a.id}`}
			aria-current={activeId === a.id ? 'true' : undefined}
			onclick={(e) => jumpTo(e, a.id)}>{a.label}</a
		>
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
	/* Aktiver Cluster (Scrollspy): dezente Pill + kräftige Textfarbe, wie die TOC. */
	.anchor-bar__link.is-active {
		color: var(--ds-text);
		font-weight: 600;
		background: var(--ds-surface-raised);
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
