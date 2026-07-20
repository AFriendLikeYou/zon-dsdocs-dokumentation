<!--
  SpacingScale.svelte — Abstands-Skala mit echten Größenbalken.
  Jeder Balken ist so breit wie der Token WIRKLICH ist (width: var(--token)) —
  die Visualisierung IST der Wert. Der px-Wert wird aus der GERENDERTEN Balkenbreite
  gelesen (nicht aus dem Roh-Token) — so stimmt er immer mit dem Balken überein,
  auch bei Media-Query-abhängigen Stufen wie xxl.
-->
<script lang="ts">
	import { Chip } from '$components/ui/chip';

	let {
		/** Spacing-Tokens (--z-ds-space-*); jeder rendert einen maßstabsgetreuen Balken. */
		tokens = []
	}: { tokens?: string[] } = $props();

	let listEl: HTMLUListElement;
	let px = $state<Record<string, number>>({});
	$effect(() => {
		if (!listEl) return;
		const bars = listEl.querySelectorAll('.bar');
		const m: Record<string, number> = {};
		tokens.forEach((t, i) => {
			const b = bars[i] as HTMLElement | undefined;
			m[t] = b ? Math.round(parseFloat(getComputedStyle(b).width)) : 0;
		});
		px = m;
	});

	const short = (t: string) => t.replace('--z-ds-space-', '');
</script>

<ul class="scale" bind:this={listEl}>
	{#each tokens as t (t)}
		<li class="row">
			<span class="step">{short(t)}</span>
			<span class="track"><span class="bar" style="width: var({t})"></span></span>
			<span class="info">
				{#if px[t]}
					<Chip value={`${px[t]}px`} label={`${px[t]} px`} />
				{/if}
				<Chip value={t} class="name-pill" />
			</span>
		</li>
	{/each}
</ul>

<style>
	.scale {
		list-style: none;
		margin: 0;
		padding: 0;
		display: grid;
		gap: 10px;
	}
	.row {
		display: grid;
		grid-template-columns: 2.5rem minmax(3rem, 1fr) auto;
		align-items: center;
		gap: var(--z-ds-space-16);
	}
	.step {
		font-family: var(--ds-font-mono);
		font-size: var(--ds-text-sm);
		color: var(--ds-text-muted);
		text-align: right;
	}
	.track {
		display: block;
		min-width: 0;
	}
	.bar {
		display: block;
		height: 16px;
		max-width: 100%;
		border-radius: var(--ds-radius-xs);
		background: var(--ds-accent-brand);
	}
	.info {
		display: flex;
		align-items: center;
		gap: var(--z-ds-space-8);
		white-space: nowrap;
	}
	/* Token-Namen-Pille auf schmalen Viewports ausblenden (px-Wert genügt). */
	@media (max-width: 560px) {
		:global(.name-pill) {
			display: none;
		}
	}
</style>
