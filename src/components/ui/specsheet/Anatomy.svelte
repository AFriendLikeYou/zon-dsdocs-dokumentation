<!--
  Anatomy.svelte — Blueprint-Artboard mit Specimen, Callouts, Maßlinien, Legende.
  Helle, fixe Artboard-Fläche (Komponentenfarben sind fix). Legende adaptiv (z-ds).
  Slots: preview (Haupt-Specimen), variant (optionales zweites Specimen).
-->
<script>
  /** @type {{ hoehe?: string; breite?: string; padding?: string; radius?: string } | null} */
  export let masse = null;
  /** @type {{ nr?: number; text: string }[]} */
  export let callouts = [];
  /** @type {{ nr: number; side?: 'top'|'bottom'|'left'|'right'; x?: number; y?: number }[]} */
  export let calloutAnchors = [];

  /** @type {number | null} */
  let active = null;

  $: cs = callouts.map((/** @type {any} */ c, /** @type {number} */ i) => {
    const nr = c.nr ?? i + 1;
    return { ...c, nr, anchor: calloutAnchors.find((a) => a.nr === nr) ?? null };
  });
</script>

<div class="art spec-canvas">
  <div class="grid" aria-hidden="true"></div>
  <div class="specimen">
    {#each cs as c, i}
      {#if c.anchor}
        <span
          class="co co--anchored co--{c.anchor.side ?? 'top'}"
          class:co--on={active === c.nr}
          style="{c.anchor.x != null ? `left:${c.anchor.x}%;` : ''}{c.anchor.y != null ? `top:${c.anchor.y}%;` : ''}"
        >{c.nr}</span>
      {:else}
        <span class="co" class:co--on={active === c.nr} style="--i:{i}">{c.nr}</span>
      {/if}
    {/each}

    <div class="slot"><slot name="preview" /></div>

    {#if masse}
      {#if masse.hoehe}<div class="dim dim-h" aria-hidden="true"><span class="dl">{masse.hoehe}</span></div>{/if}
      {#if masse.breite}<div class="dim dim-w" aria-hidden="true"><span class="dl">{masse.breite}</span></div>{/if}
      {#if masse.padding}<div class="dim dim-pad" aria-hidden="true"><span class="dl">{masse.padding}</span></div>{/if}
      {#if masse.radius}<div class="rad" aria-hidden="true"><span>r {masse.radius}</span></div>{/if}
    {/if}
  </div>

  {#if $$slots.variant}
    <div class="strip"><slot name="variant" /></div>
  {/if}
</div>

{#if cs.length}
  <ol class="legend">
    {#each cs as c}
      <li
        class:on={active === c.nr}
        on:mouseenter={() => (active = c.nr)}
        on:mouseleave={() => (active = null)}
      >
        <span class="n">{c.nr}</span> {c.text}
      </li>
    {/each}
  </ol>
{/if}

<style>
  .art {
    --art: #f6f7f8;
    --measure: #2563c9;
    --gl: rgba(0, 0, 0, 0.05);
    position: relative;
    background: var(--art);
    border: 1px solid var(--z-ds-color-border-70);
    border-radius: var(--z-ds-border-radius-8);
    padding: 80px 64px 44px;
    overflow: hidden;
  }
  .grid {
    position: absolute;
    inset: 0;
    background-image: linear-gradient(var(--gl) 1px, transparent 1px),
      linear-gradient(90deg, var(--gl) 1px, transparent 1px);
    background-size: 22px 22px;
    mask-image: radial-gradient(120% 100% at 50% 40%, #000 55%, transparent 100%);
  }
  .specimen {
    position: relative;
    width: max-content;
    margin: 6px auto 0;
    transform: scale(1.3);
    transform-origin: center top;
  }
  .slot {
    position: relative;
    z-index: 1;
  }

  .co {
    position: absolute;
    z-index: 3;
    width: 18px;
    height: 18px;
    border-radius: 999px;
    background: var(--measure);
    color: #fff;
    font-family: ui-monospace, Menlo, monospace;
    font-size: 11px;
    font-weight: 600;
    display: flex;
    align-items: center;
    justify-content: center;
    top: -9px;
  }
  .co:not(.co--anchored):nth-child(odd) { left: -9px; }
  .co:not(.co--anchored):nth-child(even) { right: -9px; }
  .co--anchored { top: auto; }
  .co--anchored::after { content: ''; position: absolute; background: var(--measure); }
  .co--left { left: -30px; transform: translateY(-50%); }
  .co--left::after { left: 18px; top: 50%; width: 12px; height: 1px; transform: translateY(-50%); }
  .co--right { right: -30px; transform: translateY(-50%); }
  .co--right::after { right: 18px; top: 50%; width: 12px; height: 1px; transform: translateY(-50%); }
  .co--top { top: -30px; transform: translateX(-50%); }
  .co--top::after { top: 18px; left: 50%; height: 12px; width: 1px; transform: translateX(-50%); }
  .co--bottom { bottom: -30px; transform: translateX(-50%); }
  .co--bottom::after { bottom: 18px; left: 50%; height: 12px; width: 1px; transform: translateX(-50%); }
  .co--on { box-shadow: 0 0 0 3px color-mix(in srgb, var(--measure) 32%, transparent); z-index: 5; }

  .dim { position: absolute; color: var(--measure); }
  .dl {
    position: absolute;
    font-family: ui-monospace, Menlo, monospace;
    font-size: 11px;
    background: var(--art);
    padding: 0 4px;
    color: var(--measure);
    white-space: nowrap;
  }
  .dim-h { left: -26px; top: 0; bottom: 0; width: 1px; background: var(--measure); }
  .dim-h::before, .dim-h::after { content: ''; position: absolute; left: -3px; width: 7px; height: 1px; background: var(--measure); }
  .dim-h::before { top: 0; }
  .dim-h::after { bottom: 0; }
  .dim-h .dl { left: -30px; top: 50%; transform: translateY(-50%); }
  .dim-w { left: 0; right: 0; bottom: -22px; height: 1px; background: var(--measure); }
  .dim-w::before, .dim-w::after { content: ''; position: absolute; bottom: -3px; width: 1px; height: 7px; background: var(--measure); }
  .dim-w::before { left: 0; }
  .dim-w::after { right: 0; }
  .dim-w .dl { left: 50%; bottom: -9px; transform: translateX(-50%); }
  .dim-pad { top: -30px; left: 50%; transform: translateX(-50%); }
  .dim-pad .dl { position: static; border: 1px dashed color-mix(in srgb, var(--measure) 55%, transparent); }
  .rad { position: absolute; top: -6px; right: -44px; font-family: ui-monospace, Menlo, monospace; font-size: 11px; color: var(--measure); }
  .rad::before { content: ''; position: absolute; left: -12px; top: 9px; width: 12px; height: 1px; background: var(--measure); }

  .strip {
    position: relative;
    z-index: 2;
    display: flex;
    align-items: center;
    gap: 12px;
    justify-content: center;
    margin-top: 44px;
    padding-top: 18px;
    border-top: 1px dashed var(--z-ds-color-border-100);
  }

  .legend {
    list-style: none;
    margin: 16px 2px 0;
    padding: 0;
    display: grid;
    gap: 5px;
  }
  .legend li {
    display: flex;
    align-items: baseline;
    gap: 9px;
    padding: 4px 6px;
    margin: 0 -6px;
    border-radius: var(--z-ds-border-radius-4);
    font-size: var(--z-ds-fontsize-14);
    color: var(--z-ds-color-text-70);
    cursor: default;
    transition: background 0.15s ease;
  }
  .legend li.on {
    background: var(--z-ds-color-background-10);
  }
  .legend .n {
    flex: none;
    width: 18px;
    height: 18px;
    border-radius: 999px;
    background: var(--z-ds-color-text-100);
    color: var(--z-ds-color-background-0);
    font-family: ui-monospace, Menlo, monospace;
    font-size: 11px;
    font-weight: 600;
    display: inline-flex;
    align-items: center;
    justify-content: center;
  }

  @media (max-width: 560px) {
    .art { padding: 72px 28px 40px; }
    .rad { display: none; }
  }
</style>
