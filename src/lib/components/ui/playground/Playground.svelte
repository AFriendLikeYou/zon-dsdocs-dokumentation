<!--
  Playground.svelte — wiederverwendbarer interaktiver Component-Specimen.

  Zwei Betriebsarten:

  1) TEMPLATE-MODUS (datengetrieben, Registry/model.json — der Normalfall):
     Controls tragen ihre Klassen-/Attribut-Payloads, ein logikfreies HTML-Template
     mit {classes}/{attrs}-Platzhaltern liefert Live-Preview UND Code-Block aus
     denselben Daten. Vollständig aus JSON serialisierbar → neue Patterns brauchen
     nur einen Registry-Eintrag, keine Komponente.

       <Playground
         template={'<button class="z-button{classes}"{attrs}>Click me</button>'}
         controls={[
           { key:'variant', label:'Variant', type:'select', default:'primary',
             options:[{value:'default',label:'Default'},
                      {value:'primary',label:'Primary',cssClass:'z-button--primary'}] },
           { key:'fullwidth', label:'Fullwidth', type:'toggle', cssClass:'z-button--fullwidth' },
           { key:'disabled',  label:'Disabled',  type:'attr',   attr:'disabled' }
         ]} />

  2) SNIPPET-MODUS (Escape-Hatch für Loops/Interaktion, z. B. Button-Group):
     `preview`-Snippet rendert das Specimen aus dem State, `code`-Funktion liefert
     den Code-String. Lebt co-located als Specimen.svelte neben der Route.
-->
<script lang="ts" module>
	export type PlaygroundOption = { value: string; label: string; cssClass?: string };
	export type PlaygroundControl =
		| {
				key: string;
				label: string;
				type: 'select';
				options: PlaygroundOption[];
				default?: string;
		  }
		| { key: string; label: string; type: 'toggle'; cssClass?: string; default?: boolean }
		| { key: string; label: string; type: 'attr'; attr: string; default?: boolean };
	export type PlaygroundState = Record<string, string | number | boolean>;

	/** Template + Controls + State → fertiges Markup (Preview UND Code — eine Quelle). */
	export function instantiate(
		template: string,
		controls: PlaygroundControl[],
		state: PlaygroundState
	): string {
		const classes: string[] = [];
		let attrs = '';
		for (const c of controls) {
			if (c.type === 'select') {
				const opt = c.options.find((o) => o.value === state[c.key]);
				if (opt?.cssClass) classes.push(opt.cssClass);
			} else if (c.type === 'toggle') {
				if (c.cssClass && state[c.key]) classes.push(c.cssClass);
			} else if (c.type === 'attr') {
				if (state[c.key]) attrs += ` ${c.attr}`;
			}
		}
		return template
			.replaceAll('{classes}', classes.length ? ` ${classes.join(' ')}` : '')
			.replaceAll('{attrs}', attrs);
	}
</script>

<script lang="ts">
	import type { Snippet } from 'svelte';
	import { Chip } from '$components/ui/chip';
	import { CodeBlock } from '$components/ui/specsheet';
	import { StageToggle } from '$components/ui/stage-toggle';

	type Props = {
		controls?: PlaygroundControl[];
		/** Bühne wird dunkel, wenn dieser Toggle-Key aktiv ist (z. B. 'onImage'). */
		darkKey?: string;
		lang?: 'html' | 'css' | 'svelte';
		/** Hinweistext statt Controls (z. B. „keine Varianten"). */
		hint?: string;
		/** TEMPLATE-MODUS: HTML mit {classes}/{attrs}-Platzhaltern (aus der Registry). */
		template?: string;
		/** SNIPPET-MODUS: rendert den Live-Specimen; bekommt den aktuellen State. */
		preview?: Snippet<[PlaygroundState]>;
		/** SNIPPET-MODUS: erzeugt den Code-String aus dem State. */
		code?: (state: PlaygroundState) => string;
		class?: string;
	};
	let {
		controls = [],
		darkKey,
		lang = 'html',
		hint,
		template,
		preview,
		code,
		class: className = ''
	}: Props = $props();

	function initialState(): PlaygroundState {
		const s: PlaygroundState = {};
		for (const c of controls) {
			s[c.key] = c.type === 'select' ? (c.default ?? c.options[0]?.value ?? '') : (c.default ?? false);
		}
		return s;
	}

	let values = $state<PlaygroundState>(initialState());
	const html = $derived(template ? instantiate(template, controls, values) : '');
	const codeStr = $derived(template ? html : (code?.(values) ?? ''));

	// Vorschau-Hintergrund: 'auto' folgt dem darkKey-Control (z. B. on-image),
	// 'light'/'dark' überschreiben es manuell (Schalter auf der Bühne). Die Bühne
	// pinnt in global.css die z-ds-Farbtoken je Modus → das Specimen rendert sein
	// echtes Light/Dark. (String-Default statt Union-Generic — svelte2tsx-freundlich.)
	let themeMode = $state('auto');
	const autoDark = $derived(!!(darkKey && values[darkKey]));
	const isDark = $derived(themeMode === 'dark' || (themeMode === 'auto' && autoDark));

	// Reset erscheint nur, wenn vom Default abgewichen wurde (Porsche-Configurator-Muster).
	const defaults = initialState();
	const isDirty = $derived(
		themeMode !== 'auto' || controls.some((c) => values[c.key] !== defaults[c.key])
	);
	function setTheme(theme: 'light' | 'dark') {
		themeMode = theme;
	}
	function reset() {
		for (const c of controls) values[c.key] = defaults[c.key];
		themeMode = 'auto';
	}
</script>

<div class="pg {className}">
	<div class="pg-stage ds-stage" class:is-dark={isDark}>
		<div class="pg-toolbar">
			<StageToggle {isDark} onlight={() => setTheme('light')} ondark={() => setTheme('dark')} />
		</div>
		<div class="pg-preview">
			{#if template}
				<!-- Template-Modus: Markup kommt aus der Registry (vertrauenswürdige Repo-Daten). -->
				<!-- eslint-disable-next-line svelte/no-at-html-tags -->
				{@html html}
			{:else}
				{@render preview?.(values)}
			{/if}
		</div>
	</div>

	{#if hint}
		<div class="pg-controls"><span class="pg-hint">{hint}</span></div>
	{:else if controls.length}
		<div class="pg-controls">
			{#each controls as c (c.key)}
				{#if c.type === 'select'}
					<span class="pg-label">{c.label}</span>
					{#each c.options as o (o.value)}
						<Chip
							variant={values[c.key] === o.value ? 'accent' : 'neutral'}
							emphasis={values[c.key] === o.value}
							onclick={() => (values[c.key] = o.value)}>{o.label}</Chip
						>
					{/each}
				{:else}
					<!-- toggle (Klasse) und attr (HTML-Attribut) bedienen sich gleich -->
					<Chip
						variant={values[c.key] ? 'accent' : 'neutral'}
						onclick={() => (values[c.key] = !values[c.key])}>{c.label}</Chip
					>
				{/if}
			{/each}

			{#if isDirty}
				<button type="button" class="pg-reset" onclick={reset}>
					<svg
						aria-hidden="true"
						width="12"
						height="12"
						viewBox="0 0 24 24"
						fill="none"
						stroke="currentColor"
						stroke-width="2"
						stroke-linecap="round"
						stroke-linejoin="round"
					>
						<path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
						<path d="M3 3v5h5" />
					</svg>
					Zurücksetzen
				</button>
			{/if}
		</div>
	{/if}

	<CodeBlock code={codeStr} {lang} />
</div>

<style>
	.pg {
		border: 1px solid var(--ds-border-soft);
		border-radius: var(--ds-radius);
		overflow: hidden;
		margin-block: var(--z-ds-space-16);
		background: var(--ds-surface);
	}
	.pg-stage {
		position: relative;
		display: flex;
		align-items: center;
		justify-content: center;
		padding: var(--z-ds-space-32) var(--z-ds-space-16);
		min-height: 96px;
		/* Fläche flippt mit den in global.css je Bühne gepinnten z-ds-Token. */
		background: var(--ds-surface-raised);
		transition: background-color var(--ds-dur) var(--ds-ease);
	}

	/* Light/Dark-Schalter (StageToggle) — dezent oben rechts auf der Bühne. */
	.pg-toolbar {
		position: absolute;
		top: var(--z-ds-space-8);
		right: var(--z-ds-space-8);
		z-index: 1;
	}
	.pg-preview {
		display: flex;
		align-items: center;
		justify-content: center;
		max-width: 100%;
	}
	.pg-controls {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: var(--z-ds-space-8);
		padding: var(--z-ds-space-12) var(--z-ds-space-16);
		border-bottom: 1px solid var(--ds-border-soft);
	}
	.pg-label {
		font-size: var(--ds-label-size);
		text-transform: uppercase;
		letter-spacing: var(--ds-label-tracking);
		font-weight: 600;
		color: var(--ds-text-muted);
	}
	.pg-hint {
		font-size: var(--ds-text-sm);
		color: var(--ds-text-muted);
	}
	/* Reset — dezenter Ghost-Button, rechtsbündig, nur bei Abweichung vom Default */
	.pg-reset {
		display: inline-flex;
		align-items: center;
		gap: 5px;
		margin-left: auto;
		border: none;
		background: none;
		padding: 4px 8px;
		border-radius: var(--ds-radius-sm);
		font-size: var(--ds-text-xs);
		color: var(--ds-text-muted);
		cursor: pointer;
		transition:
			color var(--ds-dur) var(--ds-ease),
			background-color var(--ds-dur) var(--ds-ease),
			transform var(--ds-dur) var(--ds-ease-out);
	}
	@media (hover: hover) and (pointer: fine) {
		.pg-reset:hover {
			color: var(--ds-text);
			background: var(--ds-surface-raised);
		}
	}
	.pg-reset:active {
		transform: scale(0.96);
	}
	.pg-reset:focus-visible {
		outline: 2px solid var(--ds-focus-ring);
		outline-offset: 2px;
	}
	@media (prefers-reduced-motion: reduce) {
		.pg-stage {
			transition: none;
		}
	}
</style>
