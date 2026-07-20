<!--
  Dialog.svelte — die schwebende Bestätigungs-/Aktionsleiste der Doku-Admin-UI.
  Konsolidiert das zuvor DOPPELT gepflegte „Save-Bar"-Muster (Spec-Editor +
  Brand-Editor): eine am unteren Rand schwebende Pillen-Leiste mit Status-Text,
  Verwerfen- und Speichern-Aktion (⌘S). Rein darstellend — der Zustand (dirty,
  Fehlerzahl, Speichern/Verwerfen) bleibt in der aufrufenden Seite; hier kommen
  Props rein, Callbacks raus.

  Buttons stammen aus dem Button-Atom (accent = Primär, quiet = Verwerfen); der
  Tastenkürzel-Hinweis aus dem Kbd-Atom.

  Modi (variant):
    · 'bar' (Default, gebaut) — schwebende Pillen-Leiste unten, wie die Save-Bar.
  Als vorgesehene Erweiterung ist ein 'modal'-Modus (zentrierter <dialog> mit
  Fokus-Trap für echte Verwerfen-/Löschen-Bestätigungen) angelegt, aber bewusst
  NOCH NICHT implementiert: im Bestand gibt es aktuell keinen modalen
  Bestätigungs-Fall (0 confirm()-Aufrufe). Wird erst gebaut, wenn ein realer
  Consumer existiert — dann als eigener Zweig hier, ohne die 'bar'-API zu brechen.

  Props:
    · open           — sichtbar? (Seite übergibt i. d. R. `dirty`)
    · message        — Status-Text links (z. B. „Ungespeicherte Änderungen")
    · extra          — optionales Snippet neben dem Text (z. B. Fehler-Chip)
    · primaryLabel   — Beschriftung der Primär-Aktion (Default „Speichern")
    · onprimary      — Primär-Klick UND Tastenkürzel (z. B. Formular abschicken)
    · primaryDisabled— Primär-Aktion sperren (Prod/Read-only, Validierungsfehler)
    · secondaryLabel — Beschriftung der Sekundär-Aktion (Default „Verwerfen")
    · onsecondary    — Sekundär-Klick (Verwerfen)
    · shortcut       — 'cmd+s' registriert ⌘S/Strg+S → onprimary, zeigt Kbd-Hinweis
    · variant        — 'bar' (s. o.)
-->
<script lang="ts">
	import type { Snippet } from 'svelte';
	import { Button } from '$components/ui/button';
	import { ButtonGroup } from '$components/ui/button-group';
	import { Kbd } from '$components/ui/kbd';

	type Props = {
		/** Sichtbar? Die Seite übergibt meist ihren `dirty`-Zustand. */
		open: boolean;
		/** Status-Text links in der Leiste. */
		message?: string;
		/** Optionales Snippet neben dem Text (z. B. ein Fehler-Chip). */
		extra?: Snippet;
		/** Beschriftung der Primär-Aktion. */
		primaryLabel?: string;
		/** Primär-Klick und Tastenkürzel (z. B. Formular abschicken). */
		onprimary?: () => void;
		/** Primär-Aktion sperren (Read-only, Validierungsfehler). */
		primaryDisabled?: boolean;
		/** title-Hinweis am gesperrten Primär-Button (z. B. „erst Fehler beheben"). */
		primaryTitle?: string;
		/** Beschriftung der Sekundär-Aktion. */
		secondaryLabel?: string;
		/** Sekundär-Klick (Verwerfen). */
		onsecondary?: () => void;
		/** Registriert das Tastenkürzel und zeigt den Kbd-Hinweis. */
		shortcut?: 'cmd+s';
		/** Erscheinungsbild — aktuell nur 'bar'. */
		variant?: 'bar';
	};

	let {
		open,
		message,
		extra,
		primaryLabel = 'Speichern',
		onprimary,
		primaryDisabled = false,
		primaryTitle,
		secondaryLabel = 'Verwerfen',
		onsecondary,
		shortcut,
		variant = 'bar'
	}: Props = $props();

	// ⌘S/Strg+S global: nur wenn die Leiste offen und die Primär-Aktion erlaubt ist
	// (deckt das frühere seitenlokale `if (dirty && writable)` ab). EIN Listener hier
	// ersetzt die doppelten window-Handler der beiden Editor-Seiten.
	function onWindowKeydown(e: KeyboardEvent) {
		if (shortcut !== 'cmd+s') return;
		if (!(e.metaKey || e.ctrlKey) || e.key.toLowerCase() !== 's') return;
		e.preventDefault();
		if (open && !primaryDisabled) onprimary?.();
	}
</script>

<svelte:window onkeydown={onWindowKeydown} />

{#if open}
	<!-- role=status + aria-live: das Auftauchen der Leiste (Statuswechsel „dirty")
	     wird für Screenreader angekündigt, ohne den Fokus zu stehlen. -->
	<div class="dialog-bar" data-variant={variant} role="status" aria-live="polite">
		{#if message}<span class="dialog-bar__message">{message}</span>{/if}
		{#if extra}{@render extra()}{/if}
		<!-- Aktions-Cluster als ButtonGroup (K8) statt eigenem Flex-Nachbarschaftslayout. -->
		<ButtonGroup label="Dialog-Aktionen" gap="md">
			{#if onsecondary}
				<Button variant="quiet" onclick={onsecondary}>{secondaryLabel}</Button>
			{/if}
			<Button
				variant="accent"
				disabled={primaryDisabled}
				title={primaryDisabled ? primaryTitle : undefined}
				onclick={onprimary}
			>
				{primaryLabel}{#if shortcut === 'cmd+s'}
					<Kbd variant="on-accent">⌘S</Kbd>{/if}
			</Button>
		</ButtonGroup>
	</div>
{/if}

<style>
	.dialog-bar {
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
		animation: dialog-bar-in 0.2s var(--ds-ease-out, ease-out);
	}
	@keyframes dialog-bar-in {
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
		.dialog-bar {
			animation: none;
		}
	}
	.dialog-bar__message {
		font-size: var(--ds-text-sm);
		color: var(--ds-text-body);
		white-space: nowrap;
	}
	/* Der ⌘S-Hinweis erbt seine Optik aus dem Kbd-Atom; nur der linke Abstand zum
	   Label bleibt hier. */
	.dialog-bar :global(.kbd) {
		margin-left: 0.3em;
	}
</style>
