<!-- MeasureTable.svelte — Maße als native, adaptive Tabelle (Specs-Tab). -->
<script lang="ts">
  import type { Masse, MasseValue } from '$types/spec';
  let { masse = null }: { masse?: Masse | null } = $props();

  // Werte können string (nur px) ODER { px, token, herkunft } sein → beides unterstützen.
  const px = (m?: MasseValue) => (m == null ? '' : typeof m === 'string' ? m : m.px);
  const tok = (m?: MasseValue) => (m && typeof m !== 'string' ? m.token : undefined);
  // Provenance-Badge nur bei Abweichung (gemessen = Normalfall, kein Badge).
  const HERKUNFT_LABEL: Record<string, string> = {
    abgeleitet: '≈ abgeleitet',
    geschätzt: '≈ geschätzt'
  };
  const herk = (m?: MasseValue) =>
    m && typeof m !== 'string' && m.herkunft ? HERKUNFT_LABEL[m.herkunft] : undefined;
</script>

{#if masse}
  <div class="m-wrap">
    <table class="m">
      <tbody>
        {#if masse.hoehe}<tr><th>Höhe</th><td>{px(masse.hoehe)} px{#if herk(masse.hoehe)}<span class="herk">{herk(masse.hoehe)}</span>{/if}{#if tok(masse.hoehe)}<span class="tok">{tok(masse.hoehe)}</span>{/if}</td></tr>{/if}
        {#if masse.breite}<tr><th>Breite</th><td>{px(masse.breite)} px{#if herk(masse.breite)}<span class="herk">{herk(masse.breite)}</span>{/if}{#if tok(masse.breite)}<span class="tok">{tok(masse.breite)}</span>{/if}</td></tr>{/if}
        {#if masse.padding}<tr><th>Padding</th><td>{px(masse.padding)}{#if herk(masse.padding)}<span class="herk">{herk(masse.padding)}</span>{/if}{#if tok(masse.padding)}<span class="tok">{tok(masse.padding)}</span>{/if}</td></tr>{/if}
        {#if masse.radius}<tr><th>Radius</th><td>{px(masse.radius)} px{#if herk(masse.radius)}<span class="herk">{herk(masse.radius)}</span>{/if}{#if tok(masse.radius)}<span class="tok">{tok(masse.radius)}</span>{/if}</td></tr>{/if}
      </tbody>
    </table>
  </div>
{/if}

<style>
  /* Schmale Viewports: Tabelle scrollt im eigenen Container statt die Seite zu schieben. */
  .m-wrap {
    overflow-x: auto;
    max-width: 100%;
    margin: 0 0 1em;
  }
  .m {
    border-collapse: collapse;
    min-width: 260px;
  }
  .m th {
    text-align: left;
    font-weight: 400;
    color: var(--ds-text-muted);
    padding: 9px 40px 9px 0;
    border-bottom: 1px solid var(--ds-border);
    font-size: var(--ds-text-sm);
  }
  .m td {
    text-align: right;
    font-family: var(--ds-font-mono);
    padding: 9px 0; /* bewusstes Zell-Padding ohne passendes z-ds-Token */
    border-bottom: 1px solid var(--ds-border);
    font-size: var(--ds-text-sm);
  }
  .tok {
    display: block;
    color: var(--ds-text-muted);
    font-size: var(--ds-text-xs);
  }
  /* Provenance-Badge (nur bei Abweichung: ≈ abgeleitet / ≈ geschätzt). */
  .herk {
    display: block;
    color: var(--ds-text-faint);
    font-size: var(--ds-text-xs);
  }
</style>
