<!--
  Startseiten-Editor — FORMULAR, kein Block-Editor.

  Die Landing ist eine komponierte Seite: Hero-Bühne, Verlauf und scroll-getriebene
  Animation sind Gestaltung, nicht Inhalt. Der Prosa-/Block-Editor würde daraus
  einen einzigen schreibgeschützten Riesenblock machen. Darum hier das Muster des
  Spec-Editors (/admin/product/components/[slug]): feste Felder, Save-Bar (ui/dialog,
  ⌘S), Validierung vor dem Speichern, byte-stabiles Schreiben.

  Alles, was NICHT in diesem Formular steht, ist bewusst im Code geblieben:
  Bühnen-Markup und Animation, das CSS, die `?raw`-Pattern-CSS-Importe der
  Welten-Vorschau, der Changelog-Zugriff, die Link-Ziele und die Komponenten-Zahl
  aus dem Katalog.
-->
<script lang="ts">
	import { untrack } from 'svelte';
	import { enhance } from '$app/forms';
	import type { SubmitFunction } from '@sveltejs/kit';
	import { getToastState } from '$stores/toast-state.svelte';
	import { AdminPageHeader } from '../ui';
	import { Field } from '$components/ui/field';
	import { Badge } from '$components/ui/badge';
	import { Dialog } from '$components/ui/dialog';
	import { Banner } from '$components/ui/banner';
	import TextListField from './TextListField.svelte';
	import {
		LIMITS,
		normalizeLandingContent,
		serializeLandingContent,
		validateLandingContent
	} from './landing-content';
	import type { LandingContent } from '$types/landing';

	let { data }: import('./$types').PageProps = $props();
	const toast = getToastState();

	// Fabrik → „Verwerfen" stellt exakt den geladenen Stand wieder her.
	// `normalizeLandingContent` ist zugleich die Tiefkopie: es baut das Modell aus
	// Primitiven neu auf und löst damit den $props-Proxy auf (structuredClone
	// scheitert an Proxies).
	function makeState(): LandingContent {
		return normalizeLandingContent(data.content);
	}
	let model = $state(makeState());

	// Payload = die kanonische Serialisierung. Damit ist der Dirty-Vergleich exakt
	// der Vergleich der späteren DATEI-Bytes: ein Rundlauf ohne echte Änderung
	// erzeugt keinen „ungespeichert"-Zustand und keinen Diff.
	const payload = $derived(serializeLandingContent(model));
	let savedPayload = $state(untrack(() => serializeLandingContent(makeState())));
	const dirty = $derived(payload !== savedPayload);

	const issues = $derived(validateLandingContent(model));
	const issueFor = $derived(new Map(issues.map((i) => [i.feld, i.text])));

	let formEl = $state<HTMLFormElement | null>(null);

	function discard() {
		model = makeState();
	}

	const handleSubmit: SubmitFunction = () => {
		return async ({ result, update }) => {
			await update({ reset: false });
			if (result.type === 'success') {
				toast?.add('Gespeichert', 'Die Startseite zeigt die Änderung nach dem Reload.');
				savedPayload = payload;
			} else if (result.type === 'failure') {
				const msg = (result.data as { message?: string } | undefined)?.message;
				toast?.add('Nicht gespeichert', msg ?? 'Unbekannter Fehler.');
			} else if (result.type === 'error') {
				toast?.add('Fehler', result.error?.message ?? 'Speichern fehlgeschlagen.');
			}
		};
	};

	function onBeforeUnload(e: BeforeUnloadEvent) {
		if (dirty) e.preventDefault();
	}
</script>

<svelte:head><title>Startseite — Editor</title></svelte:head>
<svelte:window onbeforeunload={onBeforeUnload} />

<!-- Ein beschriftetes Feld mit Längen-Zähler und Fehlerhinweis.
     `ariaLabel` trennt den SICHTBAREN Titel vom programmatischen Namen: die beiden
     Welten-Karten tragen beide „Titel"/„Beschreibung"/„CTA" — visuell eindeutig durch
     die Karten-Überschrift, für Screenreader aber erst durch den Präfix. -->
{#snippet zeile(
	label: string,
	feld: string,
	max: number,
	get: () => string,
	set: (v: string) => void,
	hilfe?: string,
	ariaLabel?: string
)}
	{@const wert = get()}
	{@const fehler = issueFor.get(feld)}
	<div class="feld">
		<div class="feld__kopf">
			<span class="feld__label">{label}</span>
			<span class="feld__zaehler" class:feld__zaehler--over={wert.length > max}>
				{wert.length}/{max}
			</span>
		</div>
		<Field
			density="compact"
			value={wert}
			oninput={(e) => set((e.currentTarget as HTMLInputElement).value)}
			aria-label={ariaLabel ?? label}
			error={Boolean(fehler)}
		/>
		{#if fehler}
			<p class="feld__fehler">{fehler}</p>
		{:else if hilfe}
			<p class="feld__hilfe">{hilfe}</p>
		{/if}
	</div>
{/snippet}

{#snippet mehrzeilig(
	label: string,
	feld: string,
	max: number,
	get: () => string,
	set: (v: string) => void,
	hilfe?: string,
	ariaLabel?: string
)}
	{@const wert = get()}
	{@const fehler = issueFor.get(feld)}
	<div class="feld">
		<div class="feld__kopf">
			<span class="feld__label">{label}</span>
			<span class="feld__zaehler" class:feld__zaehler--over={wert.length > max}>
				{wert.length}/{max}
			</span>
		</div>
		<Field
			density="compact"
			multiline
			rows={3}
			value={wert}
			oninput={(e) => set((e.currentTarget as HTMLTextAreaElement).value)}
			aria-label={ariaLabel ?? label}
			error={Boolean(fehler)}
		/>
		{#if fehler}
			<p class="feld__fehler">{fehler}</p>
		{:else if hilfe}
			<p class="feld__hilfe">{hilfe}</p>
		{/if}
	</div>
{/snippet}

<div class="start-edit">
	<AdminPageHeader title="Startseite" crumb={{ href: '/admin', label: 'Alle Inhalte' }}>
		{#snippet actions()}
			<a class="view" href={data.viewHref} target="_blank" rel="noreferrer">Ansehen&nbsp;↗</a>
		{/snippet}
		Die redaktionellen Texte der Startseite — Hero, die beiden Welten-Karten und „Was ist neu". Sie
		liegen in <code>src/routes/landing.content.json</code>. Gestaltung (Bühne, Animation, Layout),
		Link-Ziele und die Komponenten-Zahl aus dem Katalog bleiben bewusst im Code.
	</AdminPageHeader>

	{#if !data.writable}
		<Banner variant="warning" role="status" title="Nur lesbar">
			Schreiben ist nur im Dev-Modus möglich; in der Produktion öffnet der Editor später einen
			GitHub-PR.
		</Banner>
	{/if}

	<form method="POST" bind:this={formEl} use:enhance={handleSubmit}>
		<input type="hidden" name="payload" value={payload} />

		<section class="karte">
			<h2 class="karte__titel">Seite</h2>
			{@render zeile(
				'Seitentitel',
				'seitentitel',
				LIMITS.seitentitel,
				() => model.seitentitel,
				(v) => (model.seitentitel = v),
				'Steht im Browser-Tab und in Suchergebnissen.'
			)}
		</section>

		<section class="karte">
			<h2 class="karte__titel">Hero</h2>
			<p class="karte__subline">Das Band ganz oben — über der Bühnen-Grafik.</p>

			{@render zeile(
				'Eyebrow',
				'hero.eyebrow',
				LIMITS.eyebrow,
				() => model.hero.eyebrow,
				(v) => (model.hero.eyebrow = v)
			)}

			<div class="feld">
				<div class="feld__kopf">
					<span class="feld__label">Überschrift</span>
					<span class="feld__zaehler">{model.hero.ueberschriftZeilen.length} Zeilen</span>
				</div>
				<TextListField
					list={model.hero.ueberschriftZeilen}
					itemLabel="Überschrift-Zeile"
					addLabel="+ Zeile"
					placeholder="Zeile der Überschrift"
					maxLength={LIMITS.ueberschriftZeile}
				/>
				{#if issueFor.get('hero.ueberschriftZeilen')}
					<p class="feld__fehler">{issueFor.get('hero.ueberschriftZeilen')}</p>
				{:else}
					<p class="feld__hilfe">
						Eine Zeile je Eintrag — der Umbruch der H1 ist redaktionell gesetzt (max. {LIMITS.ueberschriftZeile}
						Zeichen je Zeile).
					</p>
				{/if}
			</div>

			{@render mehrzeilig(
				'Lead',
				'hero.lead',
				LIMITS.lead,
				() => model.hero.lead,
				(v) => (model.hero.lead = v),
				'Ein Satz unter der Überschrift; die Textspalte ist auf ~42 Zeichen Breite gestaltet.'
			)}

			<div class="paar">
				{@render zeile(
					'CTA primär (→ /product)',
					'hero.primaerCta',
					LIMITS.cta,
					() => model.hero.primaerCta,
					(v) => (model.hero.primaerCta = v)
				)}
				{@render zeile(
					'CTA sekundär (→ /brand)',
					'hero.sekundaerCta',
					LIMITS.cta,
					() => model.hero.sekundaerCta,
					(v) => (model.hero.sekundaerCta = v)
				)}
			</div>

			{@render zeile(
				'Label der Komponenten-Zahl',
				'hero.komponentenLabel',
				LIMITS.komponentenLabel,
				() => model.hero.komponentenLabel,
				(v) => (model.hero.komponentenLabel = v),
				'Die Zahl selbst kommt aus dem Katalog und ist nicht editierbar.'
			)}

			<div class="feld">
				<div class="feld__kopf">
					<span class="feld__label">Weitere Stichworte</span>
					<span class="feld__zaehler">{model.hero.fakten.length}</span>
				</div>
				<TextListField
					list={model.hero.fakten}
					itemLabel="Stichwort"
					addLabel="+ Stichwort"
					placeholder="z. B. Light &amp; Dark"
					maxLength={LIMITS.fakt}
				/>
				<p class="feld__hilfe">Stehen in der Stats-Zeile hinter der Komponenten-Zahl.</p>
			</div>
		</section>

		<section class="karte">
			<h2 class="karte__titel">Welten-Karten</h2>
			<p class="karte__subline">
				Die beiden Einstiege unter dem Hero. Bild bzw. Live-Vorschau der Karten sind Gestaltung und
				bleiben im Code.
			</p>

			<div class="paar">
				<div class="welt">
					<span class="welt__eyebrow">Brandhub <Badge tone="ghost">/brand</Badge></span>
					{@render zeile(
						'Titel',
						'welten.brandhub.titel',
						LIMITS.weltTitel,
						() => model.welten.brandhub.titel,
						(v) => (model.welten.brandhub.titel = v),
						undefined,
						'Brandhub — Titel'
					)}
					{@render mehrzeilig(
						'Beschreibung',
						'welten.brandhub.beschreibung',
						LIMITS.weltBeschreibung,
						() => model.welten.brandhub.beschreibung,
						(v) => (model.welten.brandhub.beschreibung = v),
						undefined,
						'Brandhub — Beschreibung'
					)}
					{@render zeile(
						'CTA',
						'welten.brandhub.cta',
						LIMITS.cta,
						() => model.welten.brandhub.cta,
						(v) => (model.welten.brandhub.cta = v),
						undefined,
						'Brandhub — CTA'
					)}
				</div>

				<div class="welt">
					<span class="welt__eyebrow">Design-System <Badge tone="ghost">/product</Badge></span>
					{@render zeile(
						'Titel',
						'welten.designSystem.titel',
						LIMITS.weltTitel,
						() => model.welten.designSystem.titel,
						(v) => (model.welten.designSystem.titel = v),
						undefined,
						'Design-System — Titel'
					)}
					{@render mehrzeilig(
						'Beschreibung',
						'welten.designSystem.beschreibung',
						LIMITS.weltBeschreibung,
						() => model.welten.designSystem.beschreibung,
						(v) => (model.welten.designSystem.beschreibung = v),
						undefined,
						'Design-System — Beschreibung'
					)}
					{@render zeile(
						'CTA',
						'welten.designSystem.cta',
						LIMITS.cta,
						() => model.welten.designSystem.cta,
						(v) => (model.welten.designSystem.cta = v),
						undefined,
						'Design-System — CTA'
					)}
				</div>
			</div>
		</section>

		<section class="karte">
			<h2 class="karte__titel">Was ist neu</h2>
			<p class="karte__subline">
				Die Einträge selbst kommen aus dem Changelog (<code>$data/changelog</code>) — hier stehen nur
				die Rahmen-Texte.
			</p>
			{@render zeile(
				'Überschrift',
				'wasIstNeu.titel',
				LIMITS.wasIstNeuTitel,
				() => model.wasIstNeu.titel,
				(v) => (model.wasIstNeu.titel = v)
			)}
			<div class="paar">
				{@render zeile(
					'Link auf das Changelog',
					'wasIstNeu.alleAenderungen',
					LIMITS.alleAenderungen,
					() => model.wasIstNeu.alleAenderungen,
					(v) => (model.wasIstNeu.alleAenderungen = v)
				)}
				{@render zeile(
					'Vorspann der Datumszeile',
					'wasIstNeu.standPrefix',
					LIMITS.standPrefix,
					() => model.wasIstNeu.standPrefix,
					(v) => (model.wasIstNeu.standPrefix = v),
					'Ergibt z. B. „Stand 2026-07-20".'
				)}
			</div>
		</section>

		<Dialog
			open={dirty}
			message="Ungespeicherte Änderungen"
			primaryDisabled={!data.writable || issues.length > 0}
			primaryTitle={issues.length > 0 ? 'Erst die Fehler beheben' : undefined}
			onprimary={() => formEl?.requestSubmit()}
			onsecondary={discard}
			shortcut="cmd+s"
		>
			{#snippet extra()}
				{#if issues.length > 0}
					<Badge tone="warn">{issues.length} zu prüfen</Badge>
				{/if}
			{/snippet}
		</Dialog>
	</form>
</div>

<style>
	.start-edit {
		max-width: var(--ds-container-admin);
		margin: 0 auto;
		padding: var(--z-ds-space-l) var(--z-ds-space-l) 7rem;
	}
	.view {
		font-size: var(--ds-text-sm);
		color: var(--ds-text-muted);
		text-decoration: none;
		white-space: nowrap;
	}
	.view:hover {
		color: var(--ds-text);
	}
	.view:focus-visible {
		outline: 2px solid var(--ds-focus-ring);
		outline-offset: 2px;
	}

	.karte {
		border: 1px solid var(--ds-border-soft);
		border-radius: var(--ds-radius);
		background: var(--ds-surface-raised);
		padding: var(--z-ds-space-l);
		margin-bottom: var(--z-ds-space-l);
		display: grid;
		gap: var(--z-ds-space-m);
	}
	.karte__titel {
		font-size: var(--ds-text-base);
		margin: 0;
	}
	.karte__subline {
		font-size: var(--ds-text-xs);
		color: var(--ds-text-muted);
		margin: calc(-1 * var(--z-ds-space-8)) 0 0;
	}
	.karte__subline code {
		font-family: var(--ds-font-mono);
	}

	.paar {
		display: grid;
		grid-template-columns: 1fr;
		gap: var(--z-ds-space-m);
	}
	@media (min-width: 720px) {
		.paar {
			grid-template-columns: 1fr 1fr;
		}
	}

	.welt {
		display: grid;
		gap: var(--z-ds-space-m);
		align-content: start;
	}
	.welt__eyebrow {
		display: inline-flex;
		align-items: center;
		gap: var(--z-ds-space-6);
		font-size: var(--ds-label-size, var(--ds-text-xs));
		text-transform: uppercase;
		letter-spacing: var(--ds-label-tracking);
		font-weight: 700;
		color: var(--ds-text-muted);
	}

	.feld {
		display: grid;
		gap: var(--z-ds-space-6);
	}
	.feld__kopf {
		display: flex;
		align-items: baseline;
		justify-content: space-between;
		gap: var(--z-ds-space-s);
	}
	.feld__label {
		font-size: var(--ds-text-sm);
		font-weight: 600;
		color: var(--ds-text);
	}
	.feld__zaehler {
		font-size: var(--ds-text-xs);
		color: var(--ds-text-faint);
		font-variant-numeric: tabular-nums;
	}
	.feld__zaehler--over {
		color: var(--ds-negative, var(--ds-text));
		font-weight: 600;
	}
	.feld__hilfe {
		margin: 0;
		font-size: var(--ds-text-xs);
		color: var(--ds-text-muted);
	}
	.feld__fehler {
		margin: 0;
		font-size: var(--ds-text-xs);
		color: var(--ds-negative, var(--ds-text));
	}
</style>
