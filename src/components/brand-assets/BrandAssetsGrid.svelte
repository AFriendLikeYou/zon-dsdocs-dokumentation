<script lang="ts">
	import { getToastState } from '$lib/toast-state.svelte';
	import { copySVGToClipboard, downloadIcon } from '$lib/utils';
	import type { Icon } from '../../global';

	let { brandAssets }: { brandAssets: Icon[] } = $props();

	const toastState = getToastState();
</script>

<div class="grid">
	{#each brandAssets as icon (icon.slug)}
		<div class="zon-icon__container">
			<div class="bg-grid"></div>
			<div class="zon__icon">
				{@html icon.svg}
			</div>

			<div class="zon-icon__actions">
				<button
					aria-label={`Download ${icon.name} icon`}
					onclick={() => {
						downloadIcon(icon);
						toastState.add('Download', `Das Icon "${icon.name}" wurde heruntergeladen.`);
					}}
				>
					<svg
						width="14"
						height="14"
						viewBox="0 0 18 18"
						fill="none"
						xmlns="http://www.w3.org/2000/svg"
					>
						<title>Herunterladen</title>
						<path d="M9 2V12" stroke="currentColor" stroke-width="1.5" />
						<path d="M5.5 8.5L9 12L12.5 8.5" stroke="currentColor" stroke-width="1.5" />
						<path
							d="M2.75 9V15c0 0.14 0.11 0.25 0.25 0.25H15c0.14 0 0.25-0.11 0.25-0.25V9"
							stroke="currentColor"
							stroke-width="1.5"
						/>
					</svg>
				</button>
				<button
					aria-label={`${icon.name} in der Zwischenablage kopieren`}
					onclick={async () => {
						await copySVGToClipboard(icon);
						toastState.add('Kopieren', `Asset "${icon.name}" wurde in die Zwischenablage kopiert.`);
					}}
				>
					<svg
						xmlns="http://www.w3.org/2000/svg"
						width="14"
						height="14"
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
		</div>
	{/each}
</div>

<style>
	.grid {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
		gap: var(--z-ds-space-8);
		margin-block: var(--z-ds-space-16);
		width: 100%;
		max-width: 100%;
	}

	.zon-icon__container {
		position: relative;
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		gap: var(--z-ds-space-16);
		padding: var(--z-ds-space-l);
		border-radius: var(--z-ds-border-radius-4);
		border: 1px solid var(--z-ds-color-border-70);
		background-color: var(--z-ds-color-background-0);

		.zon__icon {
			display: flex;
			text-align: center;
			align-items: center;
			flex-direction: column;
			gap: var(--z-ds-space-8);
		}

		button:has(svg) {
			background-color: var(--z-ds-color-background-0);
			border: 1px solid var(--z-ds-color-border-100);
			cursor: pointer;
			padding: 0.25rem;
			border-radius: var(--z-ds-border-radius-4);
			display: flex;
			align-items: center;
			justify-content: center;
			color: var(--z-ds-color-text-100);
			opacity: 1;
			transition: opacity 0.2s;
			z-index: 1;
		}

		button:has(svg):hover {
			background-color: var(--z-ds-color-background-10);
		}

		.zon-icon__actions {
			display: flex;
			gap: var(--z-ds-space-8);
			margin-top: auto;
		}
	}
</style>
