<!--
  DriftBanner — getönte Warn-Fläche im Spec-Editor: Icon + fetter Titel + Erklärtext +
  Aktions-Buttons. Erscheint, wenn die Figma-Roh-Daten (figma-raw.json) neuer als das
  model.json sind. Reine Präsentation — Text und Buttons kommen als Snippets von der
  Seite (die kennt den Re-Import-Befehl und die Anleitungs-URL).

  Weil Text- und Button-Inhalt aus der Seite eingespielt werden (fremder Scope),
  greifen die Feinheiten (<code>-Font, Button-Look) via `:global()` — die Struktur
  (Fläche, Icon, Titel-Zeile, Aktions-Reihe) bleibt scoped.

  Props:
  - title:   fette Überschrift der Warn-Fläche.
  - text:    Erklär-Absatz (Snippet, enthält <code>-Auszeichnung).
  - actions: Aktions-Buttons unter dem Text (Snippet, Klasse `drift__btn`).
-->
<script lang="ts">
	import type { Snippet } from 'svelte';
	import { AlertTriangleIcon } from '$lib/icons';

	let {
		title,
		text,
		actions
	}: {
		title: string;
		text: Snippet;
		actions: Snippet;
	} = $props();
</script>

<div class="drift" role="status">
	<span class="drift__icon" aria-hidden="true"><AlertTriangleIcon width={18} height={18} /></span>
	<div class="drift__body">
		<strong class="drift__title">{title}</strong>
		<p class="drift__text">{@render text()}</p>
		<div class="drift__actions">{@render actions()}</div>
	</div>
</div>

<style>
	/* ── Drift-Banner: getönte Warn-Fläche, Icon + fetter Titel + Erklärtext,
	   Aktionen darunter (klein, outline) — Formensprache des Mockups. ── */
	.drift {
		display: flex;
		align-items: flex-start;
		gap: var(--z-ds-space-s);
		background: var(--ds-tint-warning-surface);
		border: 1px solid var(--ds-tint-warning-border);
		border-radius: var(--ds-radius);
		padding: var(--z-ds-space-m);
		margin-bottom: var(--z-ds-space-l);
	}
	.drift__icon {
		display: inline-flex;
		flex: none;
		color: var(--ds-tint-warning-text);
		margin-top: 1px;
	}
	.drift__body {
		flex: 1;
		min-width: 0;
	}
	.drift__title {
		display: block;
		font-size: var(--ds-text-base);
		color: var(--ds-tint-warning-text);
	}
	.drift__text {
		margin: var(--z-ds-space-6) 0 0;
		font-size: var(--ds-text-sm);
		color: var(--ds-text-body);
		max-width: 44rem;
	}
	/* <code> kommt aus dem Seiten-Snippet (fremder Scope) → :global. */
	.drift__text :global(code) {
		font-family: var(--ds-font-mono);
		font-size: 0.9em;
	}
	/* Zwei kleine Outline-Buttons unter dem Text, links. */
	.drift__actions {
		display: flex;
		flex-wrap: wrap;
		gap: var(--z-ds-space-6);
		margin-top: var(--z-ds-space-8);
	}
	/* Buttons stammen aus dem Seiten-Snippet (fremder Scope) → :global. */
	.drift__actions :global(.drift__btn) {
		display: inline-flex;
		align-items: center;
		gap: var(--z-ds-space-4);
		width: auto;
		font-size: var(--ds-text-xs);
		font-weight: 600;
		color: var(--ds-text);
		text-decoration: none;
		border: 1px solid var(--ds-border-strong);
		border-radius: var(--ds-radius-sm);
		padding: var(--z-ds-space-4) var(--z-ds-space-8);
		background: var(--ds-surface);
		cursor: pointer;
		transition: border-color var(--ds-dur, 0.15s) var(--ds-ease-out, ease-out);
	}
	.drift__actions :global(.drift__btn:hover) {
		border-color: var(--ds-accent);
	}
	.drift__actions :global(.drift__btn:focus-visible) {
		outline: 2px solid var(--ds-focus-ring);
		outline-offset: 2px;
	}
	@media (prefers-reduced-motion: reduce) {
		.drift__actions :global(.drift__btn) {
			transition: none;
		}
	}
</style>
