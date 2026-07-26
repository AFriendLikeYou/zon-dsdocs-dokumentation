<!--
  Anatomy.svelte — Blueprint-Artboard mit Specimen, Callouts, Maßlinien, Legende.
  Helle, fixe Artboard-Fläche (Komponentenfarben sind fix). Legende adaptiv (z-ds).
  Slots: preview (Haupt-Specimen), variant (optionales zweites Specimen).

  Orchestrator: hält State (hover/pin, view, theme, Bühnenbreite) und die
  Live-Vermessung. Die reine Rechen-Logik liegt in ./anatomy-measure, die Legende
  in ./AnatomyLegend und die Abstände-Tabelle in ./AnatomySpacingTable (interne
  Nachbarn, nicht im Barrel exportiert).

  BÜHNENBREITE (align: 'fill'). Ein „fill"-Specimen hat keine eigene Breite, es
  nimmt die seines Containers (Definition in $lib/spec/buehne.ts). Die Bühne muss
  ihm die also GEBEN — sonst schrumpft es auf Inhaltsbreite, während die
  Container-Query weiter gegen die volle Bühne auswertet: Desktop-Regeln auf
  Mobil-Breite (das Karussell stand mit 221px da und schnitt „Slot 3" ab). Der
  Rahmen (.specimen) trägt deshalb die Breite UND ist der Query-Container, und
  eine Leiste (ui/viewport-select, dieselbe wie im Playground) stellt sie ein.

  UND DIE MASSE SCHALTEN MIT. Genau daran ist die Reparatur beim letzten Mal
  gescheitert: `masse.breite` ist bei einem fill-Pattern kein Merkmal des
  Elements, sondern die Breite des Rahmens, IN dem gemessen wurde (Carousel 375,
  Hero 1000, Teaser 892). Über die volle Bühne gespannt und mit „375" beschriftet
  wäre die Maßlinie eine neue Unstimmigkeit statt der alten. Deshalb wird jedes
  Kastenmaß vor dem Zeichnen NACHGEMESSEN — am SPECIMEN, nicht am Rahmen: Die
  Linie erscheint nur, wenn das Specimen dieses Maß gerade wirklich hat. Sonst
  steht unter der Bühne ein Satz statt einer Linie, und die Referenzbreite ist
  als eigene Stufe in der Leiste einstellbar, sodass sich der Wert nachsehen
  lässt. Lieber „für diese Breite nicht dokumentiert" als eine falsche Maßlinie.

  Dass am Specimen gemessen wird und nicht am Rahmen, ist der Unterschied
  zwischen „nie nachweisbar" und „an der richtigen Stelle sichtbar": Der
  Standard-Teaser bringt mit `max-width: 55.75rem` seine eigene Rinne mit und
  misst im 1280er Rahmen exakt die dokumentierten 892 px — bei „Desktop"
  erscheinen deshalb beide Linien (B 892, H 287) und der Hinweis entfällt.
-->
<script lang="ts">
	import type { Snippet } from 'svelte';
	import type { Masse, MasseValue, SpacingSpec, Callout, CalloutAnchor } from '$types/spec';
	import type { BuehnenAlign } from '$lib/spec';
	import { StageToggle } from '$components/ui/stage-toggle';
	import { SegmentedControl } from '$components/ui/segmented-control';
	import { ViewportSelect, viewportWidth, type ViewportPreset } from '$components/ui/viewport-select';
	import AnatomyLegend from './AnatomyLegend.svelte';
	import AnatomySpacingTable from './AnatomySpacingTable.svelte';
	import {
		apx as apxRaw,
		parsePad,
		splitLabel,
		num,
		reineZahl,
		checkDrift,
		computeGapStrips,
		paarZwischenraum,
		padStreifen,
		stufeFuer,
		TOL,
		type Rect,
		type Drift
	} from './anatomy-measure';

	let {
		masse = null,
		spacing = [],
		callouts = [],
		calloutAnchors = [],
		align = 'center',
		preview
	}: {
		/** Maße (Höhe/Breite/Padding/Radius) für Maßlinien und Drift-Check; null = keine Measurements-Sicht. */
		masse?: Masse | null;
		/** Abstände (Padding/Gap) für die Measurements-Sicht und die gekoppelten Streifen. */
		spacing?: SpacingSpec[];
		/** Nummerierte Bestandteil-Beschriftungen für die Bestandteile-Sicht. */
		callouts?: Callout[];
		/** Verankerung der Callouts am Specimen (Position bzw. selector für die Live-Vermessung). */
		calloutAnchors?: CalloutAnchor[];
		/**
		 * Wie die Bühne das Specimen hinstellt — ausgelegt aus `render.align` durch
		 * `buehnenAlign()` in $lib/spec, derselben Stelle, aus der Playground und
		 * Beispiel-Block ihre Bühne nehmen. `fill` schaltet Rahmenbreite,
		 * Breiten-Leiste und die Nachmessung der Kastenmaße frei.
		 */
		align?: BuehnenAlign;
		/** Haupt-Specimen, das auf der Bühne gerendert und vermessen wird. */
		preview?: Snippet;
	} = $props();

	// Aktiv-State für Zwei-Wege-Highlights (Legende ↔ Bühne, Tabelle ↔ Streifen).
	// Hover ist flüchtig, Pin (Tap/Klick oder Enter/Space) hält fest — damit
	// funktioniert das Muster auch auf Touch-Geräten und per Tastatur.
	// Keys: 'co-<nr>' (Bestandteil) · 'pad-v'/'pad-h' (Padding) · 'gap-<i>' (Gap).
	let hovered = $state<string | null>(null);
	let pinned = $state<string | null>(null);
	const activeKey = $derived(pinned ?? hovered);
	function press(key: string) {
		pinned = pinned === key ? null : key;
	}

	// Artboard-Hintergrund: startet hell (Blueprint-Konvention), manuell umschaltbar.
	// Die Bühne (.ds-stage) pinnt die z-ds-Token je Modus → Specimen + Blueprint-Farben
	// (Maßlinien, Raster) adaptieren automatisch.
	let themeMode = $state('light');
	const isDark = $derived(themeMode === 'dark');
	function setTheme(theme: 'light' | 'dark') {
		themeMode = theme;
	}

	// Artboard-Maße zeigen IMMER px (Blueprint-Konvention). apxRaw ist DOM-frei.
	const apx = (m?: MasseValue) => apxRaw(m);

	const cs = $derived(
		callouts.map((c, i) => {
			const nr = c.nr ?? i + 1;
			return {
				...c,
				nr,
				anchor: calloutAnchors.find((a) => a.nr === nr) ?? null,
				...splitLabel(c.text)
			};
		})
	);

	// Zwei Modi: „parts" = Bestandteile (Callouts + Legende, für Design/PM),
	// „measure" = Measurements (Maßlinien + Innenabstände als Blueprint, für Devs).
	// Der Umschalter erscheint nur, wenn BEIDE Sichten Inhalt haben — sonst zeigt
	// die Ansicht graceful das, was vorhanden ist (Rückwärtskompatibilität).
	let mode = $state<'parts' | 'measure'>('parts');
	const hasParts = $derived(cs.length > 0);
	const hasMeasure = $derived(!!masse || spacing.length > 0);
	const showModeToggle = $derived(hasParts && hasMeasure);
	const view = $derived(showModeToggle ? mode : hasParts ? 'parts' : 'measure');
	function switchView(v: 'parts' | 'measure') {
		mode = v;
		pinned = null; // Pins gehören zur jeweiligen Sicht
		hovered = null;
	}

	// ——— Bühnenbreite (nur bei align: 'fill') ———
	// Bei `center` bleibt alles wie bisher: Das Specimen bringt seine Breite mit,
	// die Bühne stellt es hin. Bei `fill` hat es keine — dann gibt der Rahmen sie
	// vor, und diese Leiste stellt sie ein.
	const istFill = $derived(align === 'fill');

	// Die im Modell dokumentierte Breite als ZUSÄTZLICHE Stufe. Ohne sie wäre der
	// Wert unerreichbar: Der Rahmen stünde nie genau auf ihm, die Maßlinie käme nie
	// — und ein Maß, das man nirgends nachsehen kann, ist so gut wie keins.
	const referenzPreset = $derived.by<ViewportPreset | null>(() => {
		const px = reineZahl(apxRaw(masse?.breite ?? undefined));
		return px == null
			? null
			: {
					value: 'referenz',
					label: String(px),
					width: px,
					title: `Referenzbreite des Modells — ${px} px`
				};
	});
	let viewport = $state('frei');
	const rahmenBreite = $derived(viewportWidth(viewport, referenzPreset));

	// ——— Live-Vermessung (Part-Outlines + Abstands-Streifen) ———
	// Anker mit `selector` und Abstands-Zeilen mit Anker (`selector` oder das Paar
	// `von`/`bis`) werden zur Laufzeit im Specimen gemessen (querySelector +
	// getBoundingClientRect relativ zum Slot). Kein Raten, keine handgepflegten
	// Prozentwerte — ResizeObserver hält die Overlays bei Reflows (Fonts, Fenster)
	// aktuell.
	let slotEl = $state<HTMLDivElement>();
	let rahmenEl = $state<HTMLDivElement>();
	let partRects = $state<Record<number, Rect>>({});
	// Streifen je Abstands-Zeile (Index in `spacing`). Ein leeres Array heißt
	// „Anker gefunden, aber kein Zwischenraum" — eine Aussage, kein Ausfall.
	let streifen = $state<Record<number, Rect[]>>({});

	// Die Ist-Box des SPECIMENS, relativ zum Rahmen. Zwei Aufgaben in einer
	// Messung: Sie ist der Bezugsrahmen der Kastenmaß-Overlays (Streifen,
	// Maßlinien, Radius-Fahne) UND der Prüfstein, gegen den `masse` antritt.
	// Rahmen und Specimen fallen bei `center` zusammen, bei `fill` nicht mehr:
	// Der Standard-Teaser bringt mit `max-width: 55.75rem` seine eigene Rinne mit
	// und misst im 1280er Rahmen 892 px. Eine Maßlinie über den RAHMEN behauptete
	// dort 1280 — und die 892 des Modells wären nirgends nachweisbar, obwohl sie
	// genau hier stimmen.
	let istBox = $state({ links: 0, oben: 0, breite: 0, hoehe: 0 });
	// Und die Breite des RAHMENS — das ist die eingestellte Bühnenbreite, die
	// Anzeige unten links. Sie ist bewusst nicht dieselbe Zahl wie oben: Beim
	// Standard-Teaser steht der Rahmen auf 1280 und das Specimen auf 892, und
	// genau diesen Unterschied soll man sehen können.
	let rahmenIstBreite = $state(0);

	// Drift: DEKLARIERTE Werte (getComputedStyle) gegen den Figma-Sollwert. Details
	// zur Konservativität (keine Text-Boxen, ±1px, nach fonts.ready) in ./anatomy-measure.
	let drift = $state<Record<string, Drift>>({});

	function measureOverlays() {
		if (!slotEl) return;
		const wurzel = slotEl.firstElementChild;
		let breiteRahmen = 0;
		if (rahmenEl) {
			const f = rahmenEl.getBoundingClientRect();
			rahmenIstBreite = f.width;
			breiteRahmen = f.width;
			if (wurzel) {
				const r = wurzel.getBoundingClientRect();
				istBox = { links: r.left - f.left, oben: r.top - f.top, breite: r.width, hoehe: r.height };
			}
		}
		const base = slotEl.getBoundingClientRect();
		const rel = (r: DOMRect): Rect => ({
			left: r.left - base.left,
			top: r.top - base.top,
			width: r.width,
			height: r.height
		});

		const parts: Record<number, Rect> = {};
		for (const c of cs) {
			if (!c.anchor?.selector) continue;
			const el = slotEl.querySelector(c.anchor.selector);
			if (el) parts[c.nr] = rel(el.getBoundingClientRect());
		}
		partRects = parts;

		// Drift: Ist-Werte am Specimen-Root erheben. Nur eindeutig zuordenbare Werte
		// prüfen: masse.hoehe/radius können sich bei Komposit-Patterns (Cell: 84 =
		// Media-Kind) auf ein Kind beziehen — Radius deshalb nur, wenn der Root
		// selbst sichtbar rundet; Höhe (einzige Box-Messung) gar nicht.
		const root = slotEl.firstElementChild;
		const d: Record<string, Drift> = {};
		if (root instanceof HTMLElement) {
			const st = getComputedStyle(root);
			if (padBox) {
				checkDrift('pad-v', padBox.t, parseFloat(st.paddingTop), d);
				checkDrift('pad-h', padBox.l, parseFloat(st.paddingLeft), d);
			}
			const radiusIst = parseFloat(st.borderTopLeftRadius);
			if (radiusIst > 0) checkDrift('radius', num(apx(masse?.radius ?? undefined)), radiusIst, d);
		}

		// ——— Abstände: EINE Schleife für Streifen UND Sollwert-Prüfung ———
		// Beides aus derselben Messung: Was gezeichnet wird, ist auch das, wogegen
		// der Sollwert antritt. Zwei getrennte Durchgänge wären die Gelegenheit,
		// dass Bild und Befund auseinanderlaufen.
		const gemessen: Record<number, Rect[]> = {};
		const sichtbar = (r: DOMRect) => r.width > 0 && r.height > 0;
		spacing.forEach((s, i) => {
			const key = `sp-${i}`;
			// Der Sollwert ist der Wert, der auf DIESER Bühnenbreite gilt — bei
			// breakpoint-abhängigen Abständen also die passende Stufe, sonst der
			// Kopfwert der Zeile.
			const soll = num(stufeFuer(s.stufen, breiteRahmen)?.px ?? s.px);

			// (a) Abstand ZWISCHEN zwei benannten Elementen. Entsteht in der Regel
			// als margin am Geschwisterelement und ist an keinem Container als `gap`
			// ablesbar — hier zählt allein der gemessene Zwischenraum.
			if (s.von && s.bis) {
				const a = slotEl?.querySelector(s.von);
				const b = slotEl?.querySelector(s.bis);
				if (!a || !b) return;
				const ra = a.getBoundingClientRect();
				const rb = b.getBoundingClientRect();
				if (!sichtbar(ra) || !sichtbar(rb)) return; // in dieser Variante nicht gezeigt
				const z = paarZwischenraum(ra, rb, base);
				// Beide Anker da, aber kein Zwischenraum (kollabierter Rand,
				// überlappende Boxen): Zeile TROTZDEM koppeln, damit der Befund als
				// „gerendert 0 px" sichtbar wird statt lautlos zu verschwinden.
				gemessen[i] = z ? [z.streifen] : [];
				checkDrift(key, soll, z?.abstand ?? 0, d);
				return;
			}

			if (!s.selector) return;

			// (b) Innenabstand eines benannten Elements (nicht der Wurzel — die kommt
			// aus masse.padding). Mehrere Treffer bekommen alle ihren Streifen; der
			// Sollwert tritt gegen den ersten an.
			if (s.art === 'padding') {
				const els = [...(slotEl?.querySelectorAll(s.selector) ?? [])].filter((el) =>
					sichtbar(el.getBoundingClientRect())
				);
				if (!els.length) return;
				const strips: Rect[] = [];
				let erstes: { t: number; r: number; b: number; l: number } | null = null;
				for (const el of els) {
					const est = getComputedStyle(el);
					const pad = {
						t: parseFloat(est.paddingTop) || 0,
						r: parseFloat(est.paddingRight) || 0,
						b: parseFloat(est.paddingBottom) || 0,
						l: parseFloat(est.paddingLeft) || 0
					};
					erstes ??= pad;
					strips.push(...padStreifen(el.getBoundingClientRect(), pad, base, s.richtung));
				}
				gemessen[i] = strips;
				if (erstes) checkDrift(key, soll, s.richtung === 'horizontal' ? erstes.l : erstes.t, d);
				return;
			}

			// (c) `gap` eines Containers. Anders als (a)/(b) wird hier NICHT gekoppelt,
			// wenn keine Streifen anfallen: Ein Container mit weniger als zwei
			// sichtbaren Kindern (Karussell ohne Steuerung, Cell ohne Meta-Zeile) ist
			// kein Befund, sondern diese Variante.
			const cont = slotEl?.querySelector(s.selector);
			if (!cont) return;
			const kids = [...cont.children].map((k) => k.getBoundingClientRect());
			const strips = computeGapStrips(kids, base, s.achse);
			if (strips.length) gemessen[i] = strips;
			// Der gap ist am Container DEKLARIERT — hier ist die Absicht ablesbar und
			// belastbarer als der Zwischenraum (ein `space-between` spreizt ihn).
			const cst = getComputedStyle(cont);
			const ist =
				s.achse === 'vertikal'
					? parseFloat(cst.rowGap)
					: s.achse === 'horizontal'
						? parseFloat(cst.columnGap)
						: parseFloat(cst.columnGap) || parseFloat(cst.rowGap);
			if (Number.isFinite(ist)) checkDrift(key, soll, ist, d);
		});
		streifen = gemessen;
		drift = d;
	}

	$effect(() => {
		if (!slotEl) return;
		measureOverlays();
		// Nach dem Font-Load erneut messen — sonst meldet der Drift-Check
		// Fallback-Font-Metriken als falschen Alarm.
		document.fonts?.ready.then(measureOverlays);
		const ro = new ResizeObserver(measureOverlays);
		ro.observe(slotEl);
		// AUCH das Specimen-Root beobachten: der Slot behält bei internen Reflows
		// (Hydration, spät angewandtes pattern.css) oft seine Box — die Kinder
		// ändern sich trotzdem. Ohne das blieben Mount-Messungen mit 0-Breiten
		// stehen und die Gap-Kopplung fiel stumm aus (live beobachteter Bug).
		if (slotEl.firstElementChild) ro.observe(slotEl.firstElementChild);
		// Und den Rahmen: Er trägt die eingestellte Breite. Ohne ihn bliebe die
		// Nachmessung der Maßlinien beim Umschalten auf dem alten Stand stehen —
		// also genau dann falsch, wenn es darauf ankommt.
		if (rahmenEl) ro.observe(rahmenEl);
		return () => ro.disconnect();
	});

	// Beim Sichtwechsel (Bestandteile ↔ Measurements) einmal frisch messen —
	// billig, und deterministischer als jede Timing-Annahme.
	$effect(() => {
		void view;
		requestAnimationFrame(measureOverlays);
	});

	// Sync-Key je Abstände-Zeile. Zwei Kopplungen, und die Reihenfolge ist die
	// Aussage: Eine Zeile OHNE eigenen Anker beschreibt den Innenabstand der
	// WURZEL und hängt an den vier Kantenstreifen aus `masse.padding` (vertikal =
	// oben/unten, horizontal = links/rechts). Alles mit Anker (`selector` oder das
	// Paar `von`/`bis`) hängt an den live gemessenen Streifen dieser Zeile.
	// Zeilen ohne Kopplung bleiben passiv (kein Hover-Köder).
	const padBox = $derived(parsePad(apx(masse?.padding ?? undefined)));
	function rowKey(s: SpacingSpec, i: number): string | null {
		if (s.art === 'padding' && !s.selector && padBox) {
			if (s.richtung === 'vertikal') return 'pad-v';
			if (s.richtung === 'horizontal') return 'pad-h';
			return null;
		}
		// Bewusst NICHT nach `art` gefragt: Ob ein Abstand als `gap`, als margin
		// zwischen Geschwistern oder als Innenabstand eines Kindes entsteht, ist
		// eine CSS-Frage — gemessen wird er so oder so, und was gemessen ist, wird
		// auch gekoppelt. Genau diese Abfrage hat die Geschwister-Abstände zuvor
		// stumm gestellt.
		return streifen[i] ? `sp-${i}` : null;
	}
	// Sync-Keys parallel zu spacing — die Abstände-Tabelle bekommt sie hereingereicht.
	const spacingKeys = $derived(spacing.map((s, i) => rowKey(s, i)));

	// Was auf DIESER Bühnenbreite gilt — nur für Zeilen mit Breakpoint-Stufen und
	// nur, wenn die geltende Stufe vom Kopfwert abweicht. Der Hinweis ist eine
	// Einordnung, keine Warnung: Dass ein Abstand unter 768 px kleiner ist, steht
	// so im Modell und ist kein Befund.
	const stufenHinweise = $derived(
		spacing.map((s) => {
			const st = stufeFuer(s.stufen, rahmenIstBreite);
			return !st || st.px === s.px
				? null
				: { px: st.px, token: st.token ?? null, breite: Math.round(rahmenIstBreite) };
		})
	);

	// ——— Kastenmaße: erst nachmessen, dann beschriften ———
	// Bei `center` bleibt es beim Bisherigen: Das Specimen bringt seine Breite
	// mit, `masse` beschreibt sie, und ein Komposit-Pattern darf sich mit
	// `hoehe`/`breite` auch legitim auf ein KIND beziehen (Cell: 84 = Media) —
	// nachmessen würde dort Richtiges wegwerfen. Bei `fill` gibt es diesen Fall
	// nicht: Da hat das Specimen gar keine eigene Breite, und ein Wert, den der
	// Rahmen gerade nicht hat, ist an ihm schlicht falsch.
	function belegt(m: MasseValue | undefined, ist: number): boolean {
		const soll = reineZahl(apx(m));
		return soll != null && Math.abs(soll - ist) <= TOL;
	}
	const zeigeBreite = $derived(!!masse?.breite && (!istFill || belegt(masse.breite, istBox.breite)));
	const zeigeHoehe = $derived(!!masse?.hoehe && (!istFill || belegt(masse.hoehe, istBox.hoehe)));

	// Bezugsrahmen der Kastenmaß-Overlays. Bei `center` bleibt es bei `inset: 0`
	// aus dem Stylesheet (Rahmen = Specimen, unverändert); bei `fill` legt die
	// Messung sie auf das Specimen.
	const masseBoxStil = $derived(
		istFill
			? `left:${istBox.links}px;top:${istBox.oben}px;width:${istBox.breite}px;height:${istBox.hoehe}px`
			: undefined
	);

	// Was NICHT gezeichnet wird, verschwindet nicht stillschweigend — es bekommt
	// einen Satz. Ein fehlendes Maß muss man merken können, sonst hat die Bühne
	// den Wert nur versteckt statt ihn ehrlich einzuordnen.
	const massText = (m: MasseValue) => {
		const n = reineZahl(apx(m));
		return n == null ? apx(m) : `${n}\u00a0px`;
	};
	const offeneMasse = $derived(
		!istFill
			? []
			: [
					...(masse?.breite && !zeigeBreite ? [`Breite (${massText(masse.breite)})`] : []),
					...(masse?.hoehe && !zeigeHoehe ? [`Höhe (${massText(masse.hoehe)})`] : [])
				]
	);
</script>

<div
	class="anatomy-artboard spec-canvas ds-stage"
	class:is-dark={isDark}
	class:anatomy-artboard--fill={istFill}
>
	{#if showModeToggle || istFill}
		<div class="anatomy-artboard__toolbar anatomy-artboard__toolbar--left">
			{#if showModeToggle}
				<SegmentedControl
					label="Ansicht"
					options={[
						{ value: 'parts', label: 'Bestandteile' },
						{ value: 'measure', label: 'Measurements' }
					]}
					value={view}
					onchange={(v) => switchView(v as 'parts' | 'measure')}
				/>
			{/if}
			<!-- Breiten-Leiste NUR bei `fill`: Bei `center` bringt das Specimen seine
			     Breite selbst mit — ein Regler für die Bühnenbreite änderte dort nichts
			     am Gezeigten und wäre ein Bedienelement ohne Wirkung. -->
			{#if istFill}
				<ViewportSelect
					value={viewport}
					extra={referenzPreset}
					onchange={(v) => (viewport = v)}
				/>
			{/if}
		</div>
	{/if}
	<div class="anatomy-artboard__toolbar">
		<StageToggle {isDark} onlight={() => setTheme('light')} ondark={() => setTheme('dark')} />
	</div>
	<!-- Scroll-Port: Breiten ÜBER der Bühnenbreite (Voreinstellung „Desktop" = 1280
	     in einer ~650px-Spalte) bleiben so erscrollbar statt abgeschnitten — dasselbe
	     Mittel wie im Playground. Innenabstand und die ihn spiegelnde negative
	     Außenkante holen den Platz zurück, den Maßlinien, Callout-Punkte und
	     Radius-Fahne AUSSERHALB des Rahmens brauchen; ohne ihn schnitte der Port
	     genau die Beschriftungen ab, um die es hier geht. Bei `center` ist der Port
	     ein gewöhnlicher Block ohne eigene Wirkung. -->
	<div class="anatomy-artboard__scroll">
		<div
			class="specimen"
			bind:this={rahmenEl}
			style:width={istFill ? (rahmenBreite === null ? '100%' : `${rahmenBreite}px`) : undefined}
		>
			{#if view === 'parts'}
				{#each cs as c, i}
					<!-- Hover auf dem Punkt = reine Maus-Zugabe (Zwei-Wege-Highlight); Tastatur-
	             Nutzer bekommen dieselbe Info über die Legende → role="presentation". -->
					{#if c.anchor}
						<span
							role="presentation"
							class="callout-dot callout-dot--anchored callout-dot--{c.anchor.side ?? 'top'}"
							class:callout-dot--on={activeKey === `co-${c.nr}`}
							style="{c.anchor.x != null ? `left:${c.anchor.x}%;` : ''}{c.anchor.y != null
								? `top:${c.anchor.y}%;`
								: ''}"
							onmouseenter={() => (hovered = `co-${c.nr}`)}
							onmouseleave={() => (hovered = null)}>{c.nr}</span
						>
					{:else}
						<span
							role="presentation"
							class="callout-dot"
							class:callout-dot--on={activeKey === `co-${c.nr}`}
							style="--i:{i}"
							onmouseenter={() => (hovered = `co-${c.nr}`)}
							onmouseleave={() => (hovered = null)}>{c.nr}</span
						>
					{/if}
				{/each}
			{/if}

			<div class="slot" bind:this={slotEl}>{@render preview?.()}</div>

			{#if view === 'parts'}
				<!-- Part-Outlines: live gemessene Flächen der Bestandteile (anchor.selector).
				     Erscheinen beim Hover/Pin auf Legende oder Callout-Punkt. -->
				<div class="overlays" aria-hidden="true">
					{#each cs as c (c.nr)}
						{#if partRects[c.nr]}
							{@const r = partRects[c.nr]}
							<span
								class="part"
								class:part--on={activeKey === `co-${c.nr}`}
								style="left:{r.left - 4}px;top:{r.top - 4}px;width:{r.width + 8}px;height:{r.height +
									8}px"
							>
								<span class="part-tag">{c.nr}{c.lead ? ` · ${c.lead}` : ''}</span>
							</span>
						{/if}
					{/each}
				</div>
			{/if}

			{#if view === 'measure' && masse}
				<!-- Bezugsrahmen der Kastenmaße: Alles hier drin gehört ans SPECIMEN.
				     Bei `center` deckt sich das mit dem Rahmen (`inset: 0`, unverändert),
				     bei `fill` legt die Messung es auf die tatsächliche Specimen-Box. -->
				<div class="masse-box" style={masseBoxStil}>
				{#if padBox}
					<!-- Innenabstand am Ort des Geschehens: vier schraffierte Streifen (grün).
					     Leuchten auf, wenn die zugehörige Tabellenzeile aktiv ist. -->
					<div class="pad-box" aria-hidden="true">
						<span
							class="pad-strip pad-strip--top"
							class:strip--on={activeKey === 'pad-v'}
							style="height:{padBox.t}px"
						></span>
						<span
							class="pad-strip pad-strip--bottom"
							class:strip--on={activeKey === 'pad-v'}
							style="height:{padBox.b}px"
						></span>
						<span
							class="pad-strip pad-strip--left"
							class:strip--on={activeKey === 'pad-h'}
							style="width:{padBox.l}px;top:{padBox.t}px;bottom:{padBox.b}px"
						></span>
						<span
							class="pad-strip pad-strip--right"
							class:strip--on={activeKey === 'pad-h'}
							style="width:{padBox.r}px;top:{padBox.t}px;bottom:{padBox.b}px"
						></span>
					</div>
				{/if}
					<!-- Maßlinien nur, wenn das Specimen dieses Maß gerade wirklich hat (bei
				     `fill` nachgemessen, bei `center` wie bisher unverändert gezeigt). -->
				{#if zeigeHoehe && masse.hoehe}<div
						class="dimension-line dimension-line--height"
						aria-hidden="true"
					>
						<span class="dimension-label" title="Höhe">H&nbsp;{apx(masse.hoehe)}</span>
					</div>{/if}
				{#if zeigeBreite && masse.breite}<div
						class="dimension-line dimension-line--width"
						aria-hidden="true"
					>
						<span
							class="dimension-label"
							title={istFill
								? 'Referenzbreite — die Bühne steht genau auf diesem Maß'
								: 'Breite'}>B&nbsp;{apx(masse.breite)}</span
						>
					</div>{/if}
				{#if masse.radius}<div class="radius-label" aria-hidden="true">
						<span title="Eckenradius"
							>r&nbsp;{apx(masse.radius)}{#if drift.radius}<span
									class="drift-mark"
									title="Weicht ab — gerendert {drift.radius.ist}px">&nbsp;⚠</span
								>{/if}</span
						>
					</div>{/if}
				</div>

				<!-- Abstände am Ort des Geschehens: schraffierte Streifen, live gemessen.
				     Die Farbe folgt der Bedeutung (gelb = Zwischenraum, grün =
				     Innenabstand), NICHT dem CSS-Mechanismus: Ob der Zwischenraum als
				     `gap` eines Containers oder als margin zwischen zwei Geschwistern
				     entsteht, sieht man ihm nicht an — und soll man auch nicht müssen. -->
				<div class="overlays" aria-hidden="true">
					{#each spacing as s, i (i)}
						{#if streifen[i]}
							{#each streifen[i] as r, j (j)}
								<span
									class:gap-strip={s.art !== 'padding'}
									class:pad-strip={s.art === 'padding'}
									class:pad-strip--gemessen={s.art === 'padding'}
									class:strip--on={activeKey === `sp-${i}`}
									style="left:{r.left}px;top:{r.top}px;width:{r.width}px;height:{r.height}px"
								></span>
							{/each}
						{/if}
					{/each}
				</div>
			{/if}
		</div>
	</div>

	{#if istFill}
		<!-- Die Bühnenbreite steht sichtbar auf der Bühne: Ohne sie wäre „Frei" eine
		     Zahl, die niemand kennt — und der Hinweis unten könnte sich auf nichts
		     beziehen. Dieselbe Anzeige wie im Playground. -->
		<span class="anatomy-artboard__breite">{Math.round(rahmenIstBreite)} px</span>
	{/if}
</div>

{#if view === 'measure' && offeneMasse.length}
	<!-- Kein stiller Ausfall: Was auf der Bühne nicht als Linie steht, steht hier
	     als Satz — und der Satz sagt, wo man den Wert findet. Bewusst UNTER dem
	     Artboard statt darauf: eine Einordnung ist kein Maß und soll auch nicht
	     wie eines aussehen. -->
	<p class="anatomy-hinweis">
		Für diese Bühnenbreite nicht dokumentiert: {offeneMasse.join(' · ')}.
		{#if referenzPreset && viewport !== 'referenz'}
			Das Modell misst bei {referenzPreset.width}&nbsp;px — auf der Bühne unter „Breite"
			einstellbar.
		{/if}
	</p>
{/if}

{#if view === 'parts' && cs.length}
	<AnatomyLegend rows={cs} {activeKey} {pinned} onhover={(k) => (hovered = k)} onpress={press} />
{/if}

{#if view === 'measure' && spacing.length}
	<AnatomySpacingTable
		{spacing}
		keys={spacingKeys}
		{stufenHinweise}
		{drift}
		{activeKey}
		{pinned}
		onhover={(k) => (hovered = k)}
		onpress={press}
	/>
{/if}

<style>
	.anatomy-artboard {
		/* Fläche = dieselbe Bühne wie der Playground: background-10 + Punktraster über
       border-70. Beide Token sind in .ds-stage.is-dark gepinnt → Fläche UND Punkte
       flippen gemeinsam mit dem Light/Dark-Schalter (RAW-Token; ein --ds-*-Token
       wäre schon auf :root aufgelöst). Maßlinien/Callouts nutzen einen eigenen
       Kanal (--measure = focus-100 „Blueprint-Blau"), damit Maße nie mit
       Komponentenfarben verwechselt werden. */
		--measure: var(--z-ds-color-focus-100);
		/* Drei Bedeutungen, drei Farben (DevTools-Konvention): Maßlinien blau,
		   Padding grün, Gaps gelb — echte Status-Tokens, kein neues Farbsystem. */
		--pad-line: var(--z-ds-color-background-success);
		--gap-line: var(--z-ds-color-background-warning);
		position: relative;
		background-color: var(--z-ds-color-background-10);
		background-image: radial-gradient(circle, var(--z-ds-color-border-70) 1px, transparent 1px);
		background-size: 12px 12px;
		border: 1px solid var(--ds-border-soft);
		border-radius: var(--ds-radius);
		padding: 80px 64px 44px;
		overflow: hidden;
		transition: background-color var(--ds-dur) var(--ds-ease);
	}
	.anatomy-artboard__toolbar {
		position: absolute;
		top: var(--z-ds-space-8);
		right: var(--z-ds-space-8);
		z-index: 6; /* über Raster + Callouts */
		display: flex;
		align-items: center;
		gap: 6px;
		/* Beschriftungen der Leiste sitzen AUF der Bühne und müssen deshalb der
		   Bühne folgen, nicht dem Seiten-Theme (ds-stage-raw-token-rule): Auf einer
		   dunklen Doku-Seite bliebe der helle Artboard sonst mit hellgrauer Schrift
		   zurück. Dasselbe Rezept wie --seg-* in global.css — die Rolle wird hier
		   umgelenkt, die Kind-Komponente bleibt RAW-frei. */
		--ds-text-muted: var(--z-ds-color-text-55);
	}
	.anatomy-artboard__toolbar--left {
		right: auto;
		left: var(--z-ds-space-8);
		/* Platz für den Light/Dark-Schalter rechts freihalten und bei Enge lieber
		   umbrechen als mit ihm kollidieren — der Kopfraum der Bühne (80px) trägt
		   die zweite Zeile. */
		max-width: calc(100% - 2 * var(--z-ds-space-8) - 76px);
		flex-wrap: wrap;
	}
	.specimen {
		/* Immer Originalgröße (1:1) — kein Zoom, damit Maße/Proportionen stimmen. */
		position: relative;
		width: max-content;
		max-width: 100%; /* große Patterns (Teaser, Pager) laufen nicht aus dem Artboard */
		margin: 6px auto 0;
	}

	/* ── align: 'fill' — der Rahmen gibt die Breite vor ───────────────────────
	   Ein fill-Specimen hat keine eigene Breite (siehe $lib/spec/buehne.ts).
	   `max-content` ließ es deshalb auf Inhaltsbreite zusammenfallen, während die
	   Container-Query weiter gegen die volle Bühne auswertete: Desktop-Regeln auf
	   Mobil-Breite. Die Breite kommt jetzt per style-Attribut (100% oder Npx), und
	   der Rahmen ist selbst Query-Container — sonst antwortete das gescopte
	   @container wieder mit der Bühnenbreite und die Voreinstellungen blieben
	   folgenlos (derselbe Befund wie am .playground__frame). Der Rahmen ist dabei
	   NIE inhaltsbreit, das Größen-Containment der Inline-Achse kostet also nichts;
	   die Block-Achse bleibt frei, hohe Specimens wachsen ungekappt. */
	.anatomy-artboard--fill .specimen {
		max-width: none;
		container-type: inline-size;
	}
	.anatomy-artboard--fill .anatomy-artboard__scroll {
		/* Innenabstand = Platz für alles, was AUSSERHALB des Rahmens gezeichnet wird:
		   Höhen-Maßlinie samt Beschriftung (-56px), Radius-Fahne (-44px),
		   Callout-Punkte (-30px), Part-Tags (-22px). Die negative Außenkante gibt
		   denselben Betrag wieder ab — sie holt ihn aus dem Innenabstand der Bühne
		   (80/64/44), sodass die sichtbare Geometrie unverändert bleibt und nur die
		   Clip-Kante nach außen rückt. */
		margin: -36px -60px -44px;
		padding: 36px 60px 44px;
		overflow-x: auto;
		overflow-y: hidden;
	}
	/* Breiten-Anzeige unten links — Zwilling von .playground__width. */
	.anatomy-artboard__breite {
		position: absolute;
		bottom: var(--z-ds-space-8);
		left: var(--z-ds-space-8);
		z-index: 6;
		font-size: var(--ds-text-xs);
		font-variant-numeric: tabular-nums;
		color: var(--z-ds-color-text-55);
		pointer-events: none;
	}
	/* Der Satz, der eine Maßlinie ersetzt: bewusst NICHT im Blueprint-Blau, damit
	   ihn niemand für ein Maß hält — und unter der Bühne, wo die Doku spricht. */
	.anatomy-hinweis {
		margin: var(--z-ds-space-8) 0 0;
		font-size: var(--ds-text-xs);
		line-height: 1.5;
		color: var(--ds-text-muted);
	}
	.slot {
		position: relative;
		z-index: 1;
	}

	.callout-dot {
		position: absolute;
		z-index: 3;
		width: 18px;
		height: 18px;
		border-radius: 999px;
		background: var(--measure);
		color: var(--z-ds-color-general-white-100);
		font-family: var(--ds-font-mono);
		font-size: 11px;
		font-weight: 600;
		display: flex;
		align-items: center;
		justify-content: center;
		top: -9px;
		cursor: default;
		transition: box-shadow var(--ds-dur) var(--ds-ease);
	}
	.callout-dot:not(.callout-dot--anchored):nth-child(odd) {
		left: -9px;
	}
	.callout-dot:not(.callout-dot--anchored):nth-child(even) {
		right: -9px;
	}
	.callout-dot--anchored {
		top: auto;
	}
	.callout-dot--anchored::after {
		content: '';
		position: absolute;
		background: var(--measure);
	}
	.callout-dot--left {
		left: -30px;
		transform: translateY(-50%);
	}
	.callout-dot--left::after {
		left: 18px;
		top: 50%;
		width: 12px;
		height: 1px;
		transform: translateY(-50%);
	}
	.callout-dot--right {
		right: -30px;
		transform: translateY(-50%);
	}
	.callout-dot--right::after {
		right: 18px;
		top: 50%;
		width: 12px;
		height: 1px;
		transform: translateY(-50%);
	}
	.callout-dot--top {
		top: -30px;
		transform: translateX(-50%);
	}
	.callout-dot--top::after {
		top: 18px;
		left: 50%;
		height: 12px;
		width: 1px;
		transform: translateX(-50%);
	}
	.callout-dot--bottom {
		bottom: -30px;
		transform: translateX(-50%);
	}
	.callout-dot--bottom::after {
		bottom: 18px;
		left: 50%;
		height: 12px;
		width: 1px;
		transform: translateX(-50%);
	}
	.callout-dot--on {
		box-shadow: 0 0 0 3px color-mix(in srgb, var(--measure) 32%, transparent);
		z-index: 5;
	}

	/* Bezugsrahmen der Kastenmaße (Innenabstand-Streifen, Maßlinien, Radius-Fahne).
	   Bei `center` deckt er sich mit dem Rahmen — `inset: 0`, exakt wie vorher, als
	   die Overlays noch direkte Kinder von .specimen waren. Bei `fill` setzt die
	   Messung left/top/width/height als Inline-Stil; `right`/`bottom` müssen dann
	   weichen, sonst wäre die Box überbestimmt. */
	.masse-box {
		position: absolute;
		inset: 0;
	}
	.anatomy-artboard--fill .masse-box {
		right: auto;
		bottom: auto;
	}

	/* Overlay-Ebene für Part-Outlines + Gap-Streifen (live gemessen) — fängt keine Maus. */
	.overlays {
		position: absolute;
		inset: 0;
		z-index: 2;
		pointer-events: none;
	}
	/* Part-Outline: Kontur + getönte Fläche + Namens-Tag der aktiven Legenden-Zeile. */
	.part {
		position: absolute;
		border: 1.5px solid transparent;
		border-radius: var(--ds-radius-sm);
		opacity: 0;
		transition:
			opacity var(--ds-dur) var(--ds-ease-out),
			border-color var(--ds-dur) var(--ds-ease-out);
	}
	.part--on {
		opacity: 1;
		border-color: var(--measure);
		background: color-mix(in srgb, var(--measure) 12%, transparent);
	}
	.part-tag {
		position: absolute;
		top: -22px;
		left: -1.5px;
		background: var(--measure);
		color: var(--z-ds-color-general-white-100);
		font-family: var(--ds-font-mono);
		font-size: 10px;
		font-weight: 600;
		padding: 2px 7px;
		border-radius: var(--ds-radius-sm);
		white-space: nowrap;
		opacity: 0;
		transform: translateY(3px);
		transition:
			opacity var(--ds-dur) var(--ds-ease-out),
			transform var(--ds-dur) var(--ds-ease-out);
	}
	.part--on .part-tag {
		opacity: 1;
		transform: none;
	}

	/* Innenabstand-Overlay: vier schraffierte Streifen an den Specimen-Kanten
	   (Schraffur liest sich als „Zwischenraum", nicht als weiteres Bauteil).
	   Liegt über dem Specimen, fängt aber keine Maus. */
	.pad-box {
		position: absolute;
		inset: 0;
		z-index: 2;
		pointer-events: none;
	}
	.pad-strip {
		position: absolute;
		background-image: repeating-linear-gradient(
			45deg,
			color-mix(in srgb, var(--pad-line) 30%, transparent) 0 3px,
			transparent 3px 7px
		);
		background-color: color-mix(in srgb, var(--pad-line) 10%, transparent);
		transition:
			box-shadow var(--ds-dur) var(--ds-ease),
			background-color var(--ds-dur) var(--ds-ease);
	}
	.pad-strip--top {
		top: 0;
		left: 0;
		right: 0;
		border-bottom: 1px dashed color-mix(in srgb, var(--pad-line) 55%, transparent);
	}
	.pad-strip--bottom {
		bottom: 0;
		left: 0;
		right: 0;
		border-top: 1px dashed color-mix(in srgb, var(--pad-line) 55%, transparent);
	}
	.pad-strip--left {
		left: 0;
		border-right: 1px dashed color-mix(in srgb, var(--pad-line) 55%, transparent);
	}
	.pad-strip--right {
		right: 0;
		border-left: 1px dashed color-mix(in srgb, var(--pad-line) 55%, transparent);
	}
	/* Innenabstand eines benannten KINDES (nicht der Wurzel): frei positioniert,
	   deshalb keine feste Kante — die gestrichelte Linie läuft rundum. */
	.pad-strip--gemessen {
		border: 1px dashed color-mix(in srgb, var(--pad-line) 55%, transparent);
	}
	/* Gap-Streifen: gelbe Schraffur zwischen den Teilen. */
	.gap-strip {
		position: absolute;
		background-image: repeating-linear-gradient(
			45deg,
			color-mix(in srgb, var(--gap-line) 40%, transparent) 0 3px,
			transparent 3px 7px
		);
		background-color: color-mix(in srgb, var(--gap-line) 12%, transparent);
		transition:
			box-shadow var(--ds-dur) var(--ds-ease),
			background-color var(--ds-dur) var(--ds-ease);
	}
	/* Aktive Streifen (Tabellenzeile gehovert/gepinnt) leuchten auf. */
	.pad-strip.strip--on {
		box-shadow: 0 0 0 1.5px var(--pad-line);
		background-color: color-mix(in srgb, var(--pad-line) 24%, transparent);
	}
	.gap-strip.strip--on {
		box-shadow: 0 0 0 1.5px var(--gap-line);
		background-color: color-mix(in srgb, var(--gap-line) 28%, transparent);
	}

	.dimension-line {
		position: absolute;
		color: var(--measure);
	}
	.dimension-label {
		position: absolute;
		font-family: var(--ds-font-mono);
		font-size: 11px;
		background: var(--z-ds-color-background-10);
		padding: 0 4px;
		color: var(--measure);
		white-space: nowrap;
	}
	.dimension-line--height {
		left: -26px;
		top: 0;
		bottom: 0;
		width: 1px;
		background: var(--measure);
	}
	.dimension-line--height::before,
	.dimension-line--height::after {
		content: '';
		position: absolute;
		left: -3px;
		width: 7px;
		height: 1px;
		background: var(--measure);
	}
	.dimension-line--height::before {
		top: 0;
	}
	.dimension-line--height::after {
		bottom: 0;
	}
	.dimension-line--height .dimension-label {
		left: -30px;
		top: 50%;
		transform: translateY(-50%);
	}
	.dimension-line--width {
		left: 0;
		right: 0;
		bottom: -22px;
		height: 1px;
		background: var(--measure);
	}
	.dimension-line--width::before,
	.dimension-line--width::after {
		content: '';
		position: absolute;
		bottom: -3px;
		width: 1px;
		height: 7px;
		background: var(--measure);
	}
	.dimension-line--width::before {
		left: 0;
	}
	.dimension-line--width::after {
		right: 0;
	}
	.dimension-line--width .dimension-label {
		left: 50%;
		bottom: -9px;
		transform: translateX(-50%);
	}
	.radius-label {
		position: absolute;
		top: -6px;
		right: -44px;
		font-family: var(--ds-font-mono);
		font-size: 11px;
		color: var(--measure);
	}
	.radius-label::before {
		content: '';
		position: absolute;
		left: -12px;
		top: 9px;
		width: 12px;
		height: 1px;
		background: var(--measure);
	}
	.drift-mark {
		cursor: help;
	}

	@media (max-width: 560px) {
		.anatomy-artboard {
			padding: 72px 28px 40px;
		}
		.radius-label {
			display: none;
		}
	}

	/* Alle Bühnen-/Overlay-Transitions still stellen (Highlights bleiben, nur ohne
	   Bewegung/Fade) — Blueprint bleibt lesbar, respektiert die Nutzer-Präferenz. */
	@media (prefers-reduced-motion: reduce) {
		.anatomy-artboard,
		.callout-dot,
		.part,
		.part-tag,
		.pad-strip,
		.gap-strip {
			transition: none;
		}
	}
</style>
