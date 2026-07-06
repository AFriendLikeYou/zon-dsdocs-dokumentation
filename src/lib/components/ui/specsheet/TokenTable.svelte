<!-- TokenTable.svelte — Tokens als native, adaptive Tabelle (Specs-Tab). -->
<script lang="ts">
  import type { TokenGroup } from '$types/spec';
  import { CopyButton } from '$components/ui/copy-button';
  let { tokens = [] }: { tokens?: TokenGroup[] } = $props();
</script>

{#if tokens.length}
  <div class="tok-wrap">
  <table class="tok">
    <tbody>
      {#each tokens as group}
        <tr class="cat"><th colspan="3">{group.kategorie}</th></tr>
        {#if group.beschreibung}
          <tr class="desc"><td colspan="3">{group.beschreibung}</td></tr>
        {/if}
        {#each group.items as t}
          <tr>
            <td class="sw-cell">
              {#if t.translucent}
                <span class="sw sw-t"></span>
              {:else if t.swatch}
                <span class="sw" style="background:{t.swatch}"></span>
              {/if}
            </td>
            <td>
              <span class="name-cell">
                <code>{t.name}</code>
                <CopyButton value={t.name} ariaLabel={`${t.name} kopieren`} class="tok-copy" />
              </span>
            </td>
            <td class="val">{t.wert}</td>
          </tr>
        {/each}
      {/each}
    </tbody>
  </table>
  </div>
{/if}

<style>
  /* Schmale Viewports: lange Token-Namen scrollen im Container statt die Seite zu schieben. */
  .tok-wrap {
    overflow-x: auto;
    max-width: 100%;
    margin: 0 0 1em;
  }
  .tok {
    width: 100%;
    border-collapse: collapse;
  }
  .tok td {
    padding: 9px 10px 9px 0;
    border-bottom: 1px solid var(--ds-border);
    vertical-align: middle;
    font-size: var(--ds-text-sm);
  }
  .tok .cat th {
    text-align: left;
    padding: var(--z-ds-space-20) 0 var(--z-ds-space-8);
    color: var(--ds-text-muted);
    font-size: var(--ds-text-xs);
    text-transform: uppercase;
    letter-spacing: 0.06em;
    font-weight: 600;
  }
  .tok .desc td {
    padding: 0 0 var(--z-ds-space-8);
    border-bottom: none;
    color: var(--ds-text-body);
    font-size: var(--ds-text-sm);
    max-width: 60ch;
  }
  .tok code {
    font-family: var(--ds-font-mono);
  }
  .name-cell {
    display: inline-flex;
    align-items: center;
    gap: var(--z-ds-space-8);
  }
  /* :global, weil die Klasse auf dem <button> der CopyButton-Komponente landet. */
  :global(.tok-copy) {
    --copy-icon-size: 14px;
    color: var(--ds-text-faint);
  }
  @media (hover: hover) and (pointer: fine) {
    :global(.tok-copy:hover) {
      color: var(--ds-text);
    }
  }
  .val {
    text-align: right;
    color: var(--ds-text-body);
    font-family: var(--ds-font-mono);
    white-space: nowrap;
  }
  .sw-cell {
    width: 26px;
  }
  .sw {
    display: inline-block;
    width: 15px;
    height: 15px;
    border-radius: var(--ds-radius-sm);
    border: 1px solid var(--ds-border-strong);
  }
  .sw-t {
    background: repeating-conic-gradient(#bbb 0 25%, #fff 0 50%) 50% / 8px 8px;
  }
</style>
