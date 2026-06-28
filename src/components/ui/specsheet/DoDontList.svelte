<!-- DoDontList.svelte — Do/Don't als adaptive Liste. -->
<script>
  /** @type {{ do?: string[]; dont?: string[] } | null} */
  export let doDont = null;
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
    gap: 16px;
  }
  .dd ul {
    list-style: none;
    margin: 0;
    padding: 0;
    display: flex;
    flex-direction: column;
    gap: 10px;
  }
  .dd li {
    position: relative;
    padding-left: 26px;
    margin: 0;
    font-size: var(--z-ds-fontsize-16);
    color: var(--z-ds-color-text-100);
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
    color: var(--z-ds-color-background-success);
  }
  .dd .dont li::before {
    content: '✕';
    color: var(--z-ds-color-error-70);
  }
</style>
