<!--
  AdminRow — die kanonische Listenzeile aller CMS-Übersichten. Ein reines Gestalt-
  Gehäuse: gleiche Höhe, gleicher Radius, dieselbe Flächen-Treppe. Die Zeile ist
  schon im RUHEZUSTAND grau hinterlegt (--ds-surface-raised) und damit als eigenes
  Objekt lesbar; Hover und Fokus heben sich davon mit der nächsten Flächenstufe
  (--ds-surface-sunken) plus Kontur ab. Der Inhalt (Icon, Titel, Meta, Aktionen)
  kommt als children von der Seite — so bleibt das Zeilen-Styling an EINER Stelle,
  während jede Seite ihre eigenen Felder füllt.

  Drag&Drop bleibt bewusst außerhalb: Die Brand-Übersicht hängt ihre nativen
  DnD-Handler + `draggable` einfach per Spread (`...rest`) an das gerenderte Element
  — die Logik lebt weiter in der Seite, nur die Optik liegt hier.

  Props:
  - tag:          gerendertes Element (‚div' | ‚li' | …), default ‚div'.
  - interactive:  Zeile ist anfassbar → graue Ruhefläche + Hover/Fokus-Stufen.
                  `false` = reine Label-Zeile ohne Ziel: bleibt flächenlos.
                  (Aktuell von keiner Übersicht genutzt — seit beide Listen
                  sortierbar sind, ist auch der Kategorie-Header anfassbar.
                  Bleibt als bewusste Option für nicht-interaktive Listen.)
  - dragover:     zeigt den Einfüge-Indikator (Linie oben) beim DnD-Hover.
  - indent:       rückt Kind-Zeilen (Unterseiten) leicht ein.
  - class:        zusätzliche Klassen von der Seite.
  - ...rest:      alles Übrige (draggable, on*-Handler, aria-*) → aufs Element.
-->
<script lang="ts">
	import type { Snippet } from 'svelte';

	let {
		tag = 'div',
		interactive = true,
		dragover = false,
		indent = false,
		class: klass = '',
		children,
		...rest
	}: {
		tag?: string;
		interactive?: boolean;
		dragover?: boolean;
		indent?: boolean;
		class?: string;
		children?: Snippet;
		[key: string]: unknown;
	} = $props();
</script>

<svelte:element
	this={tag}
	class="admin-row {klass}"
	class:is-interactive={interactive}
	class:is-dragover={dragover}
	class:is-indent={indent}
	{...rest}
>
	{@render children?.()}
</svelte:element>

<style>
	/* Ruhezustand = eigene Fläche (--ds-surface-raised). Die Zeile ist damit sofort
	   als Objekt lesbar, statt erst unter dem Zeiger zu erscheinen. Der schmale
	   Abstand hält die Zeilen als einzelne Karten auseinander — ohne ihn liefe die
	   Liste zu einem durchgehenden grauen Block zusammen. */
	.admin-row {
		display: flex;
		align-items: center;
		gap: var(--z-ds-space-s);
		min-height: 2.5rem;
		margin-bottom: var(--z-ds-space-4);
		padding: var(--z-ds-space-s) var(--z-ds-space-m);
		border: 1px solid transparent;
		border-radius: var(--ds-radius-sm);
		background: var(--ds-surface-raised);
		transition:
			border-color var(--ds-dur) var(--ds-ease-out),
			background var(--ds-dur) var(--ds-ease-out);
	}
	.is-indent {
		margin-left: var(--z-ds-space-xs);
	}
	/* Nicht-interaktive Zeilen (reine Label-Zeilen ohne Ziel) bleiben bewusst
	   flächenlos: sie sind Struktur, kein anfassbares Objekt — sonst verspräche die
	   graue Fläche eine Interaktion, die es nicht gibt. */
	.admin-row:not(.is-interactive) {
		background: transparent;
	}
	/* Hover = nächste Flächenstufe PLUS sichtbare Kontur. Die Stufe allein trägt im
	   Dark-Mode nur ~1,12 : 1 gegen den neuen Ruhezustand; die Kontur macht den
	   Unterschied in beiden Modi eindeutig. */
	@media (hover: hover) {
		.is-interactive:hover {
			border-color: var(--ds-border-soft);
			background: var(--ds-surface-sunken);
		}
	}
	/* Fokus muss von Hover unterscheidbar bleiben → dieselbe Fläche, aber die
	   kräftige Interaktions-Kontur. Bewusst NICHT --ds-border: das ist im Dark-Mode
	   #2e2e2e und damit exakt die Fläche darunter (unsichtbar). --ds-border-hover
	   ist in beiden Modi eine echte Linie (hell #444 · dunkel #bababa). */
	.is-interactive:focus-within {
		border-color: var(--ds-border-hover);
		background: var(--ds-surface-sunken);
	}
	/* Drop-Indikator: Linie oben = „vor diesem Eintrag einfügen". */
	.is-dragover {
		box-shadow: 0 -2px 0 0 var(--ds-accent);
	}
</style>
