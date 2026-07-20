<!--
  Checkbox.svelte — das gemeinsame Häkchen-Atom der Doku-UI (App-Chrome, NICHT der
  dokumentierte ZEIT-DS). Für echte Booleans, die als „an/aus"-Häkchen (nicht als
  Toggle-Switch) gelesen werden — z. B. optionale Schalter in Editor-Formularen.

  Optik lehnt an die Feld-/Editor-Sprache an (radius-sm, --ds-border-strong): das
  eigentliche <input> ist visuell versteckt (sr-only), die sichtbare Box ist ein
  aria-hidden-<span>. Checked = --ds-accent-Fläche + weißer CheckIcon. Der Fokusring
  (.focus-ring) und das Emil-:active-Feedback (leichter scale) sitzen auf der Box.

  Mit `label` rendert die ganze Zeile als klickbares <label> (Häkchen links, Text
  rechts). `checked` ist bind:value-fähig ($bindable); `onchange` liefert zusätzlich
  den neuen Zustand.

  Nutzung:
    <Checkbox bind:checked={foo} label="Resize-Handle anzeigen" />
    <Checkbox bind:checked={bar} onchange={(v) => …} disabled />
-->
<script lang="ts">
	import type { HTMLInputAttributes } from 'svelte/elements';
	import { CheckIcon } from '$lib/icons';

	type Props = {
		/** An/Aus-Zustand (bind:checked-fähig). */
		checked?: boolean;
		/** Callback beim Umschalten (neuer Zustand). */
		onchange?: (checked: boolean) => void;
		/** Klickbares Label rechts vom Häkchen. */
		label?: string;
		/** Deaktiviert-Zustand. */
		disabled?: boolean;
		/** Zusätzliche Klassen auf dem Wrapper. */
		class?: string;
	} & Omit<HTMLInputAttributes, 'checked' | 'class' | 'type' | 'onchange'>;

	let {
		checked = $bindable(false),
		onchange,
		label,
		disabled = false,
		class: className = '',
		...restProps
	}: Props = $props();

	function handleChange(e: Event & { currentTarget: HTMLInputElement }) {
		checked = e.currentTarget.checked;
		onchange?.(checked);
	}
</script>

<label class="checkbox {className}" class:checkbox--disabled={disabled}>
	<input
		type="checkbox"
		class="checkbox__input"
		bind:checked
		{disabled}
		onchange={handleChange}
		{...restProps}
	/>
	<span class="checkbox__box focus-ring" aria-hidden="true">
		<CheckIcon class="checkbox__check" width={12} height={12} />
	</span>
	{#if label}
		<span class="checkbox__label">{label}</span>
	{/if}
</label>

<style>
	.checkbox {
		display: inline-flex;
		align-items: center;
		gap: var(--z-ds-space-8);
		cursor: pointer;
		color: var(--ds-text);
	}
	.checkbox--disabled {
		cursor: not-allowed;
		opacity: 0.55;
	}

	/* Das echte <input> visuell verstecken, aber bedien-/screenreaderbar lassen. */
	.checkbox__input {
		position: absolute;
		width: 1px;
		height: 1px;
		margin: -1px;
		padding: 0;
		border: 0;
		clip: rect(0 0 0 0);
		clip-path: inset(50%);
		overflow: hidden;
		white-space: nowrap;
	}

	/* Sichtbare Box — Editor-/Feld-Optik. */
	.checkbox__box {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		flex: none;
		width: 18px;
		height: 18px;
		border: 1px solid var(--ds-border-strong);
		border-radius: var(--ds-radius-sm);
		background: var(--ds-surface);
		color: var(--ds-static-white, #fff);
		transition:
			background-color var(--ds-dur) var(--ds-ease-out),
			border-color var(--ds-dur) var(--ds-ease-out),
			transform var(--ds-dur) var(--ds-ease-out);
	}
	/* Häkchen startet unsichtbar; erscheint erst im checked-Zustand. */
	.checkbox__box :global(.checkbox__check) {
		opacity: 0;
		transform: scale(0.6);
		transition:
			opacity var(--ds-dur) var(--ds-ease-out),
			transform var(--ds-dur) var(--ds-ease-out);
	}

	@media (hover: hover) and (pointer: fine) {
		.checkbox:not(.checkbox--disabled):hover .checkbox__box {
			border-color: var(--ds-border-hover, var(--ds-accent));
		}
	}

	/* Checked: Akzent-Fläche + weißes Häkchen. */
	.checkbox__input:checked + .checkbox__box {
		background: var(--ds-accent);
		border-color: var(--ds-accent);
	}
	.checkbox__input:checked + .checkbox__box :global(.checkbox__check) {
		opacity: 1;
		transform: scale(1);
	}

	/* Emil-:active-Feedback (leichter Stauch-Impuls beim Drücken). */
	.checkbox:not(.checkbox--disabled):active .checkbox__box {
		transform: scale(0.92);
	}

	/* Fokusring am Kasten (Klasse .focus-ring liegt auf .checkbox__box). Das echte
	   <input> ist sr-only → :focus-visible dort auf die Box spiegeln. */
	.checkbox__input:focus-visible + .checkbox__box {
		outline: 2px solid var(--ds-focus-ring);
		outline-offset: 2px;
	}

	.checkbox__label {
		font-size: var(--ds-text-sm);
		line-height: 1.3;
	}

	@media (prefers-reduced-motion: reduce) {
		.checkbox__box,
		.checkbox__box :global(.checkbox__check) {
			transition: none;
		}
	}
</style>
