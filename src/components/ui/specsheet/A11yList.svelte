<!-- A11yList.svelte — Barrierefreiheit als native, adaptive Liste. -->
<script>
  /** @type {{ label: string; wert: string; status: 'pass' | 'warn' | 'todo' }[]} */
  export let items = [];
</script>

{#if items.length}
  <dl class="a11y">
    {#each items as a}
      <div class="row">
        <dt><span class="dot dot--{a.status}"></span>{a.label}</dt>
        <dd>{a.wert}</dd>
      </div>
    {/each}
  </dl>
{/if}

<style>
  .a11y {
    margin: 0;
    max-width: 640px;
  }
  .row {
    display: grid;
    grid-template-columns: 160px 1fr;
    gap: 16px;
    align-items: baseline;
    padding: 12px 0;
    border-bottom: 1px solid var(--z-ds-color-border-70);
  }
  .row:last-child {
    border-bottom: 0;
  }
  dt {
    display: flex;
    align-items: center;
    gap: 9px;
    color: var(--z-ds-color-text-55);
    font-size: var(--z-ds-fontsize-14);
  }
  dd {
    margin: 0;
    color: var(--z-ds-color-text-100);
    font-size: var(--z-ds-fontsize-14);
  }
  .dot {
    flex: none;
    width: 9px;
    height: 9px;
    border-radius: 50%;
  }
  .dot--pass {
    background: var(--z-ds-color-background-success);
  }
  .dot--warn {
    background: var(--z-ds-color-background-warning);
  }
  .dot--todo {
    background: var(--z-ds-color-text-40);
  }
  @media (max-width: 520px) {
    .row {
      grid-template-columns: 1fr;
      gap: 4px;
    }
  }
</style>
