<script lang="ts">
	import { getToastState } from '$lib/toast-state.svelte';
	import { copyStringToClipboard } from '$lib/utils';

	type Props = {
		colorCustomProperty: string;
		fontColorCustomProperty?: string;
		borderColor?: string;
		description: string;
		title: string;
	};

	let { colorCustomProperty, fontColorCustomProperty, borderColor, description, title }: Props =
		$props();

	if (borderColor === '') {
		borderColor = `var(${colorCustomProperty})`;
	}

	const toastState = getToastState();
</script>

<div style="display: flex; flex-direction: column;">
	<div
		class="outer"
		style="background-color: var({colorCustomProperty}); border-color: {borderColor}; color: var({fontColorCustomProperty});"
	>
		<button
			class="zon-button btn-copy"
			aria-label={`${colorCustomProperty} in der Zwischenablage kopieren`}
			onclick={async () => {
				await copyStringToClipboard(colorCustomProperty);
				toastState.add(
					'Kopieren',
					`Farbe "${colorCustomProperty}" wurde in die Zwischenablage kopiert.`
				);
			}}
		>
			<svg
				xmlns="http://www.w3.org/2000/svg"
				width="10"
				height="10"
				viewBox="0 0 24 24"
				fill="none"
				stroke="currentColor"
				stroke-width="2"
				stroke-linecap="round"
				stroke-linejoin="round"
				><rect width="14" height="14" x="8" y="8" rx="2" ry="2" /><path
					d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"
				/></svg
			>
		</button>
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
		border: 1px solid var(--z-ds-color-border-100);
		border-radius: 4px;
	}

	small,
	code {
		opacity: 0.8;
	}

	.btn-copy {
		position: absolute;
		top: 4%;
		right: 3%;
		border: none;
		padding: 0.25rem;
		box-shadow: var(--z-ds-boxshadow-base);
	}
</style>
