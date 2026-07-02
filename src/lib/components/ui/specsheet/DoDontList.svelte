<!-- DoDontList.svelte — Do/Don't als adaptive Liste. -->
<script lang="ts">
  import type { DoDont } from '$types/spec';
  let { doDont = null }: { doDont?: DoDont | null } = $props();
</script>

{#if doDont}
  <div class="dd">
    {#if doDont.do?.length}
      <ul class="do">{#each doDont.do as d}<li>{d}</li>{/each}</ul>
    {/if}
    {#if doDont.dont?.length}
      <ul class="dont">{#each doDont.dont as d}<li>{d}</li>{/each}</ul>
    {/if}
  </div>
{/if}

<style>
  .dd {
    display: flex;
    flex-direction: column;
    gap: var(--z-ds-space-16);
  }
  .dd ul {
    list-style: none;
    margin: 0;
    padding: 0;
    display: flex;
    flex-direction: column;
    gap: var(--z-ds-space-10);
  }
  .dd li {
    position: relative;
    padding-left: 26px;
    margin: 0;
    font-size: var(--ds-text-base);
    color: var(--ds-text);
    line-height: 1.5;
  }
  .dd li::before {
    position: absolute;
    left: 0;
    top: 0;
    font-weight: 700;
  }
  .dd .do li::before {
    content: '✓';
    color: var(--ds-positive);
  }
  .dd .dont li::before {
    content: '✕';
    color: var(--ds-negative);
  }
</style>
