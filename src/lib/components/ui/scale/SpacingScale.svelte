<!--
  SpacingScale.svelte — Abstands-Skala mit echten Größenbalken.
  Jeder Balken ist so breit wie der Token WIRKLICH ist (width: var(--token)) —
  die Visualisierung IST der Wert. Der px-Wert wird aus der GERENDERTEN Balkenbreite
  gelesen (nicht aus dem Roh-Token) — so stimmt er immer mit dem Balken überein,
  auch bei Media-Query-abhängigen Stufen wie xxl.
-->
<script lang="ts">
  import { CopyButton } from "$components/ui/copy-button";

  let { tokens = [] }: { tokens?: string[] } = $props();

  let listEl: HTMLUListElement;
  let px = $state<Record<string, number>>({});
  $effect(() => {
    if (!listEl) return;
    const bars = listEl.querySelectorAll(".bar");
    const m: Record<string, number> = {};
    tokens.forEach((t, i) => {
      const b = bars[i] as HTMLElement | undefined;
      m[t] = b ? Math.round(parseFloat(getComputedStyle(b).width)) : 0;
    });
    px = m;
  });

  const short = (t: string) => t.replace("--z-ds-space-", "");
</script>

<ul class="scale" bind:this={listEl}>
  {#each tokens as t (t)}
    <li class="row">
      <span class="step">{short(t)}</span>
      <span class="track"
        ><span class="bar" style="width: var({t})"></span></span
      >
      <span class="info">
        <span class="val">{px[t] ?? ""} px</span>
        <code class="name">{t}</code>
        <CopyButton
          value={t}
          ariaLabel={`Token ${t} kopieren`}
          class="scale-copy"
        />
        {#if px[t]}
          <CopyButton
            value={`${px[t]}px`}
            ariaLabel={`Wert ${px[t]}px von ${t} kopieren`}
            class="scale-copy"
          >
            <span class="copy-px">px</span>
          </CopyButton>
        {/if}
      </span>
    </li>
  {/each}
</ul>

<style>
  .scale {
    list-style: none;
    margin: 0;
    padding: 0;
    display: grid;
    gap: 10px;
  }
  .row {
    display: grid;
    grid-template-columns: 2.5rem minmax(3rem, 1fr) auto;
    align-items: center;
    gap: var(--z-ds-space-16);
  }
  .step {
    font-family: var(--ds-font-mono);
    font-size: var(--ds-text-sm);
    color: var(--ds-text-muted);
    text-align: right;
  }
  .track {
    display: block;
    min-width: 0;
  }
  .bar {
    display: block;
    height: 16px;
    max-width: 100%;
    border-radius: var(--ds-radius-xs);
    background: var(--ds-accent-brand);
  }
  .info {
    display: flex;
    align-items: baseline;
    gap: var(--z-ds-space-12);
    white-space: nowrap;
  }
  .val {
    font-family: var(--ds-font-mono);
    font-size: var(--ds-text-sm);
    color: var(--ds-text-body);
    min-width: 3.5rem;
  }
  /* Plainer Mono-Name — kein Code-Pill (Grid-Spalte soll nicht überlappen). */
  .name {
    background: none;
    padding: 0;
    font-family: var(--ds-font-mono);
    font-size: var(--ds-text-xs);
    color: var(--ds-text-muted);
  }
  @media (max-width: 560px) {
    .name {
      display: none;
    }
  }
  /* :global, weil die Klasse auf dem <button> der CopyButton-Komponente landet. */
  :global(.scale-copy) {
    --copy-icon-size: 13px;
    color: var(--ds-text-faint);
  }
  @media (hover: hover) and (pointer: fine) {
    :global(.scale-copy:hover) {
      color: var(--ds-text);
    }
  }
  .copy-px {
    font-family: var(--ds-font-mono);
    font-size: var(--ds-text-xs);
  }
</style>
