<!--
  Color.svelte — Farb-Swatch mit Token-Name, optionalem Hex-Wert und Copy-Button.
  Verwendet auf den Brand-Farbseiten (color, pride-communication) und als
  CMS-Block „Farbfeld" (cms-components.ts); Copy läuft über CopyButton.
-->
<script lang="ts">
	import { CopyButton } from '$components/ui/copy-button';
	import { resolveCssVar } from '$lib/utils';

	type Props = {
		/** Token der Füllfarbe (--z-ds-* oder --ds-*), als CSS-Custom-Property. */
		colorCustomProperty: string;
		/** Token der Textfarbe auf der Fläche (optional). */
		fontColorCustomProperty?: string;
		/** Rahmenfarbe; leer = Rahmen erbt die Füllfarbe. */
		borderColor?: string;
		/** Kurzbeschreibung unter dem Titel. */
		description: string;
		/** Anzeigename des Swatch. */
		title: string;
		/** true = aufgelösten Hex-Wert kopieren (Brand-Hub-Default), false = Token-Namen. */
		copyHex?: boolean;
		/** true = aufgelösten Farbwert (Hex) zusätzlich unter dem Token anzeigen. */
		showValue?: boolean;
	};

	let {
		colorCustomProperty,
		fontColorCustomProperty,
		borderColor,
		description,
		title,
		copyHex = true,
		showValue = false
	}: Props = $props();

	// Leerer borderColor bedeutet „Rahmen = Füllfarbe" — abgeleitet statt Prop-Mutation.
	const resolvedBorder = $derived(borderColor === '' ? `var(${colorCustomProperty})` : borderColor);
	const fontColor = $derived(
		fontColorCustomProperty ? `var(${fontColorCustomProperty})` : undefined
	);

	/** Aufgelöster Farbwert aus dem geladenen styles-zds.css — nie Drift zum Upstream-Paket
	    (gleiches Muster wie foundation-tokens.ts / die Tokens-Seite). Nur im Browser. */
	let resolvedValue = $state('');
	$effect(() => {
		resolvedValue = resolveCssVar(colorCustomProperty);
	});

	function copyValue(): string {
		if (!copyHex) return colorCustomProperty;
		return resolveCssVar(colorCustomProperty) || colorCustomProperty;
	}
</script>

<div class="color-field">
	<div
		class="outer"
		style:background-color="var({colorCustomProperty})"
		style:border-color={resolvedBorder}
		style:color={fontColor}
	>
		<CopyButton
			class="btn-copy"
			oncopy={() => navigator.clipboard?.writeText(copyValue())}
			ariaLabel={`${copyHex ? 'Hex-Wert' : 'Token'} von „${title}" kopieren`}
			feedback="toast"
			toastMessage={`${copyHex ? 'Hex-Wert' : 'Token'} von „${title}" in die Zwischenablage kopiert.`}
		/>
	</div>

	<div class="meta">
		<div class="meta__head">
			<div class="meta__title">{title}</div>
			<small>{description}</small>
		</div>
		<code class="token-name">{colorCustomProperty}</code>
		{#if showValue && resolvedValue}
			<code class="resolved-value">{resolvedValue}</code>
		{/if}
	</div>
</div>

<style>
	.color-field {
		display: flex;
		flex-direction: column;
	}
	.outer {
		width: 150px;
		height: 100px;
		position: relative;
		border: 1px solid var(--ds-border-strong);
		border-radius: var(--ds-radius-sm);
	}
	.meta {
		display: flex;
		flex-direction: column;
	}
	.meta__head {
		display: flex;
		flex-direction: column;
		gap: var(--z-ds-space-4);
		margin-block: var(--z-ds-space-8);
	}

	small,
	code {
		opacity: 0.8;
	}
	.token-name {
		font-size: 0.5rem; /* bewusst sehr klein — voller Token-Name unter dem Swatch */
	}

	.resolved-value {
		font-size: 0.625rem;
		text-transform: uppercase;
		opacity: 0.65;
	}

	/* Positionierung + Look des Copy-Buttons über der Farbfläche.
	   :global, weil die Klasse auf dem <button> der CopyButton-Komponente landet. */
	:global(.btn-copy) {
		position: absolute;
		top: 4%;
		right: 3%;
		--copy-icon-size: 12px;
		padding: var(--z-ds-space-4);
		border-radius: var(--ds-radius-sm);
		/* Inverse Mini-Fläche auf einem Farbfeld — der Kontrast kommt aus der
		   Invertierung selbst; der Schatten trug im Dark-Mode 1,05 : 1. */
		background: var(--ds-text);
		color: var(--ds-surface);
		box-shadow: var(--ds-elevation-shadow);
	}
</style>
