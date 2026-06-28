<!-- TokenTable.svelte — Tokens als native, adaptive Tabelle (Specs-Tab). -->
<script>
  /** @type {{ kategorie: string; items: { name: string; wert: string; swatch?: string; translucent?: boolean }[] }[]} */
  export let tokens = [];
</script>

{#if tokens.length}
  <table class="tok">
    <tbody>
      {#each tokens as group}
        <tr class="cat"><th colspan="3">{group.kategorie}</th></tr>
        {#each group.items as t}
          <tr>
            <td class="sw-cell">
              {#if t.translucent}
                <span class="sw sw-t"></span>
              {:else if t.swatch}
                <span class="sw" style="background:{t.swatch}"></span>
              {/if}
            </td>
            <td><code>{t.name}</code></td>
            <td class="val">{t.wert}</td>
          </tr>
        {/each}
      {/each}
    </tbody>
  </table>
{/if}

<style>
  .tok {
    width: 100%;
    border-collapse: collapse;
    margin: 0 0 1em;
  }
  .tok td {
    padding: 9px 10px 9px 0;
    border-bottom: 1px solid var(--z-ds-color-border-70);
    vertical-align: middle;
    font-size: var(--z-ds-fontsize-14);
  }
  .tok .cat th {
    text-align: left;
    padding: 20px 0 8px;
    color: var(--z-ds-color-text-55);
    font-size: var(--z-ds-fontsize-12);
    text-transform: uppercase;
    letter-spacing: 0.06em;
    font-weight: 600;
  }
  .tok code {
    font-family: ui-monospace, 'SF Mono', Menlo, monospace;
  }
  .val {
    text-align: right;
    color: var(--z-ds-color-text-70);
    font-family: ui-monospace, 'SF Mono', Menlo, monospace;
    white-space: nowrap;
  }
  .sw-cell {
    width: 26px;
  }
  .sw {
    display: inline-block;
    width: 15px;
    height: 15px;
    border-radius: var(--z-ds-border-radius-4);
    border: 1px solid var(--z-ds-color-border-100);
  }
  .sw-t {
    background: repeating-conic-gradient(#bbb 0 25%, #fff 0 50%) 50% / 8px 8px;
  }
</style>
