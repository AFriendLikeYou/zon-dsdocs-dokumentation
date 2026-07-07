<!--
  SectionNav.svelte — dezente In-Page-Sprungleiste für lange Component-Seiten.
  Horizontale, scrollbare Chip-Reihe; Klick scrollt smooth zum Anker-Abschnitt.
  Die Anker-Ziele (Playground-Wrapper + <h2>s) tragen die Klasse `section-anchor`
  und bekommen hier zentral ihren scroll-margin-top (Sticky-Tabs-Offset), damit
  sie beim Sprung nicht unter der klebenden Tab-Leiste verschwinden.

  Nur Rollen-Token; Label-Optik wie pg-label. Erwartet items als [{ label, href }].
-->
<script lang="ts">
	type Item = { label: string; href: string };
	let { items = [] }: { items?: Item[] } = $props();

	// Smooth-Scroll selbst steuern (statt reinem #hash-Sprung), damit wir
	// prefers-reduced-motion respektieren und nicht in die URL-History schreiben.
	function jump(event: MouseEvent, href: string) {
		const id = href.replace(/^#/, '');
		const target = document.getElementById(id);
		if (!target) return; // Kein Ziel → nativer Anker-Fallback greift.
		event.preventDefault();
		const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
		target.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' });
	}
</script>

{#if items.length}
	<nav class="section-nav" aria-label="Abschnitte auf dieser Seite">
		<span class="section-nav__label">Auf dieser Seite</span>
		<div class="section-nav__chips">
			{#each items as item (item.href)}
				<a class="section-nav__chip" href={item.href} onclick={(e) => jump(e, item.href)}>
					{item.label}
				</a>
			{/each}
		</div>
	</nav>
{/if}

<style>
	.section-nav {
		display: flex;
		align-items: center;
		gap: var(--z-ds-space-12);
		margin-block: var(--z-ds-space-16) var(--z-ds-space-24);
		padding-block: var(--z-ds-space-4);
	}
	.section-nav__label {
		flex: none;
		font-size: var(--ds-label-size);
		text-transform: uppercase;
		letter-spacing: var(--ds-label-tracking);
		font-weight: 600;
		color: var(--ds-text-muted);
	}
	.section-nav__chips {
		display: flex;
		gap: var(--z-ds-space-6);
		/* Column-Flex mit align-items:flex-start: das Kind nimmt sonst Content-
		   Breite an und überläuft den Viewport — erst die Kappung auf 100 %
		   aktiviert das eigene overflow-x-Scrolling. */
		min-width: 0;
		max-width: 100%;
		overflow-x: auto;
		scrollbar-width: none;
		-webkit-overflow-scrolling: touch;
		padding-block: 2px; /* Platz für den Fokus-Ring beim horizontalen Scrollen */
	}
	.section-nav__chips::-webkit-scrollbar {
		display: none;
	}
	.section-nav__chip {
		flex: none;
		white-space: nowrap;
		font-size: var(--ds-text-sm);
		color: var(--ds-text-body);
		text-decoration: none;
		padding: var(--z-ds-space-4) var(--z-ds-space-10);
		border-radius: 999px;
		border: 1px solid var(--ds-border-soft);
		background: var(--ds-surface-raised);
		transition:
			color var(--ds-dur) var(--ds-ease),
			border-color var(--ds-dur) var(--ds-ease),
			transform var(--ds-dur) var(--ds-ease-out);
	}
	@media (hover: hover) and (pointer: fine) {
		.section-nav__chip:hover {
			color: var(--ds-text);
			border-color: var(--ds-border);
		}
	}
	.section-nav__chip:active {
		transform: scale(0.97);
	}
	.section-nav__chip:focus-visible {
		outline: 2px solid var(--ds-focus-ring);
		outline-offset: 2px;
	}

	/* Anker-Ziele: unter die sticky Tab-Leiste (header-height + Tab-Höhe) einrücken,
	   damit die Überschrift beim Sprung sichtbar bleibt. Global, weil die Ziele
	   außerhalb dieser Komponente in der Seite liegen. */
	:global(.section-anchor) {
		scroll-margin-top: calc(var(--header-height, 64px) + 56px);
	}
	@media (prefers-reduced-motion: reduce) {
		.section-nav__chip {
			transition: none;
		}
	}
	@media (max-width: 640px) {
		.section-nav {
			flex-direction: column;
			align-items: flex-start;
			gap: var(--z-ds-space-6);
		}
	}
</style>
