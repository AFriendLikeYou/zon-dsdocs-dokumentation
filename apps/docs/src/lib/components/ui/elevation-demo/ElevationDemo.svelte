<!--
  ElevationDemo.svelte — zeigt die Shadow-/Elevation-Tokens (--ds-shadow-*) als
  gerenderte Karten. Theme-adaptiv (die Tokens haben eigene Dark-Mode-Werte).
-->
<script lang="ts">
	type ShadowToken = { label: string; cssVar: string; usage?: string };

	let {
		/** Shadow-Tokens: Label, cssVar und optionaler Einsatz-Hinweis. */
		tokens = []
	}: { tokens?: ShadowToken[] } = $props();
</script>

<div class="elevation-demo">
	{#each tokens as t (t.cssVar)}
		<div class="card" style={`box-shadow: var(${t.cssVar});`}>
			<span class="card__label">{t.label}</span>
			<code class="card__var">{t.cssVar}</code>
			{#if t.usage}<span class="card__usage">{t.usage}</span>{/if}
		</div>
	{/each}
</div>

<style>
	.elevation-demo {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
		gap: var(--z-ds-space-32);
		margin-block: var(--z-ds-space-24);
		padding: var(--z-ds-space-16);
	}
	.card {
		display: flex;
		flex-direction: column;
		gap: var(--z-ds-space-4);
		padding: var(--z-ds-space-20);
		min-height: 96px;
		border-radius: var(--ds-radius);
		background: var(--ds-surface);
		border: 1px solid var(--ds-border-soft);
	}
	.card__label {
		font-weight: 600;
	}
	.card__var {
		font-family: var(--ds-font-mono);
		font-size: var(--ds-text-xs);
		color: var(--ds-text-body);
	}
	.card__usage {
		font-size: var(--ds-text-sm);
		color: var(--ds-text-muted);
	}
</style>
