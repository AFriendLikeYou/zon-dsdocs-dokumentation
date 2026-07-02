<!--
  Anatomy.svelte — Blueprint-Artboard mit Specimen, Callouts, Maßlinien, Legende.
  Helle, fixe Artboard-Fläche (Komponentenfarben sind fix). Legende adaptiv (z-ds).
  Slots: preview (Haupt-Specimen), variant (optionales zweites Specimen).
-->
<script lang="ts">
  import type { Snippet } from 'svelte';
  import type { Masse, Callout, CalloutAnchor } from '$types/spec';

  let {
    masse = null,
    callouts = [],
    calloutAnchors = [],
    /** Vergrößerung des Specimens. 1.3 passt für kleine Bausteine (Button);
        große Patterns (Teaser, Pager) setzen 1 — sonst laufen sie aus dem Artboard. */
    zoom = 1.3,
    preview,
    variant
  }: {
    masse?: Masse | null;
    callouts?: Callout[];
    calloutAnchors?: CalloutAnchor[];
    zoom?: number;
    preview?: Snippet;
    variant?: Snippet;
  } = $props();

  let active = $state<number | null>(null);

  const cs = $derived(
    callouts.map((c, i) => {
      const nr = c.nr ?? i + 1;
      return { ...c, nr, anchor: calloutAnchors.find((a) => a.nr === nr) ?? null };
    })
  );
</script>

<div class="art spec-canvas">
  <div class="grid" aria-hidden="true"></div>
  <div class="specimen" style="--zoom:{zoom}">
    {#each cs as c, i}
      <!-- Hover auf dem Punkt = reine Maus-Zugabe (Zwei-Wege-Highlight); Tastatur-
           Nutzer bekommen dieselbe Info über die Legende → role="presentation". -->
      {#if c.anchor}
        <span
          role="presentation"
          class="co co--anchored co--{c.anchor.side ?? 'top'}"
          class:co--on={active === c.nr}
          style="{c.anchor.x != null ? `left:${c.anchor.x}%;` : ''}{c.anchor.y != null ? `top:${c.anchor.y}%;` : ''}"
          onmouseenter={() => (active = c.nr)}
          onmouseleave={() => (active = null)}
        >{c.nr}</span>
      {:else}
        <span
          role="presentation"
          class="co"
          class:co--on={active === c.nr}
          style="--i:{i}"
          onmouseenter={() => (active = c.nr)}
          onmouseleave={() => (active = null)}
        >{c.nr}</span>
      {/if}
    {/each}

    <div class="slot">{@render preview?.()}</div>

    {#if masse}
      {#if masse.hoehe}<div class="dim dim-h" aria-hidden="true"><span class="dl">{masse.hoehe}</span></div>{/if}
      {#if masse.breite}<div class="dim dim-w" aria-hidden="true"><span class="dl">{masse.breite}</span></div>{/if}
      {#if masse.padding}<div class="dim dim-pad" aria-hidden="true"><span class="dl">{masse.padding}</span></div>{/if}
      {#if masse.radius}<div class="rad" aria-hidden="true"><span>r {masse.radius}</span></div>{/if}
    {/if}
  </div>

  {#if variant}
    <div class="strip">{@render variant()}</div>
  {/if}
</div>

{#if cs.length}
  <ol class="legend">
    {#each cs as c}
      <li
        class:on={active === c.nr}
        onmouseenter={() => (active = c.nr)}
        onmouseleave={() => (active = null)}
      >
        <span class="n">{c.nr}</span> {c.text}
      </li>
    {/each}
  </ol>
{/if}

<style>
  .art {
    /* Bewusst FIXE helle Artboard-Palette (kein Theme-Mapping): die Specimen-Farben
       kommen 1:1 aus dem dokumentierten DS und brauchen eine neutrale, helle Fläche —
       wie die Anatomie-Diagramme bei Spectrum/Material. Messfarbe = eigener Kanal,
       damit Maße nie mit Komponentenfarben verwechselt werden. */
    --art: #f6f7f8; /* Artboard-Fläche */
    --measure: #2563c9; /* Maßlinien + Callouts */
    --gl: rgba(0, 0, 0, 0.05); /* Rasterlinien */
    position: relative;
    background: var(--art);
    border: 1px solid var(--ds-border-soft);
    border-radius: var(--ds-radius);
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
    max-width: 100%; /* große Patterns (Teaser, Pager) laufen nicht aus dem Artboard */
    margin: 6px auto 0;
    transform: scale(var(--zoom, 1.3));
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
    font-family: var(--ds-font-mono);
    font-size: 11px;
    font-weight: 600;
    display: flex;
    align-items: center;
    justify-content: center;
    top: -9px;
    cursor: default;
    transition: box-shadow var(--ds-dur) var(--ds-ease);
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
    font-family: var(--ds-font-mono);
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
  .rad { position: absolute; top: -6px; right: -44px; font-family: var(--ds-font-mono); font-size: 11px; color: var(--measure); }
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
    border-top: 1px dashed var(--ds-border-strong);
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
    border-radius: var(--ds-radius-sm);
    font-size: var(--ds-text-sm);
    color: var(--ds-text-body);
    cursor: default;
    transition: background var(--ds-dur) var(--ds-ease);
  }
  .legend li.on {
    background: var(--ds-surface-raised);
  }
  .legend .n {
    flex: none;
    width: 18px;
    height: 18px;
    border-radius: 999px;
    background: var(--ds-text);
    color: var(--ds-surface);
    font-family: var(--ds-font-mono);
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
