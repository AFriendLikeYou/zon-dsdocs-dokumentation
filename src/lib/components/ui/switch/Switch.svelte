<!--
  Switch.svelte — kleiner An/Aus-Schalter mit Label (Boolean-Controls).

  Im Gegensatz zum Chip liest ein Switch eindeutig als „an/aus" statt als
  „einer von mehreren Werten" — im Playground bedienen Chips die Auswahl
  (SegmentedControl) und Switches die Booleans. Läuft auf --ds-Rollen-Tokens
  (Controls-Zeile liegt im Page-Theme, nicht auf der Bühne).
-->
<script lang="ts">
	let {
		label,
		checked = false,
		onchange
	}: { label: string; checked?: boolean; onchange: (checked: boolean) => void } = $props();
</script>

<button
	type="button"
	class="sw"
	role="switch"
	aria-checked={checked}
	onclick={() => onchange(!checked)}
>
	<span class="sw-track" aria-hidden="true"></span>
	<span class="sw-label">{label}</span>
</button>

<style>
	.sw {
		display: inline-flex;
		align-items: center;
		gap: var(--z-ds-space-8);
		border: none;
		background: none;
		padding: 2px;
		font: inherit;
		color: var(--ds-text);
		cursor: pointer;
		border-radius: var(--ds-radius-sm);
	}
	.sw-track {
		position: relative;
		flex: none;
		width: 34px;
		height: 20px;
		border-radius: 999px;
		background: var(--ds-surface-sunken);
		border: 1px solid var(--ds-border);
		transition:
			background-color var(--ds-dur) var(--ds-ease),
			border-color var(--ds-dur) var(--ds-ease);
	}
	.sw-track::after {
		content: '';
		position: absolute;
		top: 2px;
		left: 2px;
		width: 14px;
		height: 14px;
		border-radius: 50%;
		background: var(--ds-surface);
		box-shadow: var(--ds-shadow-sm);
		transition: transform var(--ds-dur) var(--ds-ease-out);
	}
	.sw[aria-checked='true'] .sw-track {
		background: var(--ds-accent);
		border-color: var(--ds-accent);
	}
	.sw[aria-checked='true'] .sw-track::after {
		transform: translateX(14px);
		background: var(--ds-surface);
	}
	.sw-label {
		font-size: var(--ds-text-sm);
	}
	.sw:active .sw-track::after {
		transform: scale(0.92);
	}
	.sw[aria-checked='true']:active .sw-track::after {
		transform: translateX(14px) scale(0.92);
	}
	.sw:focus-visible {
		outline: 2px solid var(--ds-focus-ring);
		outline-offset: 2px;
	}
	@media (prefers-reduced-motion: reduce) {
		.sw-track,
		.sw-track::after {
			transition: none;
		}
	}
</style>
