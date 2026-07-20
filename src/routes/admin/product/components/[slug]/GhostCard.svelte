<!--
  GhostCard — die gestrichelte „+ … ergänzen"-Einladung für einen leeren
  Redaktions-Abschnitt. Keine Leere-Anzeige, sondern interaktive Einladung — bewusst
  getrennt von EmptyState. Ein Klick expandiert den Abschnitt (→ onexpand). Der Kopf
  bleibt ruhig; nur Kontur/Farbe reagieren auf Hover (Emil-ease-out), auf :active
  gibt es ein zartes Flächen-Feedback.

  Props:
  - label:    vollständiger Aufforderungstext (z. B. „Verwendung ergänzen").
  - onexpand: Klick-Handler — expandiert den zugehörigen Abschnitt.
  - id?:      DOM-id des Buttons (Fokus-Ziel, nachdem ein Abschnitt entfernt wurde).
  - attached?: eingerückte „aufgesetzte" Variante — gehört zur Zone darüber (z. B.
              „Hinweis je Token" direkt unter den Tokens).
-->
<script lang="ts">
	let {
		label,
		onexpand,
		id,
		attached = false
	}: {
		label: string;
		onexpand: () => void;
		id?: string;
		attached?: boolean;
	} = $props();
</script>

{#snippet button()}
	<button type="button" class="ghost-card" {id} onclick={onexpand}>
		<span class="ghost-card__plus" aria-hidden="true">+</span>
		<span class="ghost-card__label">{label}</span>
	</button>
{/snippet}

{#if attached}
	<div class="ghost-attached">{@render button()}</div>
{:else}
	{@render button()}
{/if}

<style>
	/* ── Ghost-Karte: leerer Abschnitt als Einladung ── */
	.ghost-card {
		display: flex;
		align-items: center;
		gap: var(--z-ds-space-8);
		width: 100%;
		text-align: left;
		background: none;
		border: 1px dashed var(--ds-border);
		border-radius: var(--ds-radius);
		padding: var(--z-ds-space-m);
		margin-bottom: var(--z-ds-space-m);
		color: var(--ds-text-muted);
		cursor: pointer;
		transition:
			border-color var(--ds-dur, 0.15s) var(--ds-ease-out, ease-out),
			color var(--ds-dur, 0.15s) var(--ds-ease-out, ease-out),
			background var(--ds-dur, 0.15s) var(--ds-ease-out, ease-out);
	}
	.ghost-card:hover {
		border-color: var(--ds-accent);
		color: var(--ds-text-body);
		background: rgb(from var(--ds-accent) r g b / 0.04);
	}
	.ghost-card:active {
		background: rgb(from var(--ds-accent) r g b / 0.08);
	}
	.ghost-card:focus-visible {
		outline: 2px solid var(--ds-focus-ring);
		outline-offset: 2px;
	}
	.ghost-card__plus {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		width: 1.25rem;
		height: 1.25rem;
		flex: none;
		border-radius: 999px;
		border: 1px solid var(--ds-border);
		font-size: var(--ds-text-sm);
		line-height: 1;
	}
	.ghost-card__label {
		font-size: var(--ds-text-sm);
	}
	/* „Hinweis je Token" gehört zur Tokens-Zone → leicht eingerückt & aufgesetzt. */
	.ghost-attached {
		margin-left: var(--z-ds-space-m);
		margin-top: calc(-1 * var(--z-ds-space-6));
	}
	@media (prefers-reduced-motion: reduce) {
		.ghost-card {
			transition: none;
		}
	}
</style>
