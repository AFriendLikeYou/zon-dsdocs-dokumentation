<!--
  SegmentedControl.svelte — kompakter „einer von N"-Umschalter (Pill-Segmente).

  Wiederverwendbar für View-/Modus-/Einheiten-Umschalter (z. B. Anatomie
  Bestandteile ↔ Measurements). Nutzt RAW --z-ds-*-Token → adaptiert korrekt
  SOWOHL im Page-Theme (styles-zds.css Dark-Block) ALS AUCH in .ds-stage-Bühnen
  (dort gepinnte RAW-Token). Abgeleitete --ds-* wären nur auf :root aufgelöst und
  würden in der Bühne nicht mitflippen (siehe ds-stage-raw-token-rule).

  Nutzung:
    <SegmentedControl
      ariaLabel="Ansicht"
      options={[{ value: 'a', label: 'A' }, { value: 'b', label: 'B' }]}
      value={current}
      onchange={(v) => (current = v)} />
-->
<script lang="ts">
	type Option = { value: string; label: string };
	let {
		options,
		value,
		onchange,
		ariaLabel
	}: {
		options: Option[];
		value: string;
		onchange: (value: string) => void;
		ariaLabel: string;
	} = $props();
</script>

<div class="seg" role="group" aria-label={ariaLabel}>
	{#each options as o (o.value)}
		<button
			type="button"
			class="seg-btn"
			aria-pressed={value === o.value}
			onclick={() => onchange(o.value)}>{o.label}</button
		>
	{/each}
</div>

<style>
	.seg {
		display: inline-flex;
		gap: 2px;
		padding: 3px;
		border-radius: 999px;
		background: color-mix(in srgb, var(--z-ds-color-text-100) 7%, transparent);
	}
	.seg-btn {
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
		transition:
			color var(--ds-dur) var(--ds-ease),
			background-color var(--ds-dur) var(--ds-ease);
	}
	.seg-btn[aria-pressed='true'] {
		background: var(--z-ds-color-background-0);
		color: var(--z-ds-color-text-100);
		box-shadow: var(--ds-shadow-sm);
	}
	@media (hover: hover) and (pointer: fine) {
		.seg-btn:hover {
			color: var(--z-ds-color-text-100);
		}
	}
	.seg-btn:focus-visible {
		outline: 2px solid var(--ds-focus-ring);
		outline-offset: 2px;
	}
</style>
