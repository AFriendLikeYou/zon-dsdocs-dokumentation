<!--
  EditorialCard — Redaktions-Karte im Spec-Editor. Kopf (Titel + optionale Subzeile +
  ✎-Herkunfts-Pill + optionaler Kopf-Zusatz + Entfernen-Trigger) über einem
  Body-Snippet.

  Sie trägt den kompletten Ghost-Lifecycle: hat ein Abschnitt einen Ghost-Zustand
  (`onexpand` gesetzt) und ist NICHT expandiert, rendert die Karte statt ihres Inhalts
  die gestrichelte Einladungs-GhostCard. Ohne `onexpand` ist die Karte immer offen
  (z. B. „Übersicht").

  Der Entfernen-Trigger (nur wenn `onremove`) sitzt rechts neben der Pill. Er bleibt
  ruhig und wird erst bei Hover/Fokus-within der Karte sichtbar — auf Touch immer,
  dieselbe Sprache wie das ✕ der Listenzeilen. Ein Klick leert den Abschnitt und klappt
  zur GhostCard zurück (die Leer-Logik + der Fokus-Rücksprung liegen in der Seite).

  Props:
  - title:       Karten-Überschrift.
  - subline?:    gedämpfte Subzeile unter dem Titel.
  - id?:         DOM-id der Section (Anker-/Scroll-Ziel, z. B. „cluster-overview").
  - attached?:   eingerückte „aufgesetzte" Variante — gehört zur Zone darüber.
  - expanded?:   ist der Abschnitt aufgeklappt? (nur mit `onexpand` relevant; Default true).
  - ghostLabel?: Aufforderungstext der GhostCard (Fallback: `title`).
  - ghostId?:    DOM-id der GhostCard (Fokus-Ziel nach dem Entfernen).
  - onexpand?:   Ghost-Klick — expandiert den Abschnitt.
  - onremove?:   Entfernen-Klick — leert & schließt den Abschnitt (→ GhostCard).
  - removeLabel?: aria-label des Entfernen-Triggers (Default: „Abschnitt <title> entfernen").
  - headExtra?:  optionaler Kopf-Zusatz links neben der Pill (z. B. „gemischt"-Meta).
  - children:    Karten-Inhalt (Body).
-->
<script lang="ts">
	import type { Snippet } from 'svelte';
	import { CloseIcon } from '$lib/icons';
	import ProvenanceChip from './ProvenanceChip.svelte';
	import GhostCard from './GhostCard.svelte';

	let {
		title,
		subline,
		id,
		attached = false,
		expanded = true,
		ghostLabel,
		ghostId,
		onexpand,
		onremove,
		removeLabel,
		headExtra,
		children
	}: {
		title: string;
		subline?: string;
		id?: string;
		attached?: boolean;
		expanded?: boolean;
		ghostLabel?: string;
		ghostId?: string;
		onexpand?: () => void;
		onremove?: () => void;
		removeLabel?: string;
		headExtra?: Snippet;
		children: Snippet;
	} = $props();
</script>

{#if onexpand && !expanded}
	<GhostCard label={ghostLabel ?? title} {onexpand} id={ghostId} {attached} />
{:else}
	<section class="card" class:card--attached={attached} {id}>
		<div class="card-head">
			<span class="card-titles">
				<span class="card-title">{title}</span>
				{#if subline}<span class="card-subline">{subline}</span>{/if}
			</span>
			<span class="card-head__side">
				{#if headExtra}{@render headExtra()}{/if}
				<ProvenanceChip variant="editorial" />
				{#if onremove}
					<button
						type="button"
						class="card-remove"
						onclick={onremove}
						aria-label={removeLabel ?? `Abschnitt ${title} entfernen`}
					>
						<CloseIcon width={14} height={14} />
					</button>
				{/if}
			</span>
		</div>
		<div class="card-body">
			{@render children()}
		</div>
	</section>
{/if}

<style>
	/* ── Editor-Karten (Sektions-Ebene) — auf --ds-surface-raised abgesetzt gegen
	   die äußere Karte, damit sich die Ebenen klar staffeln. ── */
	.card {
		background: var(--ds-surface-raised, var(--ds-surface));
		border: 1px solid var(--ds-border-soft);
		border-radius: var(--ds-radius);
		padding: var(--z-ds-space-m);
		margin-bottom: var(--z-ds-space-m);
		/* Scroll-Ziel des ersten Cluster-Ankers („cluster-overview") — nur Offset. */
		scroll-margin-top: var(--z-ds-space-l);
	}
	/* „Hinweis je Token" gehört zur Tokens-Zone → leicht eingerückt & aufgesetzt. */
	.card--attached {
		margin-left: var(--z-ds-space-m);
		margin-top: calc(-1 * var(--z-ds-space-6));
	}
	.card-head {
		display: flex;
		align-items: flex-start;
		justify-content: space-between;
		gap: var(--z-ds-space-s);
		padding: 0 0 var(--z-ds-space-8);
		border-bottom: 1px solid var(--ds-border-soft);
	}
	/* Titel + gedämpfte Subzeile gestapelt. */
	.card-titles {
		display: flex;
		flex-direction: column;
		gap: 1px;
		min-width: 0;
	}
	.card-title {
		font-size: var(--ds-text-sm);
		font-weight: 600;
		color: var(--ds-text);
	}
	.card-subline {
		font-size: var(--ds-text-xs);
		font-weight: 400;
		color: var(--ds-text-muted);
	}
	.card-head__side {
		display: inline-flex;
		align-items: center;
		gap: var(--z-ds-space-8);
		flex: none;
	}
	.card-body {
		display: flex;
		flex-direction: column;
		gap: var(--z-ds-space-s);
		padding: 8px 0 0;
	}

	/* Entfernen-Trigger: rechts neben der Pill, ruhig — erscheint bei Hover/Fokus der
	   Karte (auf Touch immer), dieselbe Sprache wie das ✕ der Listenzeilen. */
	.card-remove {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		width: 1.5rem;
		height: 1.5rem;
		flex: none;
		border: none;
		background: none;
		border-radius: var(--ds-radius-sm);
		padding: 0;
		color: var(--ds-text-muted);
		cursor: pointer;
		line-height: 1;
		opacity: 0;
		transition:
			opacity var(--ds-dur, 0.15s) var(--ds-ease-out, ease-out),
			background var(--ds-dur, 0.15s) var(--ds-ease-out, ease-out),
			color var(--ds-dur, 0.15s) var(--ds-ease-out, ease-out);
	}
	.card:hover .card-remove,
	.card:focus-within .card-remove {
		opacity: 1;
	}
	.card-remove:hover {
		color: var(--ds-negative, var(--ds-text));
		background: rgb(from var(--ds-negative, var(--ds-text)) r g b / 0.1);
	}
	.card-remove:focus-visible {
		opacity: 1;
		outline: 2px solid var(--ds-focus-ring);
		outline-offset: 2px;
	}
	@media (hover: none) {
		.card-remove {
			opacity: 1;
		}
	}
	@media (prefers-reduced-motion: reduce) {
		.card-remove {
			transition: none;
		}
	}
</style>
