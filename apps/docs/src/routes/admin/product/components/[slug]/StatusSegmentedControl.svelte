<!--
  StatusSegmentedControl — barrierefreie Icon-Statuswahl für die A11y-Zeilen des
  Spec-Editors. Dünner semantischer Wrapper um ui/SegmentedControl (Muster
  ProvenanceChip→Badge): fixiert die Status-Fachsprache ('pass' | 'warn' | 'todo'),
  die Default-Icons ✓/⚠/○ und die Status-Rollenfarben (tone), und pinnt die runde,
  eingelassene Track-Optik über die --seg-*-Kontextvariablen.

    ✓ pass · ⚠ warn · ○ todo

  A11y (Radiogroup-Semantik, roving tabindex, Pfeiltasten) kommt vollständig aus
  ui/SegmentedControl. Die aktive Option wird in ihrer Status-Rollenfarbe
  hinterlegt (Muster: die Status-Punkte der öffentlichen A11yList).
-->
<script lang="ts">
	import { SegmentedControl } from '$components/ui/segmented-control';
	import { CheckIcon, AlertTriangleIcon, CircleIcon } from '$lib/icons';

	type Status = 'pass' | 'warn' | 'todo';

	let {
		value = $bindable(),
		onchange,
		ariaLabel = 'Status'
	}: {
		/** Aktueller Status (Datenvertrag: 'pass' | 'warn' | 'todo'). */
		value: string;
		/** Callback bei Auswahl eines Segments. */
		onchange?: (value: Status) => void;
		/** A11y-Label der Radiogruppe. */
		ariaLabel?: string;
	} = $props();

	// Reihenfolge, sprechende A11y-Labels, Icon und Status-Rollenfarbe je Status.
	// (Screenreader liest den Sinn über `title`, nicht das Icon.)
	const options = [
		{ value: 'pass', title: 'Erfüllt', icon: passIcon, tone: 'positive' as const },
		{ value: 'warn', title: 'Warnung', icon: warnIcon, tone: 'warning' as const },
		{ value: 'todo', title: 'Offen', icon: todoIcon, tone: 'neutral' as const }
	];
</script>

{#snippet passIcon()}<CheckIcon width={13} height={13} />{/snippet}
{#snippet warnIcon()}<AlertTriangleIcon width={13} height={13} />{/snippet}
{#snippet todoIcon()}<CircleIcon width={13} height={13} />{/snippet}

<div class="status-seg">
	<SegmentedControl
		label={ariaLabel}
		{options}
		bind:value
		onchange={(v) => onchange?.(v as Status)}
	/>
</div>

<style>
	/* Runde, eingelassene Track-Optik der Status-Zeile: die --seg-*-Kontextvariablen
	   überschreiben die flat-Defaults (Muster: Consumer pinnt die Optik per Kontext,
	   Komponente bleibt RAW-frei). Vererbt in die gescopte SegmentedControl. */
	.status-seg {
		--seg-track-bg: var(--ds-surface-sunken);
		--seg-radius: 999px;
		--seg-pad: 2px;
		--seg-blur: 0;
		--seg-text: var(--ds-text-faint);
		--seg-text-active: var(--ds-text-muted);
		display: inline-flex;
	}
</style>
