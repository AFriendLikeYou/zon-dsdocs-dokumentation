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
	class="switch"
	role="switch"
	aria-checked={checked}
	onclick={() => onchange(!checked)}
>
	<span class="switch__track" aria-hidden="true"></span>
	<span class="switch__label">{label}</span>
</button>

<style>
	.switch {
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
	.switch__track {
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
	.switch__track::after {
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
	.switch[aria-checked='true'] .switch__track {
		background: var(--ds-accent);
		border-color: var(--ds-accent);
	}
	.switch[aria-checked='true'] .switch__track::after {
		transform: translateX(14px);
		background: var(--ds-surface);
	}
	.switch__label {
		font-size: var(--ds-text-sm);
	}
	.switch:active .switch__track::after {
		transform: scale(0.92);
	}
	.switch[aria-checked='true']:active .switch__track::after {
		transform: translateX(14px) scale(0.92);
	}
	.switch:focus-visible {
		outline: 2px solid var(--ds-focus-ring);
		outline-offset: 2px;
	}
	@media (prefers-reduced-motion: reduce) {
		.switch__track,
		.switch__track::after {
			transition: none;
		}
	}
</style>
