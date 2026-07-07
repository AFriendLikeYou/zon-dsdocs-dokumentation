<!--
  RadiusScale.svelte — Radius-Skala mit gerundeten Swatches.
  Jeder Swatch rendert border-radius: var(--token) — die Ecke IST der Wert.
  Numerischer Wert live aus dem Stylesheet (kein Drift zum DS-Paket).
-->
<script lang="ts">
  import { CopyButton } from "$components/ui/copy-button";

  let { items = [] }: { items?: { token: string; usage?: string }[] } =
    $props();

  let vals = $state<Record<string, string>>({});
  $effect(() => {
    const root = getComputedStyle(document.documentElement);
    const m: Record<string, string> = {};
    for (const it of items)
      m[it.token] = root.getPropertyValue(it.token).trim();
    vals = m;
  });

  function label(v: string): string {
    if (!v) return "";
    if (v.endsWith("rem")) return `${Math.round(parseFloat(v) * 16)} px · ${v}`;
    if (v.endsWith("px")) return `${parseFloat(v)} px`;
    return v;
  }
</script>

<ul class="rad">
  {#each items as it (it.token)}
    <li class="card">
      <div class="swatch" style="border-radius: var({it.token})"></div>
      <div class="meta">
        <span class="name-line">
          <code class="name">{it.token}</code>
          <CopyButton
            value={it.token}
            ariaLabel={`Token ${it.token} kopieren`}
            class="rad-copy"
          />
        </span>
        <span class="val-line">
          <span class="val">{label(vals[it.token] ?? "")}</span>
          {#if vals[it.token]}
            <CopyButton
              value={vals[it.token]}
              ariaLabel={`Wert ${vals[it.token]} von ${it.token} kopieren`}
              class="rad-copy"
            />
          {/if}
        </span>
        {#if it.usage}<span class="use">{it.usage}</span>{/if}
      </div>
    </li>
  {/each}
</ul>

<style>
  .rad {
    list-style: none;
    margin: 0;
    padding: 0;
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
    gap: var(--z-ds-space-16);
  }
  .card {
    display: flex;
    flex-direction: column;
    gap: var(--z-ds-space-12);
  }
  .swatch {
    width: 100%;
    height: 88px;
    background: var(--ds-surface-raised);
    border: 1px solid var(--ds-border);
    /* Nur die obere linke Ecke betonen, damit der Radius klar ablesbar ist. */
    border-top-left-radius: 0;
    border-bottom-right-radius: 0;
  }
  .meta {
    display: flex;
    flex-direction: column;
    gap: 2px;
  }
  .name-line,
  .val-line {
    display: inline-flex;
    align-items: center;
    gap: var(--z-ds-space-8);
  }
  .name {
    font-family: var(--ds-font-mono);
    font-size: var(--ds-text-xs);
    color: var(--ds-text);
  }
  .val {
    font-family: var(--ds-font-mono);
    font-size: var(--ds-text-xs);
    color: var(--ds-text-muted);
  }
  .use {
    font-size: var(--ds-text-sm);
    color: var(--ds-text-body);
    margin-top: 2px;
  }
  /* :global, weil die Klasse auf dem <button> der CopyButton-Komponente landet. */
  :global(.rad-copy) {
    --copy-icon-size: 13px;
    color: var(--ds-text-faint);
  }
  @media (hover: hover) and (pointer: fine) {
    :global(.rad-copy:hover) {
      color: var(--ds-text);
    }
  }
</style>
