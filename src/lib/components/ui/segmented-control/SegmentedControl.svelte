<!--
  SegmentedControl.svelte — kompakter „einer von N"-Umschalter (Pill-Segmente)
  mit gleitendem Aktiv-Indikator.

  Wiederverwendbar für View-/Modus-/Einheiten-Umschalter (z. B. Anatomie
  Bestandteile ↔ Measurements, Playground-Varianten). Nutzt RAW --z-ds-*-Token →
  adaptiert korrekt SOWOHL im Page-Theme (styles-zds.css Dark-Block) ALS AUCH in
  .ds-stage-Bühnen (dort gepinnte RAW-Token). Abgeleitete --ds-* wären nur auf
  :root aufgelöst und würden in der Bühne nicht mitflippen (ds-stage-raw-token-rule).

  Der Indikator (.seg-thumb) gleitet unter den aktiven Button (Position wird
  gemessen); beim ersten Rendern und bei reduced-motion springt er ohne Animation.

  Nutzung:
    <SegmentedControl
      ariaLabel="Ansicht"
      options={[{ value: 'a', label: 'A' }, { value: 'b', label: 'B' }]}
      value={current}
      onchange={(v) => (current = v)} />
-->
<script lang="ts">
	type Option = {
		/** Interner Wert des Segments. */
		value: string;
		/** Sichtbare Beschriftung. */
		label: string;
	};
	let {
		/** Auswahloptionen (je ein Pill-Segment). */
		options,
		/** Aktuell gewählter Wert (`value` einer Option). */
		value,
		/** Callback bei Auswahl eines Segments. */
		onchange,
		/** A11y-Label der Radiogruppe. */
		ariaLabel
	}: {
		options: Option[];
		value: string;
		onchange: (value: string) => void;
		ariaLabel: string;
	} = $props();

	let groupEl: HTMLDivElement | undefined = $state();
	let thumb = $state({ left: 0, width: 0 });
	// Erst nach der ersten Messung animieren — sonst gleitet der Indikator beim
	// Mount sichtbar von 0 herein.
	let ready = $state(false);

	function measure() {
		const active = groupEl?.querySelector<HTMLButtonElement>('[aria-checked="true"]');
		if (!active) return;
		thumb = { left: active.offsetLeft, width: active.offsetWidth };
	}

	$effect(() => {
		void value; // bei Wertwechsel neu messen
		void options;
		measure();
		if (!ready) requestAnimationFrame(() => (ready = true));
	});

	$effect(() => {
		if (!groupEl) return;
		const ro = new ResizeObserver(measure);
		ro.observe(groupEl);
		return () => ro.disconnect();
	});
</script>

<div class="segmented-control" role="radiogroup" aria-label={ariaLabel} bind:this={groupEl}>
	<span
		class="segmented-control__thumb"
		class:segmented-control__thumb--ready={ready}
		style:left="{thumb.left}px"
		style:width="{thumb.width}px"
		aria-hidden="true"
	></span>
	{#each options as o (o.value)}
		<button
			type="button"
			class="segmented-control__option"
			role="radio"
			aria-checked={value === o.value}
			onclick={() => onchange(o.value)}>{o.label}</button
		>
	{/each}
</div>

<style>
	.segmented-control {
		position: relative;
		display: inline-flex;
		gap: 2px;
		padding: 3px;
		border-radius: 999px;
		background: color-mix(in srgb, var(--z-ds-color-text-100) 7%, transparent);
		backdrop-filter: blur(10px);
	}
	.segmented-control__thumb {
		position: absolute;
		top: 3px;
		height: 26px;
		border-radius: 999px;
		background: var(--z-ds-color-background-0);
		box-shadow: var(--ds-shadow-sm);
	}
	.segmented-control__thumb--ready {
		transition:
			left var(--ds-dur) var(--ds-ease-out),
			width var(--ds-dur) var(--ds-ease-out);
	}
	.segmented-control__option {
		position: relative;
		border: none;
		background: none;
		border-radius: 999px;
		padding: 3px 12px;
		height: 26px;
		font-size: var(--ds-text-xs);
		font-weight: 500;
		color: var(--z-ds-color-text-55);
		cursor: pointer;
		white-space: nowrap;
		transition: color var(--ds-dur) var(--ds-ease);
	}
	.segmented-control__option[aria-checked='true'] {
		color: var(--z-ds-color-text-100);
		font-weight: 600;
	}
	@media (hover: hover) and (pointer: fine) {
		.segmented-control__option:hover {
			color: var(--z-ds-color-text-100);
		}
	}
	.segmented-control__option:focus-visible {
		outline: 2px solid var(--ds-focus-ring);
		outline-offset: 2px;
	}
	@media (prefers-reduced-motion: reduce) {
		.segmented-control__thumb--ready,
		.segmented-control__option {
			transition: none;
		}
	}
</style>
