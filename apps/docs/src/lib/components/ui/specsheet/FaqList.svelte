<!--
  FaqList.svelte — die FAQ-Sektion einer Component-Doku: je Eintrag eine Frage als
  Disclosure, die Antwort im Panel.

  Warum ganz am Ende der Seite (Vorbild Untitled UI): das FAQ beantwortet die
  RESTFRAGEN, die nach Playground, Beispielen, Anatomie, Verwendung und Specs übrig
  bleiben. Steht es weiter oben, konkurriert es mit der eigentlichen Dokumentation;
  am Ende ist es der natürliche Anlaufpunkt für „ja, aber wie mache ich …?".

  Fragen sind zugeklappt vorbelegt: eine Liste offener Antworten wäre kein FAQ mehr,
  sondern ein Fließtext-Anhang — der Überblick über die gestellten Fragen ist der
  eigentliche Nutzen. Das Auf-/Zuklappen samt Tastatur- und reduced-motion-Vertrag
  liegt im Atom ui/accordion.

  Rein redaktionell (content.json → `faq`): die Sektion wird auf der generierten
  Seite zur LAUFZEIT gegated (`{#if spec.faq?.length}`), damit nie eine leere
  Überschrift entsteht.
-->
<script lang="ts">
	import { Accordion } from '$components/ui/accordion';
	import type { Faq } from '$types/spec';

	let {
		items = []
	}: {
		/** Die Fragen/Antworten-Paare (spec.faq). */
		items?: Faq[];
	} = $props();
</script>

<div class="faq-list">
	{#each items as item, i (i)}
		<Accordion titel={item.frage}>
			<p class="faq-list__answer">{item.antwort}</p>
		</Accordion>
	{/each}
</div>

<style>
	.faq-list {
		margin-block: var(--z-ds-space-16);
		/* Die Hairline je Eintrag liefert das Accordion; oben eine eigene, damit die
		   Liste als Block gerahmt wirkt statt als angeschnittene Reihe. */
		border-top: 1px solid var(--ds-border-soft);
	}
	.faq-list__answer {
		margin: 0;
	}
</style>
