<!--
  SaveBar — die schwebende Speicher-Leiste des Spec-Editors (Muster aus dem
  Brand-Editor): „Ungespeicherte Änderungen" + Verwerfen + Speichern (⌘S). Wird von
  der Seite nur bei dirty gerendert; der Submit läuft über das umgebende <form>
  (type="submit"), darum braucht die Leiste keinen eigenen Form-Bezug.

  Props:
  - writable:  Speichern erlaubt? (Prod = false → Button disabled).
  - ondiscard: Verwerfen-Klick — stellt den Ausgangsstand wieder her.
-->
<script lang="ts">
	let {
		writable,
		ondiscard
	}: {
		writable: boolean;
		ondiscard: () => void;
	} = $props();
</script>

<div class="savebar" role="status">
	<span class="savebar__info">Ungespeicherte Änderungen</span>
	<button type="button" class="savebar__discard" onclick={ondiscard}>Verwerfen</button>
	<button type="submit" class="savebar__save" disabled={!writable}>Speichern <kbd>⌘S</kbd></button>
</div>

<style>
	.savebar {
		position: fixed;
		left: 50%;
		bottom: 1.25rem;
		transform: translateX(-50%);
		z-index: 40;
		display: flex;
		align-items: center;
		gap: var(--z-ds-space-s);
		background: var(--ds-surface);
		border: 1px solid var(--ds-border);
		border-radius: 999px;
		padding: var(--z-ds-space-6) var(--z-ds-space-6) var(--z-ds-space-6) var(--z-ds-space-l);
		box-shadow: 0 8px 24px rgb(from var(--ds-text) r g b / 0.18);
		animation: savebar-in 0.2s var(--ds-ease-out, ease-out);
	}
	@keyframes savebar-in {
		from {
			opacity: 0;
			transform: translate(-50%, 8px);
		}
		to {
			opacity: 1;
			transform: translate(-50%, 0);
		}
	}
	@media (prefers-reduced-motion: reduce) {
		.savebar {
			animation: none;
		}
	}
	.savebar__info {
		font-size: var(--ds-text-sm);
		color: var(--ds-text-body);
		white-space: nowrap;
	}
	.savebar__discard {
		border: none;
		background: none;
		color: var(--ds-text-muted);
		font-size: var(--ds-text-sm);
		cursor: pointer;
		padding: var(--z-ds-space-6) var(--z-ds-space-s);
		border-radius: 999px;
		transition:
			background var(--ds-dur, 0.15s) var(--ds-ease-out, ease-out),
			color var(--ds-dur, 0.15s) var(--ds-ease-out, ease-out);
	}
	.savebar__discard:hover {
		background: rgb(from var(--ds-text) r g b / 0.08);
		color: var(--ds-text);
	}
	.savebar__save {
		background: var(--ds-accent);
		color: var(--ds-static-white);
		border: none;
		border-radius: 999px;
		padding: var(--z-ds-space-8) var(--z-ds-space-l);
		font-weight: 600;
		cursor: pointer;
		width: auto;
		transition: opacity var(--ds-dur, 0.15s) var(--ds-ease-out, ease-out);
	}
	.savebar__save:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}
	.savebar__save:focus-visible,
	.savebar__discard:focus-visible {
		outline: 2px solid var(--ds-focus-ring);
		outline-offset: 2px;
	}
	.savebar kbd {
		font-family: var(--ds-font-mono);
		font-size: 0.72em;
		opacity: 0.75;
		margin-left: 0.3em;
		background: rgb(from var(--ds-static-white) r g b / 0.18);
		padding: 1px 5px;
		border-radius: 4px;
	}
</style>
