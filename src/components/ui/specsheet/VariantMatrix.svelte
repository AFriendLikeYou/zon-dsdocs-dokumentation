<!--
  VariantMatrix.svelte — Raster echter Specimens je Variante/Zustand.
  Helle Artboard-Kacheln (Komponentenfarben sind fix → brauchen helle Fläche).
  Specimens werden als Default-Slot übergeben: <div class="cell">…<button …></div>
-->
<div class="vmatrix spec-canvas"><slot /></div>

<style>
  .vmatrix {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
    gap: 1px;
    /* feste helle Artboard-Töne (Specimenfarben sind fix); leere Raster-Tracks
       bleiben hell statt im Dark-Mode dunkel durchzuscheinen */
    background: #e6e7e9;
    border: 1px solid #e6e7e9;
    border-radius: var(--z-ds-border-radius-8);
    overflow: hidden;
    margin: 0 0 0.5em;
  }
  .vmatrix :global(.cell) {
    background: #f6f7f8;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 10px;
    padding: 22px 12px;
    min-height: 104px;
  }
  .vmatrix :global(.cell-label) {
    font-family: ui-monospace, 'SF Mono', Menlo, monospace;
    font-size: var(--z-ds-fontsize-12);
    color: #5b6068;
    text-align: center;
  }
</style>
