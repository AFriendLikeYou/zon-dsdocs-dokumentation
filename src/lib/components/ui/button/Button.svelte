<!--
  Button.svelte — DIE Button-Komponente der Doku-UI (App-Chrome, nicht der
  dokumentierte ZEIT-DS-Button). Rendert die `.app-button`-Utility-Schicht
  (ADR-011) als <button> oder — mit `href` — als <a> mit identischer Optik.

  Zweck: EINE allgemeine Button-Komponente statt vieler roher <button> mit
  eigenem CSS. Die fünf Varianten bilden die real vorkommenden Cluster der
  App-UI ab (empirisch ermittelt, 2026-07-20):
    · default — gefüllt dunkel (Primär-Look, ehem. `.app-button`)
    · accent  — gefüllte Akzent-Fläche, weißer Text (Speichern/Anlegen)
    · ghost   — gerahmt auf Surface, Hover-Akzent-Rand (Werkzeug/Chip)
    · quiet   — transparent, gedämpfter Text (Verwerfen/Abbrechen)
    · danger  — transparent, Negativ-Farbe (Entfernen)

  Props:
    · variant   — Erscheinungsbild (s. o.), Default `default`
    · size      — sm (Default) | md | lg (reale Padding-Cluster)
    · href      — wenn gesetzt, rendert <a> statt <button>
    · type      — Button-Typ (nur ohne href relevant), Default `button`
    · disabled  — deaktiviert (bei <a> via aria-disabled + Klassen-Look)
    · iconLeft  — Snippet vor dem Label
    · iconRight — Snippet nach dem Label
    · class     — Passthrough für aufrufer-eigene Layout-Overrides
    · onclick   — Klick-Handler
    · …restProps — weitere native Attribute (aria-*, form, name …)

  Komposition: Reine Icon-Aktionen (icon-only) nutzen IconActionButton, nicht
  diese Komponente (dort sitzt der Reset-/Icon-Look + Pflicht-ariaLabel).
-->
<script lang="ts">
	import type { Snippet } from 'svelte';
	import type { HTMLAnchorAttributes, HTMLButtonAttributes } from 'svelte/elements';

	type Variant = 'default' | 'accent' | 'ghost' | 'quiet' | 'danger';
	type Size = 'sm' | 'md' | 'lg';

	type BaseProps = {
		/** Erscheinungsbild — bildet die realen App-UI-Cluster ab. */
		variant?: Variant;
		/** Größe aus den realen Padding-Clustern: sm (Default) | md | lg. */
		size?: Size;
		/** Gestrichelte Ghost-Kontur („hier entsteht Neues", Row-Add in Editoren). */
		dashed?: boolean;
		/** Wenn gesetzt: rendert <a href> statt <button> (gleiche Optik). */
		href?: string;
		/** Deaktiviert-Zustand (bei <a> via aria-disabled). */
		disabled?: boolean;
		/** Icon vor dem Label. */
		iconLeft?: Snippet;
		/** Icon nach dem Label. */
		iconRight?: Snippet;
		/** Passthrough-Klasse für Layout-Overrides des Aufrufers. */
		class?: string;
		/** Button-/Link-Inhalt (Label). */
		children: Snippet;
	};

	type Props = BaseProps &
		Omit<HTMLButtonAttributes, 'class' | 'disabled'> &
		Omit<HTMLAnchorAttributes, 'class' | 'href'>;

	let {
		variant = 'default',
		size = 'sm',
		dashed = false,
		href,
		disabled = false,
		iconLeft,
		iconRight,
		class: className = '',
		children,
		...restProps
	}: Props = $props();

	// Eine Klassen-Quelle für <button> und <a> — kein Drift zwischen den Zweigen.
	const classes = $derived(
		[
			'app-button',
			variant === 'accent' && 'app-button--accent',
			variant === 'ghost' && 'app-button--ghost',
			variant === 'quiet' && 'app-button--quiet',
			variant === 'danger' && 'app-button--danger',
			size === 'md' && 'app-button--md',
			size === 'lg' && 'app-button--lg',
			dashed && 'app-button--dashed',
			disabled && 'app-button--disabled',
			className
		]
			.filter(Boolean)
			.join(' ')
	);
</script>

{#if href}
	<a
		{href}
		class={classes}
		aria-disabled={disabled || undefined}
		tabindex={disabled ? -1 : undefined}
		{...restProps}
	>
		{#if iconLeft}{@render iconLeft()}{/if}
		{@render children()}
		{#if iconRight}{@render iconRight()}{/if}
	</a>
{:else}
	<button
		type={(restProps as HTMLButtonAttributes).type ?? 'button'}
		class={classes}
		{disabled}
		{...restProps}
	>
		{#if iconLeft}{@render iconLeft()}{/if}
		{@render children()}
		{#if iconRight}{@render iconRight()}{/if}
	</button>
{/if}
