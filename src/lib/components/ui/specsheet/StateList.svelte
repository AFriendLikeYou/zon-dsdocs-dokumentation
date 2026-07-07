<!-- StateList.svelte — Zustände als adaptive Chips. -->
<script lang="ts">
  import type { SpecState } from '$types/spec';
  let {
    states = [],
    hint = 'Gefüllt = im Design vorhanden, gestrichelt = in Figma ergänzen.'
  }: { states?: SpecState[]; hint?: string } = $props();
</script>

{#if states.length}
  <div class="states">
    {#each states as s}
      <span class="state" class:on={s.vorhanden} class:todo={!s.vorhanden}>{s.label}</span>
    {/each}
  </div>
  {#if hint}<p class="hint">{hint}</p>{/if}
{/if}

<style>
  .states {
    display: flex;
    flex-wrap: wrap;
    gap: var(--z-ds-space-8);
  }
  .state {
    font-family: var(--ds-font-mono);
    font-size: var(--ds-text-xs);
    padding: 5px 11px; /* bewusstes Chip-Maß ohne passendes z-ds-Token */
    border-radius: var(--ds-radius-sm);
  }
  .on {
    background: var(--ds-text);
    color: var(--ds-surface);
  }
  .todo {
    color: var(--ds-text-muted);
    border: 1px dashed var(--ds-border-strong);
  }
  .hint {
    font-size: var(--ds-text-sm);
    color: var(--ds-text-muted);
    margin: var(--z-ds-space-12) 0 0;
  }
</style>
