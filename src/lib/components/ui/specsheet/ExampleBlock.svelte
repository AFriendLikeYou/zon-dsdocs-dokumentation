<!--
  ExampleBlock.svelte — ein BENANNTES Beispiel: Bühne mit den Instanzen, darunter
  Titel + Erklärsatz und der einklappbare Code.

  Warum es den Playground nicht ersetzt, sondern ihm vorangeht: ein Playground
  dokumentiert OPTIONEN („welche Regler gibt es?"), ein Beispiel dokumentiert
  ABSICHT („wann nehme ich Primary?"). Deshalb stehen die Beispiele als erste
  Sektion des Design-Tabs — sie erklären, der Playground lässt ausprobieren.

  Die `instanzen` kommen als FERTIGES Markup herein: die generierte Seite
  instanziiert `render.template` je Control-Wert-Satz über dasselbe
  `instantiate()` wie der Playground (kein zweiter Render-Pfad). Damit speist EINE
  Instanziierung Vorschau UND Code-Block — der gezeigte Code ist exakt das, was
  auf der Bühne steht.

  Die Bühne trägt `spec-canvas ds-stage` wie SpecimenGrid: `.spec-canvas` ist der
  globale Scoping-Anker, den der Exporter in jede generierte Seite präfixt
  (`:global(.spec-canvas .z-…)`), `.ds-stage` pinnt die RAW --z-ds-*-Token auf
  Light — das Specimen bleibt so auch auf dunklen Doku-Seiten in seiner
  Light-Fassung (Audit-Befund, gleiche Entscheidung wie im SpecimenGrid).

  Der Code-Umschalter ist bewusst das Muster aus ui/playground: Klick-/Tastatur-
  Toggle (aria-expanded + aria-controls, KEIN Hover-Reveal — auf Touch nicht
  bedienbar), Auf-/Zuklappen über grid-template-rows, Motion erst nach dem Mount
  freigegeben. Kein eigenes Copy-/Collapse-Muster: das Kopieren und die
  Zeilennummern liefert ui/code-block.

  `instanzen` ist vertrauenswürdig (Repo-Registry-Daten, vom Exporter erzeugtes
  Template) — daher {@html} mit derselben Ausnahme wie Playground/SpecimenGrid.

  Nicht zu verwechseln mit `ui/example-stage`: das ist die gerahmte Demo-Fläche für
  HANDGESCHRIEBENE Prosa-Seiten (title/caption, Snippet-Inhalt, kein Code-Block).
  ExampleBlock rendert dagegen Registry-Instanzen samt zugehörigem Snippet.
-->
<script lang="ts">
	import { onMount } from 'svelte';
	import { Button } from '$components/ui/button';
	import { CodeBlock } from '$components/ui/code-block';
	import { ChevronIcon } from '$lib/icons';

	let {
		titel,
		beschreibung = '',
		instanzen = [],
		lang = 'html',
		codePersistKey = 'example-block:code'
	}: {
		/** Überschrift des Beispiels, z. B. „Semantik". */
		titel: string;
		/** Ein bis zwei erklärende Sätze unter dem Titel. */
		beschreibung?: string;
		/** Fertig instanziiertes Markup je gezeigter Instanz (aus `instantiate()`). */
		instanzen?: string[];
		/** Sprache für die Syntax-Hervorhebung des Code-Blocks. */
		lang?: 'html' | 'css' | 'svelte';
		/** sessionStorage-Schlüssel für „Code offen/zu"; Default: ein Schlüssel für alle Beispiele. */
		codePersistKey?: string;
	} = $props();

	// Der Code ist exakt die Summe der gezeigten Instanzen — eine Quelle, kein Drift.
	const code = $derived(instanzen.join('\n'));

	// Startet zu und bleibt beim SSR deterministisch zu; erst nach dem Mount wird der
	// Sitzungs-Zustand nachgezogen. `animated` gibt die Motion erst danach frei — sonst
	// klappt der wiederhergestellte Code beim Laden sichtbar auf (Muster: Playground).
	let codeOpen = $state(false);
	let animated = $state(false);
	const codeId = `example-code-${Math.random().toString(36).slice(2, 8)}`;

	onMount(() => {
		try {
			const saved = sessionStorage.getItem(codePersistKey);
			if (saved === '1' || saved === '0') codeOpen = saved === '1';
		} catch {
			/* sessionStorage nicht verfügbar → eingeklappter Default bleibt */
		}
		requestAnimationFrame(() => (animated = true));
	});

	function toggleCode() {
		codeOpen = !codeOpen;
		try {
			sessionStorage.setItem(codePersistKey, codeOpen ? '1' : '0');
		} catch {
			/* ignorieren — Persistenz ist nice-to-have */
		}
	}
</script>

<section class="example-block">
	<div class="example-block__stage spec-canvas ds-stage">
		{#each instanzen as instanz, i (i)}
			<!-- eslint-disable-next-line svelte/no-at-html-tags -->
			<div class="example-block__instance">{@html instanz}</div>
		{/each}
	</div>

	<div class="example-block__body">
		<div class="example-block__text">
			<h3 class="example-block__title">{titel}</h3>
			{#if beschreibung}<p class="example-block__description">{beschreibung}</p>{/if}
		</div>
		<Button
			variant="quiet"
			size="sm"
			class="example-block__code-toggle"
			onclick={toggleCode}
			aria-expanded={codeOpen}
			aria-controls={codeId}
		>
			{#snippet iconLeft()}
				<ChevronIcon
					width={10}
					height={10}
					stroke-width="2.5"
					class="example-block__chevron {codeOpen ? 'is-open' : ''}"
				/>
			{/snippet}
			{codeOpen ? 'Code ausblenden' : 'Code'}
		</Button>
	</div>

	<!-- Auf-/Zuklappen über grid-template-rows (keine Höhenmessung). Das Grid-Item
	     trägt weder Padding noch Rahmen — beides würde seine min-content-Höhe anheben
	     und die 0fr-Einklappung undicht machen. -->
	<div class="example-block__code" class:is-open={codeOpen} class:is-animated={animated}>
		<div id={codeId} class="example-block__code-clip" inert={!codeOpen}>
			<CodeBlock {code} {lang} />
		</div>
	</div>
</section>

<style>
	.example-block {
		border: 1px solid var(--ds-border-soft);
		border-radius: var(--ds-radius);
		overflow: hidden;
		background: var(--ds-surface);
		margin-block: var(--z-ds-space-16);
	}
	/* Bühne: gepinnt helle Artboard-Fläche (RAW-Token über .ds-stage), Instanzen
	   nebeneinander mit Umbruch — mehrere Buttons einer „Semantik"-Reihe lesen sich
	   so als Gruppe statt als Liste. */
	.example-block__stage {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: var(--z-ds-space-12);
		padding: var(--z-ds-space-32) var(--z-ds-space-24);
		min-height: 120px;
		background-color: var(--z-ds-color-background-0);
		border-bottom: 1px solid var(--ds-border-soft);
	}
	/* Instanz-Wrapper: nötig, damit fullwidth-Specimens (width:100%) die Zeile für
	   sich beanspruchen können, statt in der Flex-Reihe zu kollabieren. */
	.example-block__instance {
		display: flex;
		min-width: 0;
		max-width: 100%;
		flex: 0 1 auto;
	}
	.example-block__instance:only-child {
		flex: 1 1 auto;
	}

	/* Text + Code-Umschalter in EINER Zeile: der Titel trägt die Betonung, der
	   Umschalter sitzt rechtsbündig auf gleicher Höhe. */
	.example-block__body {
		display: flex;
		align-items: flex-start;
		gap: var(--z-ds-space-12);
		padding: var(--z-ds-space-12) var(--z-ds-space-16);
	}
	.example-block__text {
		flex: 1;
		min-width: 0;
	}
	.example-block__title {
		margin: 0;
		font-size: var(--ds-text-base);
		font-weight: 600;
		color: var(--ds-text);
	}
	.example-block__description {
		margin: var(--z-ds-space-4) 0 0;
		font-size: var(--ds-text-sm);
		line-height: 1.5;
		color: var(--ds-text-body);
	}
	.example-block__body :global(.example-block__code-toggle) {
		flex: none;
	}
	/* Chevron liegt in einer Kind-Komponente unter dem Button-Atom → :global. */
	.example-block__body :global(.example-block__chevron) {
		transform: rotate(0deg);
		transition: transform var(--ds-dur) var(--ds-ease-out);
	}
	.example-block__body :global(.example-block__chevron.is-open) {
		transform: rotate(180deg);
	}

	.example-block__code {
		display: grid;
		grid-template-rows: 0fr;
		transition: none;
	}
	.example-block__code.is-animated {
		transition: grid-template-rows var(--ds-dur-slow) var(--ds-ease-out);
	}
	.example-block__code.is-open {
		grid-template-rows: 1fr;
	}
	.example-block__code-clip {
		overflow: hidden;
		min-height: 0;
	}
	@media (prefers-reduced-motion: reduce) {
		.example-block__code,
		.example-block__body :global(.example-block__chevron) {
			transition: none;
		}
	}
</style>
