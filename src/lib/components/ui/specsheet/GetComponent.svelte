<!--
  GetComponent.svelte — Bezugs-Sektion „Komponente holen": der Weg von der Doku in
  ein echtes Projekt (Vorbild: der Installations-Block von Untitled UI, dort direkt
  unter dem Seitenkopf).

  PLATZIERUNG: erste Sektion des DEVELOP-Tabs, nicht unter dem Hero. Unsere Seiten
  bedienen Designer UND Entwickler, und der Design-Tab ist der erste — ein
  Terminal-Befehl als erstes Element der Seite würde die Hälfte des Publikums
  adressieren, für die er nichts bedeutet. Untitled UI kann sich das leisten, weil
  dort die ganze Seite entwicklergerichtet ist. Der Develop-Tab ist der Ort, an dem
  Entwickler nach Code suchen; die Sektion steht dort VOR den Code-Blöcken (erst
  holen, dann lesen). Als Schnellweg bleibt der kleine `zds add`-Chip im
  ComponentHero — er macht die CLI auch im Design-Tab sichtbar.

  DATENQUELLE: `spec.code.artefakte` aus spec.generated.ts. Der Exporter backt dort
  das Ergebnis von tooling/artefakte.mjs ein — DIESELBE Funktion, mit der
  src/lib/server/registry.ts die CLI-Anfragen beantwortet. Was hier als Format
  steht, liefert `zds add` also auch wirklich (keine zweite Datenquelle).

  Der Slug kommt aus der ROUTE (/product/components/<slug>) — wie im ComponentHero:
  das Doku-Modell führt keinen Slug.

  Kein neues Copy-Muster: die Befehle laufen durch ui/code-block (Copy-Button +
  Zeilennummern-Automatik), die Format-Angabe durch ui/chip und ui/badge.
-->
<script lang="ts">
	import { page } from '$app/state';
	import { Badge } from '$components/ui/badge';
	import { Chip } from '$components/ui/chip';
	import { CodeBlock } from '$components/ui/code-block';
	import type { CodeArtefakt, CodeStatus, BadgeVariant } from '$types/spec';

	let {
		artefakte = []
	}: {
		/** Vorhandene Code-Artefakte (spec.code.artefakte). Leer = nicht über die CLI beziehbar. */
		artefakte?: CodeArtefakt[];
	} = $props();

	const slug = $derived(page.url?.pathname.match(/^\/product\/components\/([^/]+)\/?$/)?.[1] ?? '');

	/** Reifegrad → Badge-Tönung (wie im Hero: Maschine = blau, abgeleitet = grün). */
	const STATUS_TONE: Record<CodeStatus, BadgeVariant> = {
		kanonisch: 'machine',
		portiert: 'editorial',
		entwurf: 'warn'
	};

	// Mehrere Formate → `zds add` fragt interaktiv nach; der Hinweis nennt --format,
	// damit der Befehl auch nicht-interaktiv reproduzierbar bleibt.
	const mehrereFormate = $derived(artefakte.length > 1);
</script>

<section class="get-component">
	{#if artefakte.length && slug}
		<ol class="get-component__steps">
			<li class="get-component__step">
				<h3 class="get-component__step-title">
					<span class="get-component__step-nr" aria-hidden="true">1</span>
					Einmalig: Token-Basis holen
				</h3>
				<p class="get-component__note">
					Ohne die <code>--z-ds-*</code>-Deklarationen rendert jede kopierte Komponente ungestylt.
					<code>zds init</code> legt sie als <code>styles-zds.css</code> ab — global einbinden, vor
					den Komponenten-Stylesheets.
				</p>
				<CodeBlock lang="shell" code="zds init" />
			</li>

			<li class="get-component__step">
				<h3 class="get-component__step-title">
					<span class="get-component__step-nr" aria-hidden="true">2</span>
					Diese Komponente kopieren
				</h3>
				<p class="get-component__note">
					Die Dateien werden <strong>kopiert</strong>, nicht installiert (shadcn-Modell) — dein
					Projekt besitzt den Code und darf ihn anpassen.
					{#if mehrereFormate}
						Bei mehreren Formaten fragt <code>add</code> nach; <code>--format &lt;name&gt;</code>
						wählt direkt aus.
					{/if}
				</p>
				<CodeBlock lang="shell" code="zds add {slug}" />
			</li>
		</ol>

		<div class="get-component__formats">
			<span class="get-component__formats-label">
				{artefakte.length === 1 ? 'Verfügbares Format' : 'Verfügbare Formate'}
			</span>
			<ul class="get-component__format-list">
				{#each artefakte as artefakt (artefakt.format)}
					<li class="get-component__format">
						<Chip value={artefakt.format} copy={false} />
						<Badge tone={STATUS_TONE[artefakt.status] ?? 'default'}>{artefakt.status}</Badge>
						<span class="get-component__files">
							{artefakt.dateien.join(' · ')}
						</span>
					</li>
				{/each}
			</ul>
		</div>
	{:else}
		<!-- Ehrlicher Hinweis statt eines Befehls, der scheitern würde: ohne Artefakt
		     kennt die Registry die Komponente nicht und `zds add` bricht ab. Die
		     Sektion ganz wegzulassen wäre stiller — sie beantwortet aber genau die
		     Frage, mit der ein Entwickler in den Develop-Tab kommt. -->
		<p class="get-component__empty">
			Für diese Komponente liegt noch kein Code-Artefakt in der Registry — <code>zds add</code>
			kann sie deshalb nicht kopieren. Bis dahin gilt der Code unten als Vorlage zum Übernehmen.
		</p>
	{/if}
</section>

<style>
	.get-component {
		margin-block: var(--z-ds-space-16);
	}

	/* Nummerierte Schritte: die Zahl trägt die Reihenfolge, nicht ein Marker —
	   darum list-style: none + eigene Ziffern-Pille (bleibt in Light/Dark lesbar). */
	.get-component__steps {
		list-style: none;
		margin: 0;
		padding: 0;
		display: flex;
		flex-direction: column;
		gap: var(--z-ds-space-24);
	}
	.get-component__step-title {
		display: flex;
		align-items: center;
		gap: var(--z-ds-space-8);
		margin: 0 0 var(--z-ds-space-4);
		font-size: var(--ds-text-base);
		font-weight: 600;
		color: var(--ds-text);
	}
	.get-component__step-nr {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		flex: none;
		width: 1.375rem;
		height: 1.375rem;
		border-radius: 50%;
		background: var(--ds-surface-raised);
		color: var(--ds-text-muted);
		font-family: var(--ds-font-mono);
		font-size: var(--ds-text-xs);
		line-height: 1;
	}
	.get-component__note {
		margin: 0 0 var(--z-ds-space-12);
		max-width: 68ch;
		font-size: var(--ds-text-sm);
		line-height: 1.6;
		color: var(--ds-text-body);
	}
	.get-component__note code,
	.get-component__empty code {
		font-family: var(--ds-font-mono);
		font-size: 0.9em;
	}

	/* Formate stehen UNTER den Befehlen: sie beantworten die Anschlussfrage („was
	   bekomme ich?"), nicht die Einstiegsfrage („wie hole ich es?"). */
	.get-component__formats {
		margin-top: var(--z-ds-space-24);
		padding-top: var(--z-ds-space-16);
		border-top: 1px solid var(--ds-border-soft);
	}
	.get-component__formats-label {
		display: block;
		margin-bottom: var(--z-ds-space-8);
		font-family: var(--ds-font-mono);
		font-size: 11px;
		letter-spacing: 0.12em;
		text-transform: uppercase;
		color: var(--ds-text-muted);
	}
	.get-component__format-list {
		list-style: none;
		margin: 0;
		padding: 0;
		display: flex;
		flex-direction: column;
		gap: var(--z-ds-space-8);
	}
	.get-component__format {
		display: flex;
		align-items: center;
		flex-wrap: wrap;
		gap: var(--z-ds-space-8);
	}
	.get-component__files {
		font-family: var(--ds-font-mono);
		font-size: var(--ds-text-xs);
		color: var(--ds-text-muted);
	}

	.get-component__empty {
		margin: 0;
		max-width: 68ch;
		font-size: var(--ds-text-sm);
		line-height: 1.6;
		color: var(--ds-text-body);
	}
</style>
