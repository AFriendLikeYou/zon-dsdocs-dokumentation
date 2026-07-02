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
	};

	let {
		colorCustomProperty,
		fontColorCustomProperty,
		borderColor,
		description,
		title,
		copyHex = true
	}: Props = $props();

	if (borderColor === '') {
		borderColor = `var(${colorCustomProperty})`;
	}

	function copyValue(): string {
		if (!copyHex || typeof window === 'undefined') return colorCustomProperty;
		const hex = getComputedStyle(document.documentElement)
			.getPropertyValue(colorCustomProperty)
			.trim();
		return hex || colorCustomProperty;
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
