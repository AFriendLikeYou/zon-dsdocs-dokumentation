<!-- PropsTable.svelte — Props/API-Tabelle (Develop-Tab). Adaptiv über z-ds-Tokens. -->
<script>
  /** @type {{ name: string; typ: string; default?: string; beschreibung?: string }[]} */
  export let props = [];
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
    --mono: ui-monospace, 'SF Mono', 'JetBrains Mono', Menlo, monospace;
    overflow-x: auto;
    border: 1px solid var(--z-ds-color-border-70);
    border-radius: var(--z-ds-border-radius-8);
    margin: 0 0 18px;
  }
  .pt {
    width: 100%;
    border-collapse: collapse;
    font-size: 13px;
  }
  .pt th {
    text-align: left;
    font-family: var(--mono);
    font-size: 11px;
    letter-spacing: 0.04em;
    text-transform: uppercase;
    color: var(--z-ds-color-text-55);
    font-weight: 600;
    padding: 10px 14px;
    background: var(--z-ds-color-background-10);
    border-bottom: 1px solid var(--z-ds-color-border-70);
    white-space: nowrap;
  }
  .pt td {
    padding: 10px 14px;
    border-bottom: 1px solid var(--z-ds-color-border-70);
    vertical-align: top;
    color: var(--z-ds-color-text-100);
  }
  .pt tr:last-child td {
    border-bottom: 0;
  }
  .pt code {
    font-family: var(--mono);
    font-size: 12px;
  }
  .pt-name {
    color: var(--z-ds-color-text-100);
    font-weight: 600;
  }
  .pt-typ {
    color: var(--z-ds-color-focus-100);
  }
  .pt-def {
    color: var(--z-ds-color-text-70);
  }
  .pt-dash {
    color: var(--z-ds-color-text-40);
  }
  .pt-desc {
    color: var(--z-ds-color-text-70);
    min-width: 200px;
  }
</style>
