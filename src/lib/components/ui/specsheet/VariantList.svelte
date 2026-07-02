<!-- VariantList.svelte — Varianten mit Beschreibung (native, adaptiv). -->
<script lang="ts">
  import type { VariantGroup } from '$types/spec';
  import { Chip } from '$components/ui/chip';
  let {
    varianten = [],
    info = {}
  }: { varianten?: VariantGroup[]; info?: Record<string, string> } = $props();
</script>

{#each varianten as v}
  <div class="vg">
    <span class="prop">{v.prop}</span>
    <div class="list">
      {#each v.werte as w}
        <div class="item">
          <Chip mono variant={w.default ? 'accent' : 'neutral'} emphasis={w.default}>{w.label}</Chip>
          {#if info[w.label]}<span class="desc">{info[w.label]}</span>{/if}
        </div>
      {/each}
    </div>
  </div>
{/each}

<style>
  .vg {
    margin: 0 0 1.25em;
  }
  .prop {
    font-size: var(--ds-text-xs);
    text-transform: uppercase;
    letter-spacing: 0.06em;
    color: var(--ds-text-muted);
  }
  .list {
    display: flex;
    flex-direction: column;
    gap: 11px;
    margin-top: 11px;
  }
  .item {
    display: flex;
    align-items: baseline;
    gap: 13px;
  }
  .desc {
    color: var(--ds-text-body);
    font-size: var(--ds-text-sm);
    line-height: 1.5;
  }
</style>
