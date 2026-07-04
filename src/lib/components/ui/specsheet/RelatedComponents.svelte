<!-- RelatedComponents.svelte — kuratierte Querverweise auf verwandte Komponenten.
     Löst Katalog-Slugs auf (Name + zweck) und rendert sie über die bestehende
     CardGrid (DRY). Unbekannte Slugs werden still übersprungen. -->
<script lang="ts">
  import { CATALOG } from '$data/catalog';
  import { CardGrid } from '$components/ui/card';

  let { slugs = [] }: { slugs?: string[] } = $props();

  /** zweck auf einen knappen Kartentext kürzen (erster Satz, hart gedeckelt). */
  function shorten(text: string | undefined): string {
    if (!text) return '';
    const firstSentence = text.split(/(?<=[.!?])\s/)[0];
    const base = firstSentence.length <= 140 ? firstSentence : text;
    return base.length > 160 ? base.slice(0, 157).trimEnd() + '…' : base;
  }

  const cards = $derived(
    slugs
      .map((slug) => CATALOG.find((e) => e.slug === slug))
      .filter((e): e is NonNullable<typeof e> => Boolean(e))
      .map((e) => ({
        url: `/product/components/${e.slug}`,
        title: e.spec.name ?? e.slug,
        description: shorten(e.spec.zweck)
      }))
  );
</script>

{#if cards.length}
  <CardGrid {cards} />
{/if}
