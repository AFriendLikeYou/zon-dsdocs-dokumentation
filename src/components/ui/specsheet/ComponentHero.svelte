<!--
  ComponentHero.svelte — Seiten-Hero der Component-Doku.
  Nutzt die z-ds-Tokens → passt sich Light/Dark der Doku-Seite an (kein weißes Island).
-->
<script>
  export let spec;
  export let version = '';

  /** @type {Record<string, { label: string; cls: string }>} */
  const STATUS = {
    ready_for_dev: { label: 'Ready for dev', cls: 'ready' },
    completed: { label: 'Completed', cls: 'done' },
    changed: { label: 'Geändert', cls: 'warn' }
  };
  $: status = STATUS[spec.status] ?? { label: spec.status ?? 'unbekannt', cls: 'todo' };
</script>

<div class="hero">
  {#if spec.kategorie}<p class="eyebrow">Komponente · {spec.kategorie}</p>{/if}

  <div class="row">
    <span class="status status--{status.cls}">{status.label}</span>
    {#if version}<span class="meta">{version}</span>{/if}
    {#if spec.aktualisiertAm}<span class="meta">Stand {spec.aktualisiertAm}</span>{/if}
  </div>

  {#if spec.zweck}<p class="zweck">{spec.zweck}</p>{/if}

  {#if spec.figma}
    <a class="figma-cta" href={spec.figma} target="_blank" rel="noreferrer">
      <span>In Figma öffnen</span><span aria-hidden="true">↗</span>
    </a>
  {/if}
</div>

<style>
  .hero {
    --mono: ui-monospace, 'SF Mono', 'JetBrains Mono', Menlo, monospace;
    margin: -0.5rem 0 1.5rem;
  }
  .eyebrow {
    font-family: var(--mono);
    font-size: 11px;
    letter-spacing: 0.12em;
    text-transform: uppercase;
    color: var(--z-ds-color-text-55);
    margin: 0 0 12px;
  }
  .row {
    display: flex;
    align-items: center;
    gap: 10px;
    flex-wrap: wrap;
    margin-bottom: 14px;
  }
  .status {
    font-family: var(--mono);
    font-size: 11px;
    letter-spacing: 0.04em;
    padding: 5px 10px;
    border-radius: 999px;
    white-space: nowrap;
  }
  .status--ready {
    color: var(--z-ds-color-focus-100);
    background: color-mix(in srgb, var(--z-ds-color-focus-100) 12%, transparent);
    box-shadow: inset 0 0 0 1px color-mix(in srgb, var(--z-ds-color-focus-100) 30%, transparent);
  }
  .status--done {
    color: var(--z-ds-color-background-success);
    background: color-mix(in srgb, var(--z-ds-color-background-success) 14%, transparent);
    box-shadow: inset 0 0 0 1px color-mix(in srgb, var(--z-ds-color-background-success) 32%, transparent);
  }
  .status--warn {
    color: var(--z-ds-color-accent-100);
    background: color-mix(in srgb, var(--z-ds-color-accent-100) 12%, transparent);
    box-shadow: inset 0 0 0 1px color-mix(in srgb, var(--z-ds-color-accent-100) 30%, transparent);
  }
  .status--todo {
    color: var(--z-ds-color-text-55);
    background: var(--z-ds-color-background-10);
    box-shadow: inset 0 0 0 1px var(--z-ds-color-border-70);
  }
  .meta {
    font-family: var(--mono);
    font-size: 12px;
    color: var(--z-ds-color-text-55);
  }
  .zweck {
    max-width: 64ch;
    color: var(--z-ds-color-text-100);
    font-size: var(--z-ds-fontsize-18);
    line-height: 1.6;
    margin: 0 0 18px;
  }
  .figma-cta {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    border: 1px solid var(--z-ds-color-border-100);
    border-radius: var(--z-ds-border-radius-8);
    padding: 9px 16px;
    color: var(--z-ds-color-text-100);
    text-decoration: none;
    font-size: var(--z-ds-fontsize-14);
  }
  .figma-cta:hover {
    background: var(--z-ds-color-background-10);
    border-color: var(--z-ds-color-border-hover);
  }
  .figma-cta:focus-visible {
    outline: 2px solid var(--z-ds-color-focus-100);
    outline-offset: 2px;
  }
</style>
