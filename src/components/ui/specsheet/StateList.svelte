<!-- StateList.svelte — Zustände als adaptive Chips. -->
<script>
  /** @type {{ label: string; vorhanden?: boolean }[]} */
  export let states = [];
</script>

{#if states.length}
  <div class="states">
    {#each states as s}
      <span class="state" class:on={s.vorhanden} class:todo={!s.vorhanden}>{s.label}</span>
    {/each}
  </div>
  <p class="hint">Gefüllt = im Design vorhanden, gestrichelt = in Figma ergänzen.</p>
{/if}

<style>
  .states {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
  }
  .state {
    font-family: ui-monospace, 'SF Mono', Menlo, monospace;
    font-size: var(--z-ds-fontsize-12);
    padding: 5px 11px;
    border-radius: var(--z-ds-border-radius-4);
  }
  .on {
    background: var(--z-ds-color-text-100);
    color: var(--z-ds-color-background-0);
  }
  .todo {
    color: var(--z-ds-color-text-40);
    border: 1px dashed var(--z-ds-color-border-100);
  }
  .hint {
    font-size: var(--z-ds-fontsize-14);
    color: var(--z-ds-color-text-55);
    margin: 12px 0 0;
  }
</style>
