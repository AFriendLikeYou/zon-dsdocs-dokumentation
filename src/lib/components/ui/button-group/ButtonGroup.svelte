<!--
  ButtonGroup.svelte — bündelt nebeneinanderliegende Aktions-Buttons zu EINER
  semantischen Gruppe (role=group). Ersetzt die real vorkommenden Button-Cluster
  der App-UI: die ↑/↓-Nudge-Paare (Brand-/Admin-Reorder), das Drift-Aktionspaar
  (Spec-Editor) und das Aktionslayout der Dialog-Leiste. Nur ECHTE Gruppen —
  nicht jede zufällige Button-Nachbarschaft.

  Rein darstellend: Kinder (Button/IconActionButton) kommen als Snippet, die Gruppe
  ordnet sie nur an (Flex-Reihe) und trägt die a11y-Semantik.

  Props:
    · attached — zusammengewachsene Segmente: die inneren Radien werden 0, die
                 Border geteilt (ein Rahmen ums Paar). Für die ↑/↓-Nudge-Paare.
    · gap      — Abstand zwischen freistehenden Buttons: 'sm' (Default) | 'md'.
                 Bei `attached` ignoriert (die Segmente stoßen aneinander).
    · align    — Ausrichtung entlang der Reihe: 'start' (Default) | 'center' | 'end'.
    · label    — aria-label der Gruppe (empfohlen, wenn der Zweck nicht aus dem
                 Umfeld hervorgeht, z. B. „Position ändern").
    · class    — Passthrough für aufrufer-eigene Layout-Overrides.

  Komposition: Für einen einzelnen Button KEINE Gruppe. Segment-Toggles (einer von
  N) sind kein ButtonGroup, sondern `ui/segmented-control/`.
-->
<script lang="ts">
	import type { Snippet } from 'svelte';

	type Gap = 'sm' | 'md';
	type Align = 'start' | 'center' | 'end';

	let {
		attached = false,
		gap = 'sm',
		align = 'start',
		label,
		class: className = '',
		children
	}: {
		/** Zusammengewachsene Segmente (innere Radien 0, geteilte Border). */
		attached?: boolean;
		/** Abstand freistehender Buttons (bei attached ignoriert). */
		gap?: Gap;
		/** Ausrichtung entlang der Reihe. */
		align?: Align;
		/** aria-label der Gruppe. */
		label?: string;
		/** Passthrough-Klasse. */
		class?: string;
		/** Buttons als Kinder. */
		children: Snippet;
	} = $props();

	const classes = $derived(
		[
			'button-group',
			attached ? 'button-group--attached' : `button-group--gap-${gap}`,
			`button-group--${align}`,
			className
		]
			.filter(Boolean)
			.join(' ')
	);
</script>

<div class={classes} role="group" aria-label={label}>
	{@render children()}
</div>

<style>
	.button-group {
		display: inline-flex;
		align-items: center;
	}
	.button-group--gap-sm {
		gap: var(--z-ds-space-4);
	}
	.button-group--gap-md {
		gap: var(--z-ds-space-8);
	}
	.button-group--start {
		justify-content: flex-start;
	}
	.button-group--center {
		justify-content: center;
	}
	.button-group--end {
		justify-content: flex-end;
	}

	/* Zusammengewachsene Segmente: Buttons stoßen aneinander, innere Radien 0,
	   geteilte Border (der rechte Nachbar überlappt die linke Kante um 1px). Greift
	   generisch auf direkte Kinder (Button/IconActionButton), daher :global. */
	.button-group--attached {
		gap: 0;
	}
	.button-group--attached > :global(:not(:first-child)) {
		border-top-left-radius: 0;
		border-bottom-left-radius: 0;
		margin-left: -1px;
	}
	.button-group--attached > :global(:not(:last-child)) {
		border-top-right-radius: 0;
		border-bottom-right-radius: 0;
	}
	/* Fokussiertes Segment nach vorn, damit der Ring nicht vom Nachbarn verdeckt wird. */
	.button-group--attached > :global(:focus-visible) {
		position: relative;
		z-index: 1;
	}
</style>
