<!--
  AdminFlash — einheitliches Hinweis-/Statusband (Erfolg, Fehler, Warnung, Info)
  für die CMS-Seiten. Ersetzt die zuvor pro Seite dreifach kopierten .flash-Blöcke.
  Der Ton steuert nur die Tönung der Fläche; Inhalt kommt als children.

  Props:
  - tone:  ‚ok' | ‚err' | ‚warn' | ‚info' (default ‚info').
  - role?: ARIA-Live-Rolle (‚status' | ‚alert') — z. B. ‚alert' für Fehler.
-->
<script lang="ts">
	import type { Snippet } from 'svelte';

	let {
		tone = 'info',
		role,
		children
	}: {
		tone?: 'ok' | 'err' | 'warn' | 'info';
		role?: 'status' | 'alert';
		children: Snippet;
	} = $props();
</script>

<p class="flash flash--{tone}" {role}>{@render children()}</p>

<style>
	.flash {
		display: flex;
		align-items: center;
		gap: var(--z-ds-space-m);
		flex-wrap: wrap;
		padding: var(--z-ds-space-s) var(--z-ds-space-m);
		border-radius: var(--ds-radius-sm);
		margin-bottom: var(--z-ds-space-l);
		font-size: var(--ds-text-sm);
		color: var(--ds-text);
	}
	.flash--ok {
		background: rgb(from var(--ds-positive) r g b / 0.12);
	}
	.flash--err {
		background: rgb(from var(--ds-negative) r g b / 0.12);
	}
	.flash--warn {
		background: rgb(from var(--ds-warning) r g b / 0.15);
	}
	.flash--info {
		background: var(--ds-surface-raised);
	}
	.flash :global(code) {
		font-family: var(--ds-font-mono);
		font-size: 0.9em;
	}
</style>
