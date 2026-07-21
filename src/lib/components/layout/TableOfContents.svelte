<!-- TableOfContents.svelte — „Auf dieser Seite"-Verzeichnis aus den h2-Überschriften des Hauptinhalts mit Scroll-Spy; vom Root-Layout (+layout.svelte) eingehängt. -->
<script lang="ts">
	import { afterNavigate } from '$app/navigation';
	import { onMount } from 'svelte';
	import { browser } from '$app/environment';
	import { debounce, slugify } from '$lib/utils';

	// Component-Seiten haben nur h2-Sektionen → wir sammeln bewusst nur h2
	// (kein level-Feld mehr, keine h3-Verschachtelung).
	let headings: { id: string; text: string }[] = $state([]);
	let activeId = $state('');

	let intersectionObserver: IntersectionObserver | null = null;

	// Sammelt die Content-Überschriften neu, weist fehlende IDs zu und verdrahtet
	// den IntersectionObserver. Nur #main-content — Footer-/Navigations-h2s
	// (GRUNDLAGEN, COMPONENTS, …) gehören nicht ins Seiten-Inhaltsverzeichnis.
	function rebuild() {
		intersectionObserver?.disconnect();

		// Überschriften INNERHALB eines Specimens sind Demo-Inhalt, keine
		// Seitengliederung: Teaser-Markup nutzt echte <h2>/<h3>, und die landeten
		// dadurch als Einträge im Verzeichnis („KI und Kinder »KI ist mächtig wie
		// eine Motorsäge«" auf der Katalogseite). Schlimmer noch: Zeile darunter
		// schrieb ihnen eine `id` ins Markup — die Doku veränderte also das
		// Specimen, das sie dokumentiert. Bühnen und Katalog-Vorschauen deshalb
		// ausschliessen (Doku-App-UI ≠ dokumentiertes ZEIT-DS).
		const SPECIMEN = '.ds-stage, .spec-canvas, .catalog-preview';
		const elements = Array.from(
			document.querySelectorAll('#main-content h2') as NodeListOf<HTMLElement>
		).filter((heading) => !heading.closest(SPECIMEN));

		headings = elements.map((heading) => {
			// Fallback-ID dem Element ZUWEISEN, bevor beobachtet/verlinkt wird —
			// sonst zeigt der Anker ins Leere und der Observer findet nichts.
			const id = heading.id || slugify(heading.innerText);
			heading.id = id;
			return { id, text: heading.innerText };
		});

		intersectionObserver = new IntersectionObserver(
			(entries) => {
				const visibleHeading = entries.find((entry) => entry.isIntersecting);
				if (visibleHeading) activeId = visibleHeading.target.id;
			},
			{ rootMargin: '0px 0px -35% 0px' }
		);

		for (const heading of elements) intersectionObserver.observe(heading);
	}

	onMount(() => {
		rebuild();

		// Tab-Wechsel auf Component-Seiten (Design → Develop) tauschen den Inhalt
		// aus, OHNE Navigation — afterNavigate allein greift dafür nicht. Ein
		// debounced MutationObserver fängt das ab. Beobachtet wird document.body
		// (immer vorhanden — #main-content existiert zum onMount-Zeitpunkt evtl.
		// noch nicht zuverlässig), der Rebuild filtert selbst auf #main-content.
		const contentObserver = new MutationObserver(debounce(rebuild, 100));
		contentObserver.observe(document.body, { childList: true, subtree: true });

		return () => {
			contentObserver.disconnect();
			intersectionObserver?.disconnect();
		};
	});

	// SPA-Navigation: nach jedem Seitenwechsel zusätzlich sofort neu aufbauen
	// (Muster wie GitHubEdit/BreadCrumbs) — deckt den Fall ab, dass der Observer
	// den Austausch verpasst.
	afterNavigate(() => {
		rebuild();
		istAngeheftet = false;
	});

	// ── Kompakt-Zustand ────────────────────────────────────────────────────────
	// Am Seitenanfang steht die volle Liste. Sobald gescrollt wird, schrumpft das
	// Verzeichnis auf EINE Zeile (Icon · aktueller Abschnitt · Zähler) plus
	// Fortschrittsbalken und gibt den Blick auf den Text frei. Hover, Fokus oder
	// ein Tipp auf die Zeile holen die volle Liste zurück.
	let scrollY = $state(0);
	let innerHeight = $state(0);
	/** Per Klick/Tipp dauerhaft aufgeklappt (Touch kennt kein Hover). */
	let istAngeheftet = $state(false);

	/** Ab hier gilt „der Nutzer liest" — knapp unter einer Kopfzeilenhöhe. */
	const KOMPAKT_AB_PX = 80;

	/** Gescrollt → Kompaktzeile samt Schalter existiert (unabhängig vom Aufklappen:
	 *  der Schalter darf beim Betätigen nicht aus dem DOM fallen, sonst verliert die
	 *  Tastatur den Fokus). */
	const istGescrollt = $derived(scrollY > KOMPAKT_AB_PX);
	const istKompakt = $derived(istGescrollt && !istAngeheftet);

	const aktiverIndex = $derived(Math.max(0, headings.findIndex(({ id }) => id === activeId)));
	const aktiverTitel = $derived(headings[aktiverIndex]?.text ?? 'Auf dieser Seite');

	/** Lesefortschritt 0…1 — Anteil des bereits gescrollten Dokuments. */
	const fortschritt = $derived.by(() => {
		if (!browser) return 0;
		// scrollY/innerHeight sind reaktiv; scrollHeight wird bei jeder Änderung
		// frisch gelesen (wächst z. B. beim Tab-Wechsel).
		const scrollbar = document.documentElement.scrollHeight - innerHeight;
		if (scrollbar <= 0) return 0;
		return Math.min(1, Math.max(0, scrollY / scrollbar));
	});
</script>

<svelte:window bind:scrollY bind:innerHeight />

{#if headings.length > 0}
	<aside class="table-of-contents">
		<div class="table-of-contents__rail" class:table-of-contents__rail--compact={istKompakt}>
			{#if istGescrollt}
				<!-- Kompaktzeile: gleichzeitig Schalter, damit das Verzeichnis auch ohne
				     Hover (Touch) und per Tastatur bewusst geöffnet werden kann. Sie
				     bleibt in BEIDEN Zuständen gemountet — sonst verlöre der Klick den
				     Tastaturfokus. -->
				<button
					type="button"
					class="table-of-contents__summary"
					aria-expanded={istAngeheftet}
					aria-controls="table-of-contents-navigation"
					aria-label="Inhaltsverzeichnis {istAngeheftet
						? 'zuklappen'
						: 'aufklappen'} — Abschnitt {aktiverIndex + 1} von {headings.length}: {aktiverTitel}"
					onclick={() => (istAngeheftet = !istAngeheftet)}
				>
					<svg
						class="table-of-contents__icon"
						aria-hidden="true"
						focusable="false"
						width="16"
						height="16"
						viewBox="0 0 16 16"
						fill="none"
						xmlns="http://www.w3.org/2000/svg"
					>
						<path
							d="M2 4h12M2 8h12M2 12h8"
							stroke="currentColor"
							stroke-width="1.5"
							stroke-linecap="round"
						/>
					</svg>
					<span class="table-of-contents__current">{aktiverTitel}</span>
					<span class="table-of-contents__counter">{aktiverIndex + 1}/{headings.length}</span>
				</button>

				<div class="table-of-contents__progress" aria-hidden="true">
					<div
						class="table-of-contents__progress-bar"
						style:transform="scaleX({fortschritt})"
					></div>
				</div>
			{:else}
				<span class="table-of-contents__label">Auf dieser Seite</span>
			{/if}

			<nav
				id="table-of-contents-navigation"
				class="table-of-contents__navigation"
				aria-label="Auf dieser Seite"
			>
				<ul class="table-of-contents__list">
					{#each headings as { id, text } (id)}
						<li>
							<a
								href="#{id}"
								class="table-of-contents__link"
								class:table-of-contents__link--active={activeId === id}
								aria-current={activeId === id ? 'true' : undefined}
								onclick={() => (istAngeheftet = false)}
							>
								{text}
							</a>
						</li>
					{/each}
				</ul>
			</nav>
		</div>
	</aside>
{/if}

<style>
	/* Die Schiene liegt AUSSERHALB des Flusses (ihren Platz reserviert `.layout`
	   per padding-right, siehe +layout.svelte). Nur so kann sie auf- und zuklappen,
	   ohne den Inhalt zu bewegen. Der Rahmen ist absolut über die volle Höhe der
	   Spalte gespannt, angeheftet wird das Innere per sticky. */
	.table-of-contents {
		position: absolute;
		inset-block: 0;
		right: 0;
		width: var(--ds-layout-rail);
		/* Der leere Teil der Schiene darf keine Zeiger abfangen … */
		pointer-events: none;
	}

	.table-of-contents__rail {
		position: sticky;
		top: var(--header-height);
		max-height: calc(100vh - var(--header-height));
		overflow-y: auto;
		/* Abgrenzung über Weißraum statt Linie (Minimalismus-Pass). */
		padding: var(--z-ds-space-xs);
		padding-left: var(--z-ds-space-24);
		/* … nur die tatsächliche Karte ist bedienbar (Hover-Ziel = diese Fläche). */
		pointer-events: auto;
	}

	.table-of-contents__label {
		font-size: var(--ds-label-size);
		font-weight: 600;
		text-transform: uppercase;
		letter-spacing: var(--ds-label-tracking);
		color: var(--ds-text-muted);
		padding: 6px 12px;
		display: block;
	}

	/* ── Kompaktzeile ─────────────────────────────────────────────────────────── */
	.table-of-contents__summary {
		display: flex;
		align-items: center;
		gap: var(--z-ds-space-xxs);
		width: 100%;
		padding: 5px 12px;
		border: 0;
		border-radius: var(--ds-radius);
		background: transparent;
		color: var(--ds-text-muted);
		font: inherit;
		font-size: var(--ds-text-sm);
		text-align: left;
		cursor: pointer;
		transition:
			background-color var(--ds-dur) var(--ds-ease),
			color var(--ds-dur) var(--ds-ease);
	}

	.table-of-contents__icon {
		flex: none;
	}

	.table-of-contents__current {
		flex: 1;
		min-width: 0;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
		color: var(--ds-text);
		font-weight: 500;
	}

	.table-of-contents__counter {
		flex: none;
		font-variant-numeric: tabular-nums;
		font-size: var(--ds-text-xs);
	}

	@media (hover: hover) and (pointer: fine) {
		.table-of-contents__summary:hover {
			background-color: var(--ds-surface-raised);
			color: var(--ds-text);
		}
	}

	.table-of-contents__summary:active {
		transform: scale(0.99);
	}

	.table-of-contents__summary:focus-visible {
		outline: 2px solid var(--ds-focus-ring);
		outline-offset: 1px;
	}

	/* Fortschrittsbalken — rein dekorativ (die Zahl im Zähler trägt die Aussage). */
	.table-of-contents__progress {
		height: 2px;
		margin: var(--z-ds-space-4) 12px 0;
		border-radius: var(--ds-radius-sm);
		background-color: var(--ds-surface-sunken);
		overflow: hidden;
	}

	.table-of-contents__progress-bar {
		height: 100%;
		background-color: var(--ds-text-muted);
		transform-origin: left center;
		transition: transform var(--ds-dur) var(--ds-ease-out);
	}

	/* ── Liste ────────────────────────────────────────────────────────────────
	   Zusammenklappen über `grid-template-rows: 1fr → 0fr`: die Links bleiben im
	   DOM und FOKUSSIERBAR (kein display:none) — Tab hinein klappt über
	   :focus-within sofort wieder auf. */
	.table-of-contents__navigation {
		display: grid;
		grid-template-rows: 1fr;
		transition:
			grid-template-rows var(--ds-dur-slow) var(--ds-ease-out),
			opacity var(--ds-dur-slow) var(--ds-ease-out);
	}

	.table-of-contents__list {
		list-style-type: none;
		padding: 0;
		margin: 0;
		min-height: 0;
		overflow: hidden;
	}

	.table-of-contents__list li {
		margin: 0;
		padding: 0;
	}

	.table-of-contents__rail--compact .table-of-contents__navigation {
		grid-template-rows: 0fr;
		opacity: 0;
	}

	/* Zurück zur vollen Liste — per Hover (nur echte Zeiger) oder Fokus. */
	@media (hover: hover) and (pointer: fine) {
		.table-of-contents__rail--compact:hover .table-of-contents__navigation {
			grid-template-rows: 1fr;
			opacity: 1;
		}
	}

	.table-of-contents__rail--compact:focus-within .table-of-contents__navigation {
		grid-template-rows: 1fr;
		opacity: 1;
	}

	.table-of-contents__link {
		display: block;
		padding: 5px 12px;
		margin-bottom: 2px;
		border-radius: var(--ds-radius);
		text-decoration: none;
		color: var(--ds-text-muted);
		font-size: var(--ds-text-sm);
		transition:
			background-color var(--ds-dur) var(--ds-ease),
			color var(--ds-dur) var(--ds-ease);
	}

	@media (hover: hover) and (pointer: fine) {
		.table-of-contents__link:hover {
			background-color: var(--ds-surface-raised);
			color: var(--ds-text);
		}
	}

	/* Aktiv = Pill + kräftige Schrift, ohne Linien-Indikator (Minimalismus-Pass). */
	.table-of-contents__link--active {
		background-color: var(--ds-surface-raised);
		color: var(--ds-text);
		font-weight: 500;
	}

	.table-of-contents__link:focus-visible {
		outline: 2px solid var(--ds-focus-ring);
		outline-offset: 1px;
	}

	/* Bewegungsarm: kein Auf-/Zufahren, nur harte Zustände (und keine Balken-
	   Animation). Die Liste bleibt sichtbar — Zusammenklappen entfällt. */
	@media (prefers-reduced-motion: reduce) {
		.table-of-contents__navigation,
		.table-of-contents__progress-bar,
		.table-of-contents__summary,
		.table-of-contents__link {
			transition: none;
		}

		.table-of-contents__rail--compact .table-of-contents__navigation {
			grid-template-rows: 1fr;
			opacity: 1;
		}
	}

	/* Unter 1280px gibt es keine rechte Schiene (siehe +layout.svelte). */
	@media (max-width: 1279px) {
		.table-of-contents {
			display: none;
		}
	}
</style>
