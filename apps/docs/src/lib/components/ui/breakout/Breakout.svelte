<!--
  Breakout.svelte — lässt einen Block BREITER werden als die 52rem-Lesespalte
  (`--ds-content-width` auf `<main>`). Bis hierher konnte nichts aus dem Textrahmen
  ausbrechen; dieser Container ist der einzige dafür vorgesehene Weg.

  Nutzung (auch als CMS-Container „Breakout", siehe cms-components.ts):
    <Breakout width="wide">
      <Image src="…" alt="…" />
    </Breakout>

  ── Technik: symmetrische negative Aussenabstände ──────────────────────────
  `margin-inline: calc((var(--ds-content-width) − ZIEL) / 2)` — bei einem Ziel
  breiter als die Lesespalte wird der Wert negativ und der Block wächst nach BEIDEN
  Seiten gleich weit heraus. Bewusst NICHT genutzt:
    • `100vw` — schliesst die klassische Scrollbar mit ein und erzeugt dadurch
      zuverlässig horizontales Überlaufen.
    • `left: 50%` + `transform` — macht das Element zum Containing Block und bricht
      damit `position: fixed`-Kinder.
  Media Queries messen dagegen den ICB OHNE Scrollbar — dieselbe Größe, aus der sich
  auch die Inhaltsspalte ergibt. Genau deshalb sind sie hier das scrollbar-sichere
  Mittel und der Ausbruch hängt an ihnen.

  ── Woher die Schaltpunkte kommen (gemessen, nicht geraten) ────────────────
  Neben `main` stehen ab 1280px zwei gleich breite Schienen: Sidebar (300px) und
  „Auf dieser Seite" (300px). Beide reservieren ihre Breite unabhängig vom
  Einklapp-Zustand, `main` ist dazwischen VIEWPORT-zentriert (+layout.svelte) —
  die Inhaltsspalte ist also unverändert `Viewport − 600px`.

  `main` ist auf `--ds-content-width` (52rem/832px, border-box) gedeckelt und trägt
  je Seite `--z-ds-space-l` (24px) Innenabstand → Textspalte 784px.
  Die gerenderte Ausbruchsbreite ist `(W − 48) − 2·(W − T)/2 = T − 48` und damit
  UNABHÄNGIG von W: die 56 → 52rem-Umstellung ändert an der Optik der Stufen nichts
  (nur der negative Rand wächst um 32px je Seite). Gemessen bei 1640px: 976px = 1024 − 48.

  Weil der Ausbruch mit `main` viewport-zentriert ist, bleibt je Seite
  `(Viewport − (T − 48))/2 − 300px` frei. Damit das mindestens dem Innenabstand von
  `main` (24px) entspricht, muss gelten **`Viewport ≥ T + 600px`**:
    • wide (64rem/1024px) → Viewport ≥ 1624px → Schaltpunkt 1640px (gemessen: 32px frei)
    • full (76rem/1216px) → Viewport ≥ 1816px → Schaltpunkt 1840px (gemessen: 36px frei)
  Beide Schaltpunkte liegen über 1432px (= 52rem + 600px); dort ist `main` sicher auf
  seinen Deckel ausgewachsen, die Rechnung mit W = 52rem gilt also.
  Unterhalb des jeweiligen Schaltpunkts fällt die Stufe sauber zurück (`full` erst
  auf `wide`, dann auf Inhaltsbreite) — es entsteht zu KEINER Breite horizontaler
  Scroll. Das ist der Preis der 600px Chrome: auf Laptop-Breiten bleibt der Block
  bewusst auf Inhaltsbreite, statt die Seite zu sprengen.
-->
<script lang="ts">
	interface Props {
		/**
		 * Ausbruchs-Stufe:
		 * - `content` (Default) = kein Ausbruch, exakt die Lesespalte.
		 * - `wide` = eine Stufe breiter (`--ds-breakout-wide`).
		 * - `full` = die breiteste Stufe (`--ds-breakout-full`).
		 * Freie CSS-Längen gibt es bewusst nicht — nur diese drei Stufen.
		 */
		width?: 'content' | 'wide' | 'full';
		/** Inhalt des Ausbruchs (kachelbare Bausteine oder ein `Grid`). */
		children?: import('svelte').Snippet;
	}

	let { width = 'content', children }: Props = $props();

	// Unbekannte Werte (z. B. aus altem Markup) fallen auf die Lesespalte zurück,
	// statt eine undefinierte Klasse zu setzen.
	const STUFEN = ['content', 'wide', 'full'] as const;
	let stufe = $derived(STUFEN.includes(width) ? width : 'content');
</script>

{#if children}
	<div class="breakout breakout--{stufe}" data-breakout={stufe}>
		{@render children()}
	</div>
{/if}

<style>
	.breakout {
		/* Default = Lesespalte: kein Ausbruch, kein Sonderfall. */
		margin-inline: 0;
	}

	/* `wide` — und `full` als Zwischenstufe, solange für `full` noch kein Platz ist. */
	@media (min-width: 1640px) {
		.breakout--wide,
		.breakout--full {
			margin-inline: calc((var(--ds-content-width) - var(--ds-breakout-wide)) / 2);
		}
	}

	@media (min-width: 1840px) {
		.breakout--full {
			margin-inline: calc((var(--ds-content-width) - var(--ds-breakout-full)) / 2);
		}
	}

	/* Die Landing (`main[data-area='root']`) hebt den 52rem-Deckel auf und ist bereits
	   vollflächig — dort würde derselbe negative Rand die Seite nach BEIDEN Seiten
	   überlaufen lassen. Ausbruch dort also aus (die Rechnung oben gilt nur für die
	   gedeckelte Lesespalte). */
	:global(main[data-area='root']) .breakout {
		margin-inline: 0;
	}
</style>
