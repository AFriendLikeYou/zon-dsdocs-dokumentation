<!--
  ButtonPlayground.svelte — Doku der echten ZEIT-Button-Familien (z-button, z-text-button,
  z-page-shortcut, buttongroup). Nutzt den generischen <Playground>-Harness; hier leben nur
  die button-spezifischen „Daten" (Familien-Tabs, Controls, Specimen-Snippet, Code) und die
  realen DS-Klassen (scoped unter .zbp, dynamische Klassen → :global).
-->
<script lang="ts">
	import { Chip } from '$components/ui/chip';
	import { Playground, type PlaygroundControl, type PlaygroundState } from '$components/ui/playground';

	type Family = 'z-button' | 'z-text-button' | 'z-page-shortcut' | 'buttongroup';
	const FAMILIES: { id: Family; label: string }[] = [
		{ id: 'z-button', label: 'z-button' },
		{ id: 'z-text-button', label: 'z-text-button' },
		{ id: 'z-page-shortcut', label: 'z-page-shortcut' },
		{ id: 'buttongroup', label: 'buttongroup' }
	];
	let family = $state<Family>('z-button');

	// ── z-button ──
	const zbControls: PlaygroundControl[] = [
		{
			key: 'variant',
			label: 'Variant',
			type: 'select',
			default: 'primary',
			options: [
				{ value: 'default', label: 'Default' },
				{ value: 'primary', label: 'Primary' },
				{ value: 'zplus', label: 'Z+' }
			]
		},
		{ key: 'fullwidth', label: 'Fullwidth', type: 'toggle' },
		{ key: 'disabled', label: 'Disabled', type: 'toggle' }
	];
	const zbClass = (s: PlaygroundState) =>
		[
			'z-button',
			s.variant === 'primary' ? 'z-button--primary' : s.variant === 'zplus' ? 'z-button--zplus' : '',
			s.fullwidth ? 'z-button--fullwidth' : ''
		]
			.filter(Boolean)
			.join(' ');
	const zbCode = (s: PlaygroundState) =>
		`<button type="submit" class="${zbClass(s)}"${s.disabled ? ' disabled' : ''}>Click me</button>`;

	// ── z-text-button ──
	const tbControls: PlaygroundControl[] = [
		{
			key: 'size',
			label: 'Size',
			type: 'select',
			default: 'default',
			options: [
				{ value: 'default', label: 'Default' },
				{ value: 'slim', label: 'Slim' },
				{ value: 'large', label: 'Large' }
			]
		},
		{ key: 'bold', label: 'Bold', type: 'toggle' },
		{ key: 'active', label: 'Active', type: 'toggle' },
		{ key: 'onImage', label: 'On Image', type: 'toggle' },
		{ key: 'disabled', label: 'Disabled', type: 'toggle' }
	];
	const tbClass = (s: PlaygroundState) =>
		[
			'z-text-button',
			s.size === 'large' ? 'z-text-button--large' : s.size === 'slim' ? 'z-text-button--slim' : '',
			s.bold ? 'z-text-button--bold' : '',
			s.active ? 'z-text-button--active' : '',
			s.onImage ? 'z-text-button--on-image' : ''
		]
			.filter(Boolean)
			.join(' ');
	const tbCode = (s: PlaygroundState) =>
		`<button type="button" class="${tbClass(s)}"${s.disabled ? ' disabled' : ''}>Mehr anzeigen</button>`;

	// ── buttongroup ── (aktives Segment über Klick im Specimen → State-Key 'active')
	const bgItems = ['Alle', 'Politik', 'Wirtschaft', 'Kultur'];
	const bgActive = (s: PlaygroundState) => (typeof s.active === 'number' ? s.active : 0);
	const bgCode = (s: PlaygroundState) =>
		`<ul class="buttongroup">\n` +
		bgItems
			.map(
				(label, i) =>
					`  <li class="buttongroup-item${i === bgActive(s) ? ' buttongroup-item--active' : ''}">\n` +
					`    <button class="buttongroup-button">${label}</button>\n  </li>`
			)
			.join('\n') +
		`\n</ul>`;

	// ── z-page-shortcut ──
	const psCode = () =>
		`<button type="button" class="z-page-shortcut">\n  <span>Zur Startseite</span>\n</button>`;
</script>

<div class="zbp">
	<div class="zbp-tabs" role="tablist" aria-label="Button-Familie">
		{#each FAMILIES as f (f.id)}
			<Chip
				mono
				variant={family === f.id ? 'accent' : 'neutral'}
				emphasis={family === f.id}
				onclick={() => (family = f.id)}>{f.label}</Chip
			>
		{/each}
	</div>

	{#if family === 'z-button'}
		<Playground controls={zbControls} code={zbCode}>
			{#snippet preview(s)}
				<button type="submit" class={zbClass(s)} disabled={!!s.disabled}>Click me</button>
			{/snippet}
		</Playground>
	{:else if family === 'z-text-button'}
		<Playground controls={tbControls} code={tbCode} darkKey="onImage">
			{#snippet preview(s)}
				<button type="button" class={tbClass(s)} disabled={!!s.disabled}>Mehr anzeigen</button>
			{/snippet}
		</Playground>
	{:else if family === 'z-page-shortcut'}
		<Playground hint="Keine Varianten — ein Stil mit Hover-/Focus-State." code={psCode}>
			{#snippet preview()}
				<button type="button" class="z-page-shortcut"><span>Zur Startseite</span></button>
			{/snippet}
		</Playground>
	{:else}
		<Playground hint="Klicke ein Segment, um den aktiven Zustand zu setzen." code={bgCode}>
			{#snippet preview(s)}
				<ul class="buttongroup">
					{#each bgItems as label, i (label)}
						<li class="buttongroup-item" class:buttongroup-item--active={i === bgActive(s)}>
							<button class="buttongroup-button" onclick={() => (s.active = i)}>{label}</button>
						</li>
					{/each}
				</ul>
			{/snippet}
		</Playground>
	{/if}
</div>

<style>
	.zbp {
		display: flex;
		flex-direction: column;
	}
	.zbp-tabs {
		display: flex;
		flex-wrap: wrap;
		gap: var(--z-ds-space-6);
		margin-block: var(--z-ds-space-16) 0;
	}

	/* ── Reale ZEIT-Button-Familien (scoped auf .zbp, dynamische Klassen → :global) ── */
	.zbp :global(.z-button) {
		background-color: var(--z-ds-color-background-10);
		border: none;
		border-radius: var(--z-ds-border-radius-4);
		color: var(--z-ds-color-text-100);
		display: inline-block;
		font-size: var(--z-ds-fontsize-16);
		font-weight: bold;
		line-height: 1.25rem;
		margin: 0;
		padding: var(--z-ds-space-10) var(--z-ds-space-16);
		text-align: center;
		transition: background-color 200ms ease-out;
		white-space: nowrap;
		cursor: pointer;
	}
	.zbp :global(.z-button:hover),
	.zbp :global(.z-button:focus) {
		background-color: var(--z-ds-color-background-20);
	}
	.zbp :global(.z-button--fullwidth) {
		width: 100%;
	}
	.zbp :global(.z-button--primary) {
		background-color: var(--z-ds-color-text-100);
		color: var(--z-ds-color-background-0);
	}
	.zbp :global(.z-button--primary:hover),
	.zbp :global(.z-button--primary:focus) {
		background-color: var(--z-ds-color-text-70);
		color: var(--z-ds-color-background-0);
	}
	.zbp :global(.z-button--zplus) {
		background-color: var(--z-ds-color-accent-100);
		color: var(--z-ds-color-general-white-100);
	}
	.zbp :global(.z-button--zplus:hover),
	.zbp :global(.z-button--zplus:focus) {
		background-color: var(--z-ds-color-accent-70);
		color: var(--z-ds-color-general-white-100);
	}
	.zbp :global(.z-button:focus-visible) {
		outline: 2px solid var(--z-ds-color-focus-100);
		outline-offset: 2px;
	}
	.zbp :global(.z-button:disabled) {
		pointer-events: none;
		opacity: 0.5;
	}

	.zbp :global(.z-text-button) {
		align-items: center;
		background-color: transparent;
		border-radius: var(--z-ds-border-radius-4);
		border-width: 0;
		color: var(--z-ds-color-text-70);
		cursor: pointer;
		display: inline-flex;
		font-size: var(--z-ds-fontsize-14);
		gap: var(--z-ds-space-xxxs);
		line-height: 1.125rem;
		margin: 0;
		padding: var(--z-ds-space-xs);
		transition:
			background-color 200ms ease-out,
			color 200ms ease-out;
		white-space: nowrap;
	}
	.zbp :global(.z-text-button--slim) {
		padding-block: var(--z-ds-space-6);
	}
	.zbp :global(.z-text-button--large) {
		font-size: var(--z-ds-fontsize-16);
	}
	.zbp :global(.z-text-button--bold) {
		font-weight: bold;
	}
	.zbp :global(.z-text-button--active) {
		background-color: var(--z-ds-color-background-10);
		color: var(--z-ds-color-text-100);
	}
	.zbp :global(.z-text-button:hover) {
		background-color: var(--z-ds-color-background-10);
		color: var(--z-ds-color-text-100);
	}
	.zbp :global(.z-text-button:focus-visible) {
		outline: 2px solid var(--z-ds-color-focus-100);
	}
	.zbp :global(.z-text-button:disabled) {
		background-color: transparent;
		color: var(--z-ds-color-text-55);
		cursor: default;
	}
	.zbp :global(.z-text-button--on-image) {
		color: rgba(255, 255, 255, 0.6);
	}
	.zbp :global(.z-text-button--on-image:hover) {
		background-color: var(--z-ds-color-general-black-60);
		color: var(--z-ds-color-general-white-100);
	}

	.zbp :global(.z-page-shortcut) {
		align-items: center;
		background-color: transparent;
		border: 1px solid var(--z-ds-color-border-70);
		border-radius: var(--z-ds-border-radius-4);
		color: var(--z-ds-color-text-100);
		cursor: pointer;
		display: inline-flex;
		font-size: var(--z-ds-fontsize-16);
		gap: var(--z-ds-space-xs);
		line-height: 1rem;
		margin: 0;
		padding: var(--z-ds-space-xs);
		transition:
			background-color 200ms ease-out,
			border-color 200ms ease-out;
		white-space: nowrap;
	}
	.zbp :global(.z-page-shortcut:hover),
	.zbp :global(.z-page-shortcut:focus) {
		border-color: var(--z-ds-color-border-100);
	}
	.zbp :global(.z-page-shortcut:focus-visible) {
		outline: 2px solid var(--z-ds-color-focus-100);
	}

	.zbp :global(.buttongroup) {
		list-style: none;
		margin: 0;
		padding: 0;
		display: flex;
		width: max-content;
		max-width: 100%;
	}
	.zbp :global(.buttongroup-item) {
		background: var(--z-ds-color-background-10);
		border: 0.125rem var(--z-ds-color-background-10) solid;
		color: var(--z-ds-color-text-55);
		display: inline-block;
		font-size: var(--z-ds-fontsize-16);
		line-height: 1.25rem;
		position: relative;
	}
	.zbp :global(.buttongroup-item--active .buttongroup-button) {
		background: var(--z-ds-color-background-0);
		color: var(--z-ds-color-text-100);
		cursor: default;
	}
	.zbp :global(.buttongroup-item:first-child) {
		border-radius: var(--z-ds-border-radius-4) 0 0 var(--z-ds-border-radius-4);
	}
	.zbp :global(.buttongroup-item:last-child) {
		border-radius: 0 var(--z-ds-border-radius-4) var(--z-ds-border-radius-4) 0;
	}
	.zbp :global(button.buttongroup-button) {
		background-color: transparent;
		border-width: 0;
		color: inherit;
		cursor: pointer;
		font: inherit;
		margin: 0;
		border-radius: var(--z-ds-border-radius-4);
		display: inline-block;
		padding: var(--z-ds-space-xs) var(--z-ds-space-m);
		transition: background-color 300ms ease-out;
	}
	.zbp :global(.buttongroup-item:not(.buttongroup-item--active) .buttongroup-button:hover) {
		background-color: var(--z-ds-color-background-20);
		color: var(--z-ds-color-text-100);
	}
</style>
