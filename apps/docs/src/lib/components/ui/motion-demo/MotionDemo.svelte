<!--
  MotionDemo.svelte — macht die Motion-Tokens (--ds-ease-* / --ds-dur-*) erlebbar.
  Werte werden live aus dem geladenen Stylesheet gelesen (kein Hardcode). Klick spielt
  die Bewegung mit dem jeweiligen Token ab. Respektiert prefers-reduced-motion.

  Struktur: DÜNNER WRAPPER um `ui/table` (K9). Zwei Spalten — Token (Zeilenkopf:
  Label, CSS-Variable, aufgelöster Wert) und die abspielbare Demo-Bühne. Die Bühne
  ist Zellinhalt; die Table kennt sie nicht.
-->
<script lang="ts">
	import { Table } from '$components/ui/table';
	import { resolveCssVar } from '$lib/utils';

	type MotionToken = {
		/** Angezeigter Name des Tokens. */
		label: string;
		/** CSS-Variablenname, dessen Wert live gelesen wird. */
		cssVar: string;
	};

	let {
		/** Abspielbare Motion-Tokens (Label + CSS-Variable). */
		tokens = [],
		/** Welche Eigenschaft das Token steuert: Kurve (easing) oder Dauer (duration). */
		type = 'easing'
	}: { tokens?: MotionToken[]; type?: 'easing' | 'duration' } = $props();

	let values = $state<Record<string, string>>({});
	let flipped = $state<Record<string, boolean>>({});

	// Token-Werte zur Laufzeit aus dem geladenen Stylesheet lesen.
	$effect(() => {
		const next: Record<string, string> = {};
		for (const t of tokens) next[t.cssVar] = resolveCssVar(t.cssVar);
		values = next;
	});

	function play(cssVar: string) {
		flipped[cssVar] = !flipped[cssVar];
	}

	const columns = [
		{ key: 'label', label: 'Token', width: '33%', header: true, render: metaCell },
		{ key: 'demo', label: 'Demo (Klick spielt die Bewegung ab)', render: demoCell }
	];
</script>

{#snippet metaCell(t: MotionToken)}
	<span class="motion-demo__meta">
		<span class="motion-demo__label">{t.label}</span>
		<code class="motion-demo__var">{t.cssVar}</code>
		<span class="motion-demo__val">{values[t.cssVar]}</span>
	</span>
{/snippet}

{#snippet demoCell(t: MotionToken)}
	<button
		type="button"
		class="motion-demo__track"
		onclick={() => play(t.cssVar)}
		aria-label={`„${t.label}" abspielen`}
	>
		<span
			class="motion-demo__dot"
			class:motion-demo__dot--end={flipped[t.cssVar]}
			style={type === 'easing'
				? `transition: transform 700ms var(${t.cssVar});`
				: `transition: transform var(${t.cssVar}) var(--ds-ease-out);`}
		></span>
	</button>
{/snippet}

<div class="motion-demo">
	<Table
		{columns}
		rows={tokens}
		density="compact"
		showHeader="sr-only"
		caption={type === 'easing'
			? 'Beschleunigungskurven zum Abspielen'
			: 'Dauer-Tokens zum Abspielen'}
	/>
</div>

<style>
	.motion-demo {
		margin-block: var(--z-ds-space-16);
	}
	/* Rahmen, Zeilen-Rhythmus und Trenner kommen seit K11 aus dem Atom
	   (`variant="framed"`, `density="compact"`). Die Demo-Bühne bleibt Zellinhalt. */
	.motion-demo__meta {
		display: flex;
		flex-direction: column;
		gap: 2px;
		min-width: 200px;
	}
	.motion-demo__label {
		font-weight: 500;
		font-size: var(--ds-text-sm);
	}
	.motion-demo__var {
		font-family: var(--ds-font-mono);
		font-size: var(--ds-text-xs);
		color: var(--ds-text-body);
	}
	.motion-demo__val {
		font-family: var(--ds-font-mono);
		font-size: var(--ds-text-xs);
		color: var(--ds-text-muted);
	}
	.motion-demo__track {
		all: unset;
		display: block;
		position: relative;
		width: 100%;
		height: 40px;
		border-radius: var(--ds-radius);
		background: var(--ds-surface-raised);
		cursor: pointer;
		overflow: hidden;
		container-type: inline-size;
	}
	.motion-demo__track:focus-visible {
		outline: 2px solid var(--ds-focus-ring);
		outline-offset: 2px;
	}
	.motion-demo__dot {
		position: absolute;
		top: 50%;
		left: 8px;
		width: 24px;
		height: 24px;
		margin-top: -12px;
		border-radius: 999px;
		background: var(--ds-accent);
		transform: translateX(0);
	}
	/* cqi = Track-Breite → Punkt läuft per transform über die volle Strecke (minus Dot + Padding). */
	.motion-demo__dot--end {
		transform: translateX(calc(100cqi - 24px - 16px));
	}

	@media (prefers-reduced-motion: reduce) {
		.motion-demo__dot {
			transition: none !important;
		}
	}
</style>
