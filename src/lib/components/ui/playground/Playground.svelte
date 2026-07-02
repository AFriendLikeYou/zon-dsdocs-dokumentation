<!--
  Playground.svelte — wiederverwendbarer interaktiver Component-Specimen.

  Der Harness liefert die Chrome (Bühne, Prop-Controls als Pills, mitlaufender Code-Block);
  die Komponenten-Doku liefert nur ihre „Daten": eine Controls-Spec, ein `preview`-Snippet
  (rendert das echte Specimen aus dem State) und eine `code`-Funktion (Code-String aus State).
  So lässt sich derselbe Playground für die meisten DS-Komponenten wiederverwenden.

  Beispiel:
    <Playground
      controls={[{ key: 'variant', label: 'Variant', type: 'select', options: [...] },
                 { key: 'disabled', label: 'Disabled', type: 'toggle' }]}
      code={(s) => `<button class="...">…</button>`}
    >
      {#snippet preview(s)}<button class={cls(s)}>Label</button>{/snippet}
    </Playground>
-->
<script lang="ts" module>
	export type PlaygroundOption = { value: string; label: string };
	export type PlaygroundControl =
		| {
				key: string;
				label: string;
				type: 'select';
				options: PlaygroundOption[];
				default?: string;
		  }
		| { key: string; label: string; type: 'toggle'; default?: boolean };
	export type PlaygroundState = Record<string, string | number | boolean>;
</script>

<script lang="ts">
	import type { Snippet } from 'svelte';
	import { Chip } from '$components/ui/chip';
	import { CodeBlock } from '$components/ui/specsheet';

	type Props = {
		controls?: PlaygroundControl[];
		/** Bühne wird dunkel, wenn dieser Toggle-Key aktiv ist (z. B. 'onImage'). */
		darkKey?: string;
		lang?: 'html' | 'css' | 'svelte';
		/** Hinweistext statt Controls (z. B. „keine Varianten"). */
		hint?: string;
		/** Rendert den Live-Specimen; bekommt den aktuellen State. */
		preview: Snippet<[PlaygroundState]>;
		/** Erzeugt den Code-String aus dem State. */
		code: (state: PlaygroundState) => string;
		class?: string;
	};
	let {
		controls = [],
		darkKey,
		lang = 'html',
		hint,
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

	let state = $state<PlaygroundState>(initialState());
	const isDark = $derived(!!(darkKey && state[darkKey]));
	const codeStr = $derived(code(state));

	// Reset erscheint nur, wenn vom Default abgewichen wurde (Porsche-Configurator-Muster).
	const defaults = initialState();
	const isDirty = $derived(controls.some((c) => state[c.key] !== defaults[c.key]));
	function reset() {
		for (const c of controls) state[c.key] = defaults[c.key];
	}
</script>

<div class="pg {className}">
	<div class="pg-stage" class:is-dark={isDark}>
		<div class="pg-preview">{@render preview(state)}</div>
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
							variant={state[c.key] === o.value ? 'accent' : 'neutral'}
							emphasis={state[c.key] === o.value}
							onclick={() => (state[c.key] = o.value)}>{o.label}</Chip
						>
					{/each}
				{:else}
					<Chip
						variant={state[c.key] ? 'accent' : 'neutral'}
						onclick={() => (state[c.key] = !state[c.key])}>{c.label}</Chip
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
		display: flex;
		align-items: center;
		justify-content: center;
		padding: var(--z-ds-space-32) var(--z-ds-space-16);
		min-height: 96px;
		background: var(--ds-surface-raised);
		transition: background-color var(--ds-dur) var(--ds-ease);
	}
	.pg-stage.is-dark {
		background: var(--ds-stage-dark);
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
