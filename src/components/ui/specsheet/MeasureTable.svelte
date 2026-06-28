<!-- MeasureTable.svelte — Maße als native, adaptive Tabelle (Specs-Tab). -->
<script>
  /** @type {{ hoehe?: string; breite?: string; padding?: string; radius?: string } | null} */
  export let masse = null;
</script>

{#if masse}
  <table class="m">
    <tbody>
      {#if masse.hoehe}<tr><th>Höhe</th><td>{masse.hoehe} px</td></tr>{/if}
      {#if masse.breite}<tr><th>Breite</th><td>{masse.breite} px</td></tr>{/if}
      {#if masse.padding}<tr><th>Padding</th><td>{masse.padding}</td></tr>{/if}
      {#if masse.radius}<tr><th>Radius</th><td>{masse.radius} px</td></tr>{/if}
    </tbody>
  </table>
{/if}

<style>
  .m {
    border-collapse: collapse;
    margin: 0 0 1em;
    min-width: 260px;
  }
  .m th {
    text-align: left;
    font-weight: 400;
    color: var(--z-ds-color-text-55);
    padding: 9px 40px 9px 0;
    border-bottom: 1px solid var(--z-ds-color-border-70);
    font-size: var(--z-ds-fontsize-14);
  }
  .m td {
    text-align: right;
    font-family: ui-monospace, 'SF Mono', Menlo, monospace;
    padding: 9px 0;
    border-bottom: 1px solid var(--z-ds-color-border-70);
    font-size: var(--z-ds-fontsize-14);
  }
</style>
