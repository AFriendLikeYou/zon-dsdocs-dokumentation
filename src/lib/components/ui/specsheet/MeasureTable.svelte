<!-- MeasureTable.svelte — Maße als native, adaptive Tabelle (Specs-Tab). -->
<script lang="ts">
  import type { Masse } from '$types/spec';
  let { masse = null }: { masse?: Masse | null } = $props();
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
    color: var(--ds-text-muted);
    padding: 9px 40px 9px 0;
    border-bottom: 1px solid var(--ds-border);
    font-size: var(--ds-text-sm);
  }
  .m td {
    text-align: right;
    font-family: var(--ds-font-mono);
    padding: 9px 0; /* bewusstes Zell-Padding ohne passendes z-ds-Token */
    border-bottom: 1px solid var(--ds-border);
    font-size: var(--ds-text-sm);
  }
</style>
