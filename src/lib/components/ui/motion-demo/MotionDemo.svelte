<!--
  MotionDemo.svelte — macht die Motion-Tokens (--ds-ease-* / --ds-dur-*) erlebbar.
  Werte werden live aus dem geladenen Stylesheet gelesen (kein Hardcode). Klick spielt
  die Bewegung mit dem jeweiligen Token ab. Respektiert prefers-reduced-motion.
-->
<script lang="ts">
	import { resolveCssVar } from '$lib/utils';

	type MotionToken = { label: string; cssVar: string };

	let {
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
</script>

<div class="motion-demo">
	{#each tokens as t (t.cssVar)}
		<div class="row">
			<div class="meta">
				<span class="label">{t.label}</span>
				<code>{t.cssVar}</code>
				<span class="val">{values[t.cssVar]}</span>
			</div>
			<button
				type="button"
				class="track"
				onclick={() => play(t.cssVar)}
				aria-label={`„${t.label}" abspielen`}
			>
				<span
					class="dot"
					class:end={flipped[t.cssVar]}
					style={type === 'easing'
						? `transition: transform 700ms var(${t.cssVar});`
						: `transition: transform var(${t.cssVar}) var(--ds-ease-out);`}
				></span>
			</button>
		</div>
	{/each}
</div>

<style>
	.motion-demo {
		display: flex;
		flex-direction: column;
		gap: var(--z-ds-space-16);
		margin-block: var(--z-ds-space-16);
	}
	.row {
		display: grid;
		grid-template-columns: minmax(200px, 1fr) 2fr;
		gap: var(--z-ds-space-16);
		align-items: center;
	}
	.meta {
		display: flex;
		flex-direction: column;
		gap: 2px;
	}
	.label {
		font-weight: 500;
		font-size: var(--ds-text-sm);
	}
	.meta code {
		font-family: var(--ds-font-mono);
		font-size: var(--ds-text-xs);
		color: var(--ds-text-body);
	}
	.val {
		font-family: var(--ds-font-mono);
		font-size: var(--ds-text-xs);
		color: var(--ds-text-muted);
	}
	.track {
		all: unset;
		position: relative;
		height: 40px;
		border-radius: var(--ds-radius);
		background: var(--ds-surface-raised);
		cursor: pointer;
		overflow: hidden;
		container-type: inline-size;
	}
	.track:focus-visible {
		outline: 2px solid var(--ds-focus-ring);
		outline-offset: 2px;
	}
	.dot {
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
	.dot.end {
		transform: translateX(calc(100cqi - 24px - 16px));
	}

	@media (prefers-reduced-motion: reduce) {
		.dot {
			transition: none !important;
		}
	}
</style>
