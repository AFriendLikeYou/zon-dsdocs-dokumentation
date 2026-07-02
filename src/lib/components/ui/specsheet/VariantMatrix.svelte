<!--
  VariantMatrix.svelte — Raster echter Specimens je Variante/Zustand.
  Bewusst FIXE helle Artboard-Kacheln (Specimen-Farben kommen 1:1 aus dem
  dokumentierten DS und brauchen eine neutrale Fläche — auch im Dark-Mode).
  Specimens werden als Children übergeben: <div class="cell">…<button …></div>
  `min` steuert die Mindest-Zellbreite (kleine Bausteine 150, große Patterns z. B. 320).
-->
<script lang="ts">
  import type { Snippet } from 'svelte';
  let { min = 150, children }: { min?: number; children?: Snippet } = $props();
</script>

<div class="vmatrix spec-canvas" style="--cell-min:{min}px">{@render children?.()}</div>

<style>
  .vmatrix {
    /* fixe Artboard-Palette (siehe Kommentar oben) */
    --art-line: #e6e7e9;
    --art: #f6f7f8;
    --art-label: #5b6068;
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(var(--cell-min, 150px), 1fr));
    gap: 1px;
    background: var(--art-line);
    border: 1px solid var(--art-line);
    border-radius: var(--ds-radius);
    overflow: hidden;
    margin: 0 0 0.5em;
  }
  .vmatrix :global(.cell) {
    background: var(--art);
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 10px;
    padding: 22px 12px;
    min-height: 104px;
  }
  .vmatrix :global(.cell-label) {
    font-family: var(--ds-font-mono);
    font-size: var(--ds-text-xs);
    color: var(--art-label);
    text-align: center;
  }
</style>
