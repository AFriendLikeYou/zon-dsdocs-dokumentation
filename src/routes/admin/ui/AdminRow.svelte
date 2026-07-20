<!--
  AdminRow — die kanonische Listenzeile aller CMS-Übersichten. Ein reines Gestalt-
  Gehäuse: gleiche Höhe, gleicher Radius und derselbe Hover-„Pill" wie die
  Sidebar-Einträge (Fläche hebt sich beim Hover leicht ab, weicher Rahmen). Der
  Inhalt (Icon, Titel, Meta, Aktionen) kommt als children von der Seite — so bleibt
  das Zeilen-Styling an EINER Stelle, während jede Seite ihre eigenen Felder füllt.

  Drag&Drop bleibt bewusst außerhalb: Die Brand-Übersicht hängt ihre nativen
  DnD-Handler + `draggable` einfach per Spread (`...rest`) an das gerenderte Element
  — die Logik lebt weiter in der Seite, nur die Optik liegt hier.

  Props:
  - tag:          gerendertes Element (‚div' | ‚li' | …), default ‚div'.
  - interactive:  Hover-Pill an/aus (Kategorie-Label z. B. = false).
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
	.admin-row {
		display: flex;
		align-items: center;
		gap: var(--z-ds-space-s);
		min-height: 2.5rem;
		padding: var(--z-ds-space-s) var(--z-ds-space-m);
		border: 1px solid transparent;
		border-radius: var(--ds-radius-sm);
		transition:
			border-color var(--ds-dur) var(--ds-ease-out),
			background var(--ds-dur) var(--ds-ease-out);
	}
	.is-indent {
		margin-left: var(--z-ds-space-xs);
	}
	@media (hover: hover) {
		.is-interactive:hover {
			border-color: var(--ds-border-soft);
			background: var(--ds-surface-raised);
		}
	}
	.is-interactive:focus-within {
		border-color: var(--ds-border-soft);
	}
	/* Drop-Indikator: Linie oben = „vor diesem Eintrag einfügen". */
	.is-dragover {
		box-shadow: 0 -2px 0 0 var(--ds-accent);
	}
</style>
