<!--
  LegendPopover — kleines ⓘ neben der Seiten-Überschrift, das die Herkunfts-Legende
  (früher in der Fußzeile) in einem Popover öffnet: was „⇣ aus Figma“ / „✎ Redaktion“
  bedeuten und wann ein Herkunft-Badge erscheint.

  Nutzt die geteilte PopoverSheet-Hülle des Brand-Editors (Desktop: verankertes
  Popover mit Outside-Click, Mobile: Bottom-Sheet). Esc schließt und gibt den Fokus
  an den Trigger zurück; aria-haspopup/-expanded verknüpfen Trigger und Dialog.
-->
<script lang="ts">
	import PopoverSheet from '../../../brand/editor/PopoverSheet.svelte';
	import ProvenanceChip from './ProvenanceChip.svelte';

	let open = $state(false);
	let triggerEl = $state<HTMLButtonElement | null>(null);

	function toggle() {
		open = !open;
	}
	function close({ returnFocus = false } = {}) {
		open = false;
		if (returnFocus) triggerEl?.focus();
	}
</script>

<svelte:window
	onkeydown={(e) => {
		if (open && e.key === 'Escape') {
			e.preventDefault();
			close({ returnFocus: true });
		}
	}}
/>

<button
	type="button"
	class="legend-info"
	bind:this={triggerEl}
	aria-haspopup="dialog"
	aria-expanded={open}
	aria-label="Legende: Herkunft der Angaben"
	onclick={toggle}
>
	<span aria-hidden="true">ⓘ</span>
</button>

<PopoverSheet {open} label="Legende: Herkunft der Angaben" anchor={triggerEl} width="20rem" onclose={close}>
	<div class="legend-pop">
		<p class="legend-pop__row">
			<ProvenanceChip variant="machine" /> read-only, aus dem Figma-Import
		</p>
		<p class="legend-pop__row">
			<ProvenanceChip variant="editorial" /> redaktionell editierbar
		</p>
		<hr class="legend-pop__sep" />
		<p class="legend-pop__row">
			<span class="legend-pop__badge legend-pop__badge--abgeleitet">abgeleitet</span>
			aus anderen Werten berechnet
		</p>
		<p class="legend-pop__row">
			<span class="legend-pop__badge legend-pop__badge--geschaetzt">≈ geschätzt</span>
			Platzhalter, noch nicht aus Figma
		</p>
		<p class="legend-pop__note">Maße ohne Badge sind direkt aus Figma gemessen.</p>
	</div>
</PopoverSheet>

<style>
	.legend-info {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		width: 1.5rem;
		height: 1.5rem;
		flex: none;
		border: none;
		background: none;
		border-radius: 999px;
		padding: 0;
		color: var(--ds-text-muted);
		font-size: var(--ds-text-base);
		line-height: 1;
		cursor: pointer;
		transition:
			color var(--ds-dur, 0.15s) var(--ds-ease-out, ease-out),
			background var(--ds-dur, 0.15s) var(--ds-ease-out, ease-out);
	}
	.legend-info:hover {
		color: var(--ds-text);
		background: rgb(from var(--ds-text) r g b / 0.08);
	}
	.legend-info:focus-visible {
		outline: 2px solid var(--ds-focus-ring);
		outline-offset: 2px;
	}
	@media (prefers-reduced-motion: reduce) {
		.legend-info {
			transition: none;
		}
	}

	.legend-pop {
		display: flex;
		flex-direction: column;
		gap: var(--z-ds-space-8);
		padding: var(--z-ds-space-6);
	}
	.legend-pop__row {
		display: flex;
		align-items: center;
		gap: var(--z-ds-space-8);
		margin: 0;
		font-size: var(--ds-text-xs);
		color: var(--ds-text-muted);
	}
	.legend-pop__sep {
		width: 100%;
		height: 0;
		margin: var(--z-ds-space-6) 0;
		border: none;
		border-top: 1px solid var(--ds-border);
	}
	.legend-pop__badge {
		display: inline-flex;
		align-items: center;
		flex: none;
		font-size: var(--ds-text-xs);
		border-radius: 999px;
		padding: 1px var(--z-ds-space-8);
		border: 1px solid var(--ds-border-soft);
		color: var(--ds-text-body);
		background: var(--ds-surface-raised, var(--ds-surface));
	}
	.legend-pop__badge--geschaetzt {
		color: var(--ds-warning-text, var(--ds-text));
		border-color: rgb(from var(--ds-warning) r g b / 0.5);
		background: rgb(from var(--ds-warning) r g b / 0.15);
	}
	.legend-pop__note {
		margin: 0;
		font-size: var(--ds-text-xs);
		color: var(--ds-text-faint, var(--ds-text-muted));
	}
</style>
