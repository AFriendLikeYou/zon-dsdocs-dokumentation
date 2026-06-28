<!-- VariantList.svelte — Varianten mit Beschreibung (native, adaptiv). -->
<script>
  /** @type {{ prop: string; werte: { label: string; default?: boolean }[] }[]} */
  export let varianten = [];
  /** @type {Record<string, string>} */
  export let info = {};
</script>

{#each varianten as v}
  <div class="vg">
    <span class="prop">{v.prop}</span>
    <div class="list">
      {#each v.werte as w}
        <div class="item">
          <span class="chip" class:chip--def={w.default}>{w.label}</span>
          {#if info[w.label]}<span class="desc">{info[w.label]}</span>{/if}
        </div>
      {/each}
    </div>
  </div>
{/each}

<style>
  .vg {
    margin: 0 0 1.25em;
  }
  .prop {
    font-size: var(--z-ds-fontsize-12);
    text-transform: uppercase;
    letter-spacing: 0.06em;
    color: var(--z-ds-color-text-55);
  }
  .list {
    display: flex;
    flex-direction: column;
    gap: 11px;
    margin-top: 11px;
  }
  .item {
    display: flex;
    align-items: baseline;
    gap: 13px;
  }
  .chip {
    flex: none;
    font-family: ui-monospace, 'SF Mono', Menlo, monospace;
    font-size: var(--z-ds-fontsize-12);
    padding: 4px 11px;
    border-radius: var(--z-ds-border-radius-4);
    background: var(--z-ds-color-background-10);
    box-shadow: inset 0 0 0 1px var(--z-ds-color-border-70);
    color: var(--z-ds-color-text-100);
  }
  .chip--def {
    font-style: italic;
    color: var(--z-ds-color-focus-100);
    background: color-mix(in srgb, var(--z-ds-color-focus-100) 9%, transparent);
    box-shadow: inset 0 0 0 1px color-mix(in srgb, var(--z-ds-color-focus-100) 32%, transparent);
  }
  .desc {
    color: var(--z-ds-color-text-70);
    font-size: var(--z-ds-fontsize-14);
    line-height: 1.5;
  }
</style>
