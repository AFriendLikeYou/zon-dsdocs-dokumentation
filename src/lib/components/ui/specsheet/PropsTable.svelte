<!-- PropsTable.svelte — Props/API-Tabelle (Develop-Tab). Adaptiv über z-ds-Tokens. -->
<script lang="ts">
  import type { PropRow } from '$types/spec';
  let { props = [] }: { props?: PropRow[] } = $props();
</script>

{#if props.length}
  <div class="pt-wrap">
    <table class="pt">
      <thead>
        <tr>
          <th>Prop</th>
          <th>Typ</th>
          <th>Default</th>
          <th>Beschreibung</th>
        </tr>
      </thead>
      <tbody>
        {#each props as p}
          <tr>
            <td><code class="pt-name">{p.name}</code></td>
            <td><code class="pt-typ">{p.typ}</code></td>
            <td>{#if p.default}<code class="pt-def">{p.default}</code>{:else}<span class="pt-dash">—</span>{/if}</td>
            <td class="pt-desc">{p.beschreibung ?? ''}</td>
          </tr>
        {/each}
      </tbody>
    </table>
  </div>
{/if}

<style>
  .pt-wrap {
    /* bewusst kompaktere Tabellen-Maße ohne passendes z-ds-Token */
    --pt-block-gap: 18px; /* kein z-ds-Space zwischen 16 und 20 */
    --pt-fs-body: 13px; /* bewusst dichter als --z-ds-fontsize-12 */
    --pt-fs-head: 11px;
    overflow-x: auto;
    border: 1px solid var(--ds-border);
    border-radius: var(--ds-radius);
    margin: 0 0 var(--pt-block-gap);
  }
  .pt {
    width: 100%;
    border-collapse: collapse;
    font-size: var(--pt-fs-body);
  }
  .pt th {
    text-align: left;
    font-family: var(--ds-font-mono);
    font-size: var(--pt-fs-head);
    letter-spacing: 0.04em;
    text-transform: uppercase;
    color: var(--ds-text-muted);
    font-weight: 600;
    padding: var(--z-ds-space-10) var(--z-ds-space-14);
    background: var(--ds-surface-raised);
    border-bottom: 1px solid var(--ds-border);
    white-space: nowrap;
  }
  .pt td {
    padding: var(--z-ds-space-10) var(--z-ds-space-14);
    border-bottom: 1px solid var(--ds-border);
    vertical-align: top;
    color: var(--ds-text);
  }
  .pt tr:last-child td {
    border-bottom: 0;
  }
  .pt code {
    font-family: var(--ds-font-mono);
    font-size: var(--ds-text-xs);
  }
  .pt-name {
    color: var(--ds-text);
    font-weight: 600;
  }
  .pt-typ {
    color: var(--ds-accent);
  }
  .pt-def {
    color: var(--ds-text-body);
  }
  .pt-dash {
    color: var(--ds-text-faint);
  }
  .pt-desc {
    color: var(--ds-text-body);
    min-width: 200px;
  }
</style>
