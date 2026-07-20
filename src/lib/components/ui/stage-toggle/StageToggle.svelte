<!--
  StageToggle.svelte — Light/Dark-Umschalter für Specimen-Bühnen (Playground, Anatomy).
  Rein visuell + a11y; der Parent hält den State und reicht `isDark` + Handler herein.

  Dünner semantischer Wrapper um ui/SegmentedControl (Muster StatusSegmentedControl,
  ProvenanceChip→Badge): fixiert die Bühnen-Fachsprache ('light' | 'dark'), die
  Sonne/Mond-Icons und das A11y-Label. Radiogroup-Semantik (role=radio/aria-checked),
  roving tabindex, Pfeiltasten und der gleitende Aktiv-Indikator kommen komplett aus
  dem Atom.

  Bühnen-Theming: der Wrapper pinnt NICHTS. Die Pill rendert über die
  --seg-*-Kontextvariablen, die `static/global.css` unter `.ds-stage` auf die je
  Bühne gepinnten ROHEN --z-ds-*-Token umlenkt — dadurch folgt der Umschalter der
  BÜHNE statt dem Seiten-Theme (ds-stage-raw-token-rule), ohne dass hier oder im
  Atom ein RAW-Token steht.
-->
<script lang="ts">
	import { SegmentedControl } from '$components/ui/segmented-control';
	import { SunIcon, MoonIcon } from '$lib/icons';

	let {
		/** Ob die Bühne aktuell dunkel ist (bestimmt das gewählte Segment). */
		isDark = false,
		/** Callback für „hellen Hintergrund". */
		onlight,
		/** Callback für „dunklen Hintergrund". */
		ondark
	}: { isDark?: boolean; onlight: () => void; ondark: () => void } = $props();

	// `title` statt sichtbarem Label: Icon-Segmente holen daraus ihr aria-label UND
	// ihren Tooltip (Hover + Tastatur-Fokus).
	const options = [
		{ value: 'light', title: 'Heller Hintergrund', icon: sunIcon },
		{ value: 'dark', title: 'Dunkler Hintergrund', icon: moonIcon }
	];
</script>

{#snippet sunIcon()}<SunIcon width={14} height={14} />{/snippet}
{#snippet moonIcon()}<MoonIcon width={14} height={14} />{/snippet}

<SegmentedControl
	label="Vorschau-Hintergrund"
	{options}
	value={isDark ? 'dark' : 'light'}
	onchange={(v) => (v === 'dark' ? ondark() : onlight())}
/>
