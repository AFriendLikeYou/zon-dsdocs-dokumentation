<!-- A11yList.svelte — Barrierefreiheit als native, adaptive Liste. -->
<script lang="ts">
  import type { A11yItem } from '$types/spec';
  let { items = [] }: { items?: A11yItem[] } = $props();
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
    --a11y-label-col: 160px; /* Label-Spalte, bewusstes Layout-Maß ohne z-ds-Token */
    margin: 0;
    max-width: 640px;
  }
  .row {
    display: grid;
    grid-template-columns: var(--a11y-label-col) 1fr;
    gap: var(--z-ds-space-16);
    align-items: baseline;
    padding: var(--z-ds-space-12) 0;
    border-bottom: 1px solid var(--ds-border);
  }
  .row:last-child {
    border-bottom: 0;
  }
  dt {
    display: flex;
    align-items: center;
    gap: 9px;
    color: var(--ds-text-muted);
    font-size: var(--ds-text-sm);
  }
  dd {
    margin: 0;
    color: var(--ds-text);
    font-size: var(--ds-text-sm);
  }
  .dot {
    flex: none;
    width: 9px;
    height: 9px;
    border-radius: 50%;
  }
  .dot--pass {
    background: var(--ds-positive);
  }
  .dot--warn {
    background: var(--ds-warning);
  }
  .dot--todo {
    background: var(--ds-text-faint);
  }
  @media (max-width: 520px) {
    .row {
      grid-template-columns: 1fr;
      gap: var(--z-ds-space-4);
    }
  }
</style>
