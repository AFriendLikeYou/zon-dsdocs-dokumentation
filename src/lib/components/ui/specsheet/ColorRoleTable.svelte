<!--
  ColorRoleTable.svelte — Farbrollen-Matrix (Specs-Tab): Teil (Zeilen) × Zustand
  (Spalten) → --z-ds-Token. Je Zelle: Mini-Swatch (Wert live via getComputedStyle
  aufgelöst) + kopierbarer Token-Name. `hinweis` als letzte Spalte.

  Theme-adaptiv über --ds-*; Swatch-Werte werden gegen :root aufgelöst (RAW
  --z-ds-*-Token). "none" = bewusst kein Fill (kariertes Feld, kein Token).
-->
<script lang="ts">
  import type { ColorRoles } from '$types/spec';
  import { CopyButton } from '$components/ui/copy-button';

  let { farbrollen = null }: { farbrollen?: ColorRoles | null } = $props();

  const zustaende = $derived(farbrollen?.zustaende ?? []);
  const elemente = $derived(farbrollen?.elemente ?? []);
  const hasHinweis = $derived(elemente.some((e) => e.hinweis));

  // Live-Auflösung der --z-ds-*-Token → Swatch-Farbe (nur clientseitig).
  let resolved = $state<Record<string, string>>({});
  $effect(() => {
    if (!farbrollen) return;
    const root = getComputedStyle(document.documentElement);
    const map: Record<string, string> = {};
    for (const el of farbrollen.elemente) {
      for (const token of Object.values(el.tokensProZustand)) {
        if (token && token !== 'none' && !(token in map)) {
          const varName = token.replace(/^var\(\s*|\s*\)$/g, '');
          map[token] = root.getPropertyValue(varName).trim();
        }
      }
    }
    resolved = map;
  });
</script>

{#if farbrollen && zustaende.length && elemente.length}
  <div class="cr-wrap">
    <table class="cr">
      <thead>
        <tr>
          <th class="cr-teil">Teil</th>
          {#each zustaende as z}
            <th>{z}</th>
          {/each}
          {#if hasHinweis}<th class="cr-note-head">Hinweis</th>{/if}
        </tr>
      </thead>
      <tbody>
        {#each elemente as el}
          <tr>
            <th class="cr-teil" scope="row">{el.teil}</th>
            {#each zustaende as z}
              {@const token = el.tokensProZustand[z]}
              <td>
                {#if token === 'none'}
                  <span class="cr-cell">
                    <span class="sw sw-none" title="Kein Fill"></span>
                    <span class="cr-token cr-none">none</span>
                  </span>
                {:else if token}
                  <span class="cr-cell">
                    <span class="sw" style="background:{resolved[token] || 'transparent'}"></span>
                    <span class="cr-token">
                      <code>{token}</code>
                      <CopyButton value={token} ariaLabel={`${token} kopieren`} class="cr-copy" />
                    </span>
                  </span>
                {:else}
                  <span class="cr-dash">—</span>
                {/if}
              </td>
            {/each}
            {#if hasHinweis}<td class="cr-note">{el.hinweis ?? ''}</td>{/if}
          </tr>
        {/each}
      </tbody>
    </table>
  </div>
{/if}

<style>
  /* Schmale Viewports: die Matrix scrollt im eigenen Container statt die Seite zu schieben. */
  .cr-wrap {
    overflow-x: auto;
    max-width: 100%;
    margin: 0 0 1em;
  }
  .cr {
    border-collapse: collapse;
    /* min-width sorgt dafür, dass die Matrix scrollt statt zu quetschen; die Falle
       ist ein zu großer Wert → hier bewusst moderat. */
    min-width: 320px;
    font-size: var(--ds-text-sm);
  }
  .cr th,
  .cr td {
    text-align: left;
    padding: var(--z-ds-space-8) var(--z-ds-space-16) var(--z-ds-space-8) 0;
    border-bottom: 1px solid var(--ds-border);
    vertical-align: top;
  }
  .cr thead th {
    color: var(--ds-text-muted);
    font-size: var(--ds-text-xs);
    text-transform: uppercase;
    letter-spacing: 0.06em;
    font-weight: 600;
    white-space: nowrap;
  }
  .cr-teil {
    font-weight: 600;
    color: var(--ds-text);
    white-space: nowrap;
  }
  tbody .cr-teil {
    font-size: var(--ds-text-sm);
    text-transform: none;
    letter-spacing: normal;
  }
  .cr-cell {
    display: inline-flex;
    align-items: center;
    gap: var(--z-ds-space-8);
  }
  .cr-token {
    display: inline-flex;
    align-items: center;
    gap: 6px;
  }
  .cr code {
    font-family: var(--ds-font-mono);
    font-size: var(--ds-text-xs);
    white-space: nowrap;
  }
  .cr-none {
    font-family: var(--ds-font-mono);
    font-size: var(--ds-text-xs);
    color: var(--ds-text-faint);
    font-style: italic;
  }
  .cr-dash {
    color: var(--ds-text-faint);
  }
  .sw {
    display: inline-block;
    flex: none;
    width: 15px;
    height: 15px;
    border-radius: var(--ds-radius-sm);
    border: 1px solid var(--ds-border-strong);
  }
  /* "none" = bewusst kein Fill → kariertes Feld (wie transparente Swatch). */
  .sw-none {
    background: repeating-conic-gradient(#bbb 0 25%, #fff 0 50%) 50% / 8px 8px;
  }
  .cr-note {
    color: var(--ds-text-body);
    min-width: 180px;
    font-size: var(--ds-text-sm);
  }
  /* :global, weil die Klasse auf dem <button> der CopyButton-Komponente landet. */
  :global(.cr-copy) {
    --copy-icon-size: 13px;
    color: var(--ds-text-faint);
  }
  @media (hover: hover) and (pointer: fine) {
    :global(.cr-copy:hover) {
      color: var(--ds-text);
    }
  }
</style>
