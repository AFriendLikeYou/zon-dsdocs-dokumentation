<!--
  Badge.svelte — wiederverwendbares Status-/Label-Pill (adaptiv über z-ds-Tokens).
  Konsolidiert die zuvor inline gepflegten Pills (ComponentHero-Status, Card, Nav).
  Nutzung: <Badge variant="ready">Ready for dev</Badge>
-->
<script>
  /** @type {'neutral' | 'ready' | 'done' | 'warn' | 'accent'} */
  export let variant = 'neutral';
</script>

<span class="badge badge--{variant}"><slot /></span>

<style>
  /*
    Text = text-100 (adaptiv, hoher Kontrast) → erfüllt WCAG AA in Light + Dark.
    Die Semantik trägt der farbige Tint + Ring + Dot, nicht die Textfarbe
    (gefärbter Text auf 12%-Tint fiel sonst durch den Kontrast-Check).
  */
  .badge {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    line-height: 1;
    white-space: nowrap;
    font-size: var(--z-ds-fontsize-12);
    font-weight: 500;
    letter-spacing: 0.01em;
    padding: 4px 10px;
    border-radius: 999px;
    color: var(--z-ds-color-text-100);
  }
  .badge::before {
    content: '';
    width: 6px;
    height: 6px;
    border-radius: 999px;
    background: currentColor;
    opacity: 0.55;
  }
  .badge--neutral {
    background: var(--z-ds-color-background-10);
    box-shadow: inset 0 0 0 1px var(--ds-border-soft);
  }
  .badge--neutral::before {
    background: var(--z-ds-color-text-40);
  }
  .badge--ready {
    background: color-mix(in srgb, var(--z-ds-color-focus-100) 14%, transparent);
    box-shadow: inset 0 0 0 1px color-mix(in srgb, var(--z-ds-color-focus-100) 32%, transparent);
  }
  .badge--ready::before {
    background: var(--z-ds-color-focus-100);
    opacity: 1;
  }
  .badge--done {
    background: color-mix(in srgb, var(--z-ds-color-background-success) 16%, transparent);
    box-shadow: inset 0 0 0 1px color-mix(in srgb, var(--z-ds-color-background-success) 34%, transparent);
  }
  .badge--done::before {
    background: var(--z-ds-color-background-success);
    opacity: 1;
  }
  .badge--warn,
  .badge--accent {
    background: color-mix(in srgb, var(--z-ds-color-accent-100) 14%, transparent);
    box-shadow: inset 0 0 0 1px color-mix(in srgb, var(--z-ds-color-accent-100) 32%, transparent);
  }
  .badge--warn::before,
  .badge--accent::before {
    background: var(--z-ds-color-accent-100);
    opacity: 1;
  }
</style>
