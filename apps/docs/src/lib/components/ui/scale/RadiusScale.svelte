<!--
  RadiusScale.svelte — Radius-Skala mit gerundeten Swatches.
  Jeder Swatch rendert border-radius: var(--token) — die Ecke IST der Wert.
  Numerischer Wert live aus dem Stylesheet (kein Drift zum DS-Paket).
-->
<script lang="ts">
	import { Chip } from '$components/ui/chip';
	import { resolveCssVar } from '$lib/utils';

	let {
		/** Radius-Tokens mit optionalem Einsatzzweck; jeder rendert einen eigenen Swatch. */
		items = []
	}: { items?: { token: string; usage?: string }[] } = $props();

	let vals = $state<Record<string, string>>({});
	$effect(() => {
		const m: Record<string, string> = {};
		for (const it of items) m[it.token] = resolveCssVar(it.token);
		vals = m;
	});

	function label(v: string): string {
		if (!v) return '';
		if (v.endsWith('rem')) return `${Math.round(parseFloat(v) * 16)} px · ${v}`;
		if (v.endsWith('px')) return `${parseFloat(v)} px`;
		return v;
	}
</script>

<ul class="rad">
	{#each items as it (it.token)}
		<li class="card">
			<div class="swatch" style="border-radius: var({it.token})"></div>
			<div class="meta">
				<span class="name-line">
					<Chip value={it.token} />
				</span>
				<span class="val-line">
					{#if vals[it.token]}
						<Chip value={vals[it.token]} label={label(vals[it.token])} />
					{/if}
				</span>
				{#if it.usage}<span class="use">{it.usage}</span>{/if}
			</div>
		</li>
	{/each}
</ul>

<style>
	.rad {
		list-style: none;
		margin: 0;
		padding: 0;
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
		gap: var(--z-ds-space-16);
	}
	.card {
		display: flex;
		flex-direction: column;
		gap: var(--z-ds-space-12);
	}
	.swatch {
		width: 100%;
		height: 88px;
		background: var(--ds-surface-raised);
		border: 1px solid var(--ds-border);
		/* Nur die obere linke Ecke betonen, damit der Radius klar ablesbar ist. */
		border-top-left-radius: 0;
		border-bottom-right-radius: 0;
	}
	.meta {
		display: flex;
		flex-direction: column;
		gap: 2px;
	}
	.name-line,
	.val-line {
		display: inline-flex;
		align-items: center;
		gap: var(--z-ds-space-8);
	}
	.use {
		font-size: var(--ds-text-sm);
		color: var(--ds-text-body);
		margin-top: 2px;
	}
</style>
