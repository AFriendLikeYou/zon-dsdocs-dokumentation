<!--
  StageToggle.svelte — Light/Dark-Umschalter für Specimen-Bühnen (Playground, Anatomy).
  Rein visuell + a11y; der Parent hält den State und reicht `isDark` + Handler herein.
  Nutzt die je Bühne gepinnten --z-ds-Token → adaptiert automatisch ans Bühnen-Theme.
-->
<script lang="ts">
	let {
		isDark = false,
		onlight,
		ondark
	}: { isDark?: boolean; onlight: () => void; ondark: () => void } = $props();
</script>

<div class="stage-toggle" role="group" aria-label="Vorschau-Hintergrund">
	<button
		type="button"
		class="stage-toggle__btn"
		aria-label="Heller Hintergrund"
		aria-pressed={!isDark}
		onclick={onlight}
	>
		<svg
			aria-hidden="true"
			width="14"
			height="14"
			viewBox="0 0 24 24"
			fill="none"
			stroke="currentColor"
			stroke-width="2"
			stroke-linecap="round"
			stroke-linejoin="round"
		>
			<circle cx="12" cy="12" r="4" />
			<path
				d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41"
			/>
		</svg>
	</button>
	<button
		type="button"
		class="stage-toggle__btn"
		aria-label="Dunkler Hintergrund"
		aria-pressed={isDark}
		onclick={ondark}
	>
		<svg
			aria-hidden="true"
			width="14"
			height="14"
			viewBox="0 0 24 24"
			fill="none"
			stroke="currentColor"
			stroke-width="2"
			stroke-linecap="round"
			stroke-linejoin="round"
		>
			<path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z" />
		</svg>
	</button>
</div>

<style>
	.stage-toggle {
		display: inline-flex;
		gap: 2px;
		padding: 3px;
		border-radius: 999px;
		background: color-mix(in srgb, var(--z-ds-color-text-100) 7%, transparent);
	}
	.stage-toggle__btn {
		display: grid;
		place-items: center;
		width: 26px;
		height: 26px;
		border: none;
		background: none;
		border-radius: 999px;
		color: var(--z-ds-color-text-55);
		cursor: pointer;
		transition:
			color var(--ds-dur) var(--ds-ease),
			background-color var(--ds-dur) var(--ds-ease),
			transform var(--ds-dur) var(--ds-ease-out);
	}
	.stage-toggle__btn[aria-pressed='true'] {
		background: var(--z-ds-color-background-0);
		color: var(--z-ds-color-text-100);
		box-shadow: var(--ds-shadow-sm);
	}
	@media (hover: hover) and (pointer: fine) {
		.stage-toggle__btn:hover {
			color: var(--z-ds-color-text-100);
		}
	}
	.stage-toggle__btn:active {
		transform: scale(0.94);
	}
	.stage-toggle__btn:focus-visible {
		outline: 2px solid var(--ds-focus-ring);
		outline-offset: 2px;
	}
	@media (prefers-reduced-motion: reduce) {
		.stage-toggle__btn {
			transition: none;
		}
	}
</style>
