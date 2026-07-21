<!--
  NudgeButtons — das ↑/↓-Paar der umsortierbaren CMS-Listen (/admin und
  /admin/brand). Es ist die barrierefreie, präzise Basis: Drag&Drop ist die
  bequeme Abkürzung, aber alles muss auch per Tastatur gehen. Zurückhaltend
  sichtbar, volle Deckung sobald die Zeile im Hover oder Fokus ist.

  Props:
    · up / down     — Callbacks, bewegen den Eintrag um eine Position.
    · atTop/atBottom — deaktivieren die jeweilige Richtung an den Rändern.
    · label         — aria-label der Gruppe (Default „Position ändern").
-->
<script lang="ts">
	import { Icon } from '$lib/icons/cms';
	import { ButtonGroup } from '$components/ui/button-group';

	let {
		up,
		down,
		atTop = false,
		atBottom = false,
		label = 'Position ändern'
	}: {
		/** Eine Position nach oben. */
		up: () => void;
		/** Eine Position nach unten. */
		down: () => void;
		/** Erster Eintrag im Scope → „nach oben" deaktiviert. */
		atTop?: boolean;
		/** Letzter Eintrag im Scope → „nach unten" deaktiviert. */
		atBottom?: boolean;
		/** aria-label der Gruppe. */
		label?: string;
	} = $props();
</script>

<span class="nudge">
	<ButtonGroup attached {label}>
		<button type="button" onclick={up} disabled={atTop} aria-label="Nach oben"
			><Icon name="arrow-up" /></button
		>
		<button type="button" onclick={down} disabled={atBottom} aria-label="Nach unten"
			><Icon name="arrow-down" /></button
		>
	</ButtonGroup>
</span>

<style>
	.nudge {
		display: inline-flex;
		margin-left: var(--z-ds-space-s);
		opacity: 0.35;
		transition: opacity var(--ds-dur) var(--ds-ease-out);
	}
	:global(.admin-row:hover) .nudge,
	:global(.admin-row:focus-within) .nudge {
		opacity: 1;
	}

	button {
		width: 1.4rem;
		height: 1.4rem;
		display: inline-flex;
		align-items: center;
		justify-content: center;
		border: 1px solid var(--ds-border);
		border-radius: var(--ds-radius-xs);
		background: var(--ds-surface);
		color: var(--ds-text);
		cursor: pointer;
		font-size: var(--ds-text-xs);
		line-height: 1;
	}
	button:hover:not(:disabled) {
		background: var(--ds-surface-raised);
	}
	button:disabled {
		opacity: 0.3;
		cursor: not-allowed;
	}
	button:focus-visible {
		outline: 2px solid var(--ds-focus-ring);
		outline-offset: 1px;
	}
</style>
