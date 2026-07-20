<!--
  IconActionButton.svelte — gemeinsame Basis für kleine Icon-/Text-Aktions-Buttons
  (Look + Slots + focus/active/reduced-motion). Konsolidiert das zuvor byte-gleiche
  CSS von CopyButton und DownloadButton. Diese behalten ihre eigene API + Logik und
  delegieren nur den Button-Look hierher.

  Nutzung:
    <IconActionButton {ariaLabel} {onclick} class="copy-button" iconButton>
      …Icon oder Label…
    </IconActionButton>
    <IconActionButton subtle tone="danger" ariaLabel="Löschen" title="Löschen" …/>

  Achse `subtle` = dezenter Werkzeug-Look (CMS), `tone` = Bedeutung des Hover-
  Feedbacks. `ariaLabel` ist für icon-only Pflicht — Ausnahme: rein dekorative
  Griffe, die per `aria-hidden="true" tabindex={-1}` bewusst aus Fokus- und
  a11y-Baum genommen sind (z. B. der Drag-Griff, dessen barrierefreies Pendant
  die ↑/↓-Buttons sind). Beides läuft über `...restProps`.
-->
<script lang="ts">
	import type { Snippet } from 'svelte';
	import type { HTMLButtonAttributes } from 'svelte/elements';
	import { tooltip } from '$components/ui/tooltip';

	type Props = {
		/** A11y-Label (für icon-only verpflichtend). */
		ariaLabel?: string;
		/** Kurzinfo — als barrierefreier ui/tooltip statt nativem title (K8);
		 *  erscheint bei Hover UND Tastatur-Fokus. */
		title?: string;
		/** Gerahmter Icon-Button-Look (Border + Hover) — wie Icon-/Asset-Grid. */
		iconButton?: boolean;
		/** Dezenter Werkzeug-Look (CMS-Standard): 1.5rem-Quadrat, `--ds-text-muted`,
		 *  Hover-Tint `--ds-text`/8 %, disabled-Opacity 0.35. Löst die zuvor je Datei
		 *  gepflegten Kopien (Block-Karten-Werkzeuge, Drag-Griff) ab. */
		subtle?: boolean;
		/** Bedeutungs-Achse des Hover-Feedbacks: `default` (neutral) oder `danger`
		 *  (destruktiv — roter Hover aus `--ds-negative`, z. B. „Löschen"). Der
		 *  Ruhezustand bleibt in beiden Fällen neutral; nur Hover/Fokus färbt. */
		tone?: 'default' | 'danger';
		/** Klick-Handler des Buttons. */
		onclick?: (event: MouseEvent) => void;
		/** Button-Inhalt (Icon oder Label). */
		children: Snippet;
		/** Zugriff aufs <button>-Element (z. B. für Popover-Anker). */
		element?: HTMLButtonElement | null;
		class?: string;
	} & Omit<HTMLButtonAttributes, 'class' | 'onclick' | 'title'>;

	let {
		ariaLabel,
		title,
		iconButton = false,
		subtle = false,
		tone = 'default',
		onclick,
		children,
		element = $bindable(null),
		class: className = '',
		...restProps
	}: Props = $props();
</script>

<!-- title läuft NICHT mehr als natives Attribut durch (doppelter Tooltip wäre
     störend), sondern über die ui/tooltip-Action: Hover + Tastatur-Fokus, Esc. -->
<button
	bind:this={element}
	type="button"
	class="icon-action {className}"
	class:icon-button={iconButton}
	class:icon-action--subtle={subtle}
	class:icon-action--danger={tone === 'danger'}
	aria-label={ariaLabel}
	use:tooltip={title ?? ''}
	{onclick}
	{...restProps}
>
	{@render children()}
</button>

<style>
	/* Basis-Reset mit :where() (Spezifität 0) → Aufrufer können Farbe/Hintergrund/
	   Padding/Schriftgröße per :global(.eigene-klasse) ohne Spezifitäts-Kampf setzen. */
	:where(.icon-action) {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		gap: var(--z-ds-space-xs);
		font: inherit;
		color: inherit;
		background: none;
		border: none;
		padding: 0;
		cursor: pointer;
		transition: color var(--ds-dur) var(--ds-ease);
	}
	.icon-action:active:not(:disabled) {
		transform: scale(0.97);
	}
	.icon-action:focus-visible {
		outline: 2px solid var(--ds-focus-ring);
		outline-offset: 2px;
		border-radius: var(--ds-radius-sm);
	}

	/* Gerahmter Icon-Button (Icon-/Asset-Grid) — normale Spezifität, schlägt :where. */
	.icon-action.icon-button {
		padding: var(--z-ds-space-8);
		border: 1px solid var(--ds-border-strong);
		border-radius: var(--ds-radius-sm);
		background: var(--ds-surface);
		color: var(--ds-text);
		transition:
			background-color var(--ds-dur) var(--ds-ease),
			transform var(--ds-dur) var(--ds-ease-out);
	}
	@media (hover: hover) and (pointer: fine) {
		.icon-action.icon-button:hover {
			background: var(--ds-surface-raised);
		}
	}

	/* Dezenter Werkzeug-Look (CMS-Standard): 16×16-Icon im 24×24-Quadrat, radius 4,
	   Hover = dezente Text-Tönung. War zuvor je Datei kopiert (Block-Karten-Werkzeuge,
	   Drag-Griff, Media-Werkzeuge) — hier ist die eine Quelle. */
	.icon-action.icon-action--subtle {
		width: 1.5rem;
		height: 1.5rem;
		flex: none;
		padding: 0;
		border-radius: var(--ds-radius-sm);
		font-size: var(--ds-text-xs);
		line-height: 1;
		color: var(--ds-text-muted);
		transition:
			background var(--ds-dur) var(--ds-ease-out),
			color var(--ds-dur) var(--ds-ease-out);
	}
	.icon-action--subtle:disabled {
		opacity: 0.35;
		cursor: not-allowed;
	}
	@media (hover: hover) and (pointer: fine) {
		.icon-action--subtle:hover:not(:disabled) {
			background: rgb(from var(--ds-text) r g b / 0.08);
			color: var(--ds-text);
		}
		/* Destruktive Aktion: erst beim Hover rot — der Ruhezustand bleibt neutral,
		   damit „Löschen" die Werkzeugleiste nicht dauerhaft alarmiert. */
		.icon-action--subtle.icon-action--danger:hover:not(:disabled) {
			color: var(--ds-negative);
			background: rgb(from var(--ds-negative) r g b / 0.1);
		}
	}
	/* Ohne `subtle` (nackter Look) trägt danger nur die Farbe. */
	@media (hover: hover) and (pointer: fine) {
		.icon-action--danger:not(.icon-action--subtle):hover:not(:disabled) {
			color: var(--ds-negative);
		}
	}

	@media (prefers-reduced-motion: reduce) {
		.icon-action {
			transition: none;
		}
	}
</style>
