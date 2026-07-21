<!--
  Accordion.svelte — EIN Disclosure: eine Kopfzeile, die ihren Inhalt auf-/zuklappt.

  Warum als Atom in ui/ und nicht co-located beim FAQ: das Muster liegt im Repo
  bereits fünfmal ad hoc verstreut (ExampleBlock, Playground, MachineZone,
  IssuesList, layout/MenuCollapsible) — jedes Mal derselbe aria-expanded/
  aria-controls-Vertrag, dasselbe grid-template-rows-Klappen, dasselbe
  reduced-motion-Detail. Das FAQ ist der erste Consumer, der es sich NICHT selbst
  baut; hier hat der a11y-Vertrag genau einen Ort. (Repo-Regel: Wiederverwendbares
  wird eine ui/-Komponente, nicht inline dupliziert.)

  A11y-Vertrag:
  - Die Kopfzeile ist ein echter <button type="button"> → Enter/Leertaste und
    Tab-Fokus kommen vom Browser, kein Tastatur-Nachbau.
  - `aria-expanded` am Button, `aria-controls` auf die Panel-id; das Panel trägt
    `inert`, solange es zu ist (kein Fokus in unsichtbaren Inhalt).
  - Die Überschriftsebene ist über `headingLevel` einstellbar, damit das Disclosure
    in der Dokument-Gliederung an der richtigen Stelle hängt (Default h3 — unter
    der h2 einer Doku-Sektion).

  Motion (Emil-Regeln): Auf-/Zuklappen über grid-template-rows (keine
  Höhenmessung), ease-out, unter 300ms; der Chevron dreht mit. Vor dem Mount ist
  die Transition abgeschaltet, damit ein initial offenes Panel nicht sichtbar
  aufklappt. `prefers-reduced-motion` schaltet beides ab.

  Nutzung:
    <Accordion titel="Kann ich den Button als Link verwenden?">
      <p>…</p>
    </Accordion>
-->
<script lang="ts">
	import { onMount, type Snippet } from 'svelte';
	import { ChevronIcon } from '$lib/icons';

	let {
		titel,
		open = $bindable(false),
		headingLevel = 3,
		children
	}: {
		/** Beschriftung der Kopfzeile — die Frage bzw. der Titel des Abschnitts. */
		titel: string;
		/** Offen/zu; bindbar, damit ein Consumer eine Gruppe steuern kann. */
		open?: boolean;
		/** Überschriftsebene der Kopfzeile (2–4) — hält die Dokument-Gliederung intakt. */
		headingLevel?: 2 | 3 | 4;
		/** Inhalt des Panels. */
		children?: Snippet;
	} = $props();

	// Stabile, kollisionsfreie Panel-id für aria-controls.
	const panelId = `accordion-${Math.random().toString(36).slice(2, 8)}`;

	// Motion erst nach dem Mount freigeben (ein initial offenes Panel soll nicht
	// beim Laden aufklappen) — dasselbe Detail wie im ExampleBlock.
	let animated = $state(false);
	onMount(() => {
		requestAnimationFrame(() => (animated = true));
	});
</script>

<div class="accordion" class:is-open={open}>
	<svelte:element this={`h${headingLevel}`} class="accordion__heading">
		<button
			type="button"
			class="accordion__trigger"
			aria-expanded={open}
			aria-controls={panelId}
			onclick={() => (open = !open)}
		>
			<span class="accordion__title">{titel}</span>
			<ChevronIcon
				width={12}
				height={12}
				stroke-width="2.5"
				class="accordion__chevron"
				aria-hidden="true"
			/>
		</button>
	</svelte:element>

	<!-- Klappen über grid-template-rows: das Grid-Item trägt weder Padding noch
	     Rahmen — beides würde seine min-content-Höhe anheben und 0fr undicht machen. -->
	<div class="accordion__panel" class:is-animated={animated}>
		<div id={panelId} class="accordion__clip" inert={!open}>
			<div class="accordion__body">
				{@render children?.()}
			</div>
		</div>
	</div>
</div>

<style>
	.accordion {
		border-bottom: 1px solid var(--ds-border-soft);
	}
	.accordion__heading {
		margin: 0;
		/* Die Größe trägt der Trigger — die Überschrift ist nur die Semantik-Hülle. */
		font-size: inherit;
		font-weight: inherit;
	}
	.accordion__trigger {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: var(--z-ds-space-16);
		width: 100%;
		padding: var(--z-ds-space-16) 0;
		border: none;
		background: none;
		text-align: left;
		cursor: pointer;
		color: var(--ds-text);
		font-family: inherit;
		font-size: var(--ds-text-base);
		font-weight: 600;
		line-height: 1.4;
		transition: color var(--ds-dur) var(--ds-ease-out);
	}
	@media (hover: hover) and (pointer: fine) {
		.accordion__trigger:hover {
			color: var(--ds-accent);
		}
	}
	.accordion__trigger:active {
		/* Kein Scale auf einer vollbreiten Zeile — die Rückmeldung ist die Farbe. */
		color: var(--ds-accent);
	}
	.accordion__trigger:focus-visible {
		outline: 2px solid var(--ds-focus-ring);
		outline-offset: 2px;
		border-radius: var(--ds-radius-sm);
	}
	.accordion__title {
		min-width: 0;
	}
	/* Chevron liegt in einer Kind-Komponente → :global unter dem scoped Trigger. */
	.accordion__trigger :global(.accordion__chevron) {
		flex: none;
		color: var(--ds-text-muted);
		transform: rotate(0deg);
		transition: transform var(--ds-dur) var(--ds-ease-out);
	}
	.accordion.is-open .accordion__trigger :global(.accordion__chevron) {
		transform: rotate(180deg);
	}

	.accordion__panel {
		display: grid;
		grid-template-rows: 0fr;
		transition: none;
	}
	.accordion__panel.is-animated {
		transition: grid-template-rows var(--ds-dur-slow) var(--ds-ease-out);
	}
	.accordion.is-open .accordion__panel {
		grid-template-rows: 1fr;
	}
	.accordion__clip {
		overflow: hidden;
		min-height: 0;
	}
	.accordion__body {
		padding-bottom: var(--z-ds-space-16);
		max-width: 68ch;
		font-size: var(--ds-text-sm);
		line-height: 1.6;
		color: var(--ds-text-body);
	}

	@media (prefers-reduced-motion: reduce) {
		.accordion__panel,
		.accordion__trigger,
		.accordion__trigger :global(.accordion__chevron) {
			transition: none;
		}
	}
</style>
