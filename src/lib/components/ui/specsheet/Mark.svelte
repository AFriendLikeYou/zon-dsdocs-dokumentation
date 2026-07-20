<!--
  Mark.svelte — geteiltes ✓/✕-Glyph für Do/Don't- und Wording-Listen.
  Bündelt Glyph-Wahl + Statusfarbe (gut = --ds-positive, schlecht = --ds-negative) +
  fetten Schnitt an einer Stelle. Layout (Größe, Position, flex) bleibt beim Aufrufer
  über die durchgereichte `class` (per :global gestylt).
-->
<script lang="ts">
	let { kind, class: className = '' }: {
		/** Glyph + Statusfarbe: 'good' = ✓ (--ds-positive), 'bad' = ✕ (--ds-negative). */
		kind: 'good' | 'bad';
		class?: string;
	} = $props();
</script>

<span class="mark mark--{kind} {className}" aria-hidden="true">{kind === 'good' ? '✓' : '✕'}</span>

<style>
	.mark {
		font-weight: 700;
	}
	.mark--good {
		color: var(--ds-positive);
	}
	.mark--bad {
		color: var(--ds-negative);
	}
</style>
