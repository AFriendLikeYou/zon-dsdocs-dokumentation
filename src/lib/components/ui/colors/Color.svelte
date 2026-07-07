<script lang="ts">
	import { CopyButton } from '$components/ui/copy-button';

	type Props = {
		colorCustomProperty: string;
		fontColorCustomProperty?: string;
		borderColor?: string;
		description: string;
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

	if (borderColor === '') {
		borderColor = `var(${colorCustomProperty})`;
	}

	/** Aufgelöster Farbwert aus dem geladenen styles-zds.css — nie Drift zum Upstream-Paket
	    (gleiches Muster wie foundation-tokens.ts / die Tokens-Seite). Nur im Browser. */
	function resolveValue(): string {
		if (typeof window === 'undefined') return '';
		return getComputedStyle(document.documentElement).getPropertyValue(colorCustomProperty).trim();
	}

	let resolvedValue = $state('');
	$effect(() => {
		resolvedValue = resolveValue();
	});

	function copyValue(): string {
		if (!copyHex || typeof window === 'undefined') return colorCustomProperty;
		return resolveValue() || colorCustomProperty;
	}
</script>

<div style="display: flex; flex-direction: column;">
	<div
		class="outer"
		style="background-color: var({colorCustomProperty}); border-color: {borderColor}; color: var({fontColorCustomProperty});"
	>
		<CopyButton
			class="btn-copy"
			onCopy={() => navigator.clipboard?.writeText(copyValue())}
			ariaLabel={`${copyHex ? 'Hex-Wert' : 'Token'} von „${title}" kopieren`}
			feedback="toast"
			toastMessage={`${copyHex ? 'Hex-Wert' : 'Token'} von „${title}" in die Zwischenablage kopiert.`}
		/>
	</div>

	<div style="display: flex; flex-direction: column; ">
		<div style="display: flex; flex-direction: column; gap: 0.25rem; margin-block: 0.5rem;">
			<div style="margin-block: 0;">{title}</div>
			<small>{description}</small>
		</div>
		<code style="font-size: 0.5rem;">{colorCustomProperty}</code>
		{#if showValue && resolvedValue}
			<code class="resolved-value">{resolvedValue}</code>
		{/if}
	</div>
</div>

<style>
	.outer {
		width: 150px;
		height: 100px;
		position: relative;
		border: 1px solid var(--ds-border-strong);
		border-radius: 4px;
	}

	small,
	code {
		opacity: 0.8;
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
		padding: 0.25rem;
		border-radius: var(--ds-radius-sm);
		background: var(--ds-text);
		color: var(--ds-surface);
		box-shadow: var(--ds-shadow-sm);
	}
</style>
