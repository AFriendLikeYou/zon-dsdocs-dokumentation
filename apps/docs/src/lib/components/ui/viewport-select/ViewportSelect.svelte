<!--
  ViewportSelect — die Breiten-Voreinstellungen einer Specimen-Bühne.

  Responsive-Verhalten prüft man an DEFINIERTEN Punkten, nicht nur freihändig.
  Die Werte sind KEINE Erfindung, sondern die Breakpoints, an denen dieses Repo
  tatsächlich umschaltet (grep über `@media` in static/*.css + src/lib/components):
    560 px  — schmalste real genutzte Grenze (Detailregeln in ui/-Komponenten)
    768 px  — DIE App-Grenze: +layout.svelte, layout/Sidebar, ui/grid/Grid;
              static/global.css spiegelt sie als `max-width: 767px`
    1280 px — größte real genutzte Grenze (breite Desktop-Stufe)
  „Frei" ist kein Breakpoint, sondern der Ausgangszustand (volle Bühnenbreite) —
  und der Zustand, in den die Auswahl zurückfällt, sobald wieder gezogen wird.
  Es MUSS ein echtes Segment sein: SegmentedControl vergibt den Tabstop über
  `value === o.value`; ein Wert ohne passendes Segment machte die Gruppe
  unerreichbar für die Tastatur.

  Warum als eigenes Atom: Die Leiste stand zuerst nur im Playground. Als die
  Anatomie dieselbe Umschaltung brauchte, wäre die zweite Kopie der Anfang zweier
  auseinanderlaufender Preset-Listen gewesen — dieselbe Falle, die `buehne.ts`
  für `render.align` schon aufgelöst hat: eine Zusage, zwei Auslegungen.

  `extra` ergänzt EINE zusätzliche Stufe, die nur der jeweilige Consumer kennt.
  Die Anatomie reicht darüber die im Modell dokumentierte Referenzbreite herein —
  erst damit ist die Breite, bei der die Maße gelten, überhaupt einstellbar.
-->
<script lang="ts" module>
	/** Eine Breiten-Stufe der Bühne; `width: null` = volle Bühnenbreite. */
	export type ViewportPreset = {
		value: string;
		label: string;
		width: number | null;
		/** Tooltip-Text des Segments (erklärt die Zahl hinter dem Kurzlabel). */
		title: string;
	};

	/** Die geteilten Voreinstellungen — Playground UND Anatomie zeigen dieselben. */
	export const VIEWPORT_PRESETS: ViewportPreset[] = [
		{ value: 'frei', label: 'Frei', width: null, title: 'Volle Breite der Bühne' },
		{ value: 'mobil', label: 'Mobil', width: 560, title: 'Mobil — 560 px' },
		{ value: 'tablet', label: 'Tablet', width: 768, title: 'Tablet — 768 px' },
		{ value: 'desktop', label: 'Desktop', width: 1280, title: 'Desktop — 1280 px' }
	];

	/**
	 * Die Stufen inklusive einer optionalen Zusatzstufe, nach Breite einsortiert —
	 * „Frei" bleibt vorn, weil es der Ausgangszustand ist und keine Breite hat.
	 */
	export function viewportPresets(extra?: ViewportPreset | null): ViewportPreset[] {
		if (!extra) return VIEWPORT_PRESETS;
		const mitBreite = [...VIEWPORT_PRESETS.filter((p) => p.width !== null), extra].sort(
			(a, b) => (a.width ?? 0) - (b.width ?? 0)
		);
		return [...VIEWPORT_PRESETS.filter((p) => p.width === null), ...mitBreite];
	}

	/** Breite einer Stufe (null = volle Bühnenbreite, auch bei unbekanntem Wert). */
	export function viewportWidth(value: string, extra?: ViewportPreset | null): number | null {
		return viewportPresets(extra).find((p) => p.value === value)?.width ?? null;
	}
</script>

<script lang="ts">
	import { SegmentedControl } from '$components/ui/segmented-control';

	let {
		value,
		onchange,
		extra = null,
		label = 'Breite',
		size = 'sm'
	}: {
		/** Aktuell gewählte Stufe (`value` eines Presets). */
		value: string;
		/** Callback bei Auswahl — der Consumer setzt daraus seine Rahmenbreite. */
		onchange: (value: string) => void;
		/** Zusätzliche Stufe des Consumers (z. B. die Referenzbreite des Modells). */
		extra?: ViewportPreset | null;
		/** Sichtbare Beschriftung links neben der Pille. */
		label?: string;
		size?: 'sm' | 'md';
	} = $props();

	const presets = $derived(viewportPresets(extra));
</script>

<span class="viewport-select">
	<span class="viewport-select__label">{label}</span>
	<SegmentedControl
		label="Vorschau-Breite"
		options={presets.map((p) => ({ value: p.value, label: p.label, title: p.title }))}
		{value}
		{size}
		{onchange}
	/>
</span>

<style>
	.viewport-select {
		display: inline-flex;
		align-items: center;
		gap: var(--z-ds-space-6);
	}
	/* Zurückgenommene Beschriftung: In der dichten Leiste trägt die Pille die
	   Betonung — dieselbe Metrik wie die Control-Labels im Playground. */
	.viewport-select__label {
		font-size: var(--ds-text-xs);
		font-weight: 500;
		color: var(--ds-text-muted);
	}
</style>
