<!--
  UsageBlock.svelte — „Wann verwenden / Wann nicht" als Entscheidungshilfe ganz oben
  in der Component-Doku. Speist sich aus dem redaktionellen verwendung-Feld (content.ts).
-->
<script lang="ts">
	import type { Verwendung } from '$types/spec';
	let {
		/** Redaktionelles Verwendung-Feld (nutzen/nichtNutzen) aus content.ts. */
		verwendung = null
	}: { verwendung?: Verwendung | null } = $props();
</script>

{#if verwendung && (verwendung.nutzen?.length || verwendung.nichtNutzen?.length)}
	<div class="usage">
		{#if verwendung.nutzen?.length}
			<div class="usage__col usage__col--use">
				<p class="usage__head">
					<span class="usage__mark" aria-hidden="true">✓</span> Wann verwenden
				</p>
				<ul>
					{#each verwendung.nutzen as item}<li>{item}</li>{/each}
				</ul>
			</div>
		{/if}
		{#if verwendung.nichtNutzen?.length}
			<div class="usage__col usage__col--avoid">
				<p class="usage__head"><span class="usage__mark" aria-hidden="true">✕</span> Wann nicht</p>
				<ul>
					{#each verwendung.nichtNutzen as item}<li>{item}</li>{/each}
				</ul>
			</div>
		{/if}
	</div>
{/if}

<style>
	.usage {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
		gap: var(--z-ds-space-16);
		margin-block: var(--z-ds-space-16);
	}
	.usage__col {
		padding: var(--z-ds-space-16);
		border-radius: var(--ds-radius);
		border: 1px solid var(--ds-border-soft);
		background: var(--ds-surface-raised);
	}
	.usage__head {
		display: flex;
		align-items: center;
		gap: var(--z-ds-space-6);
		margin: 0 0 var(--z-ds-space-8);
		font-weight: 600;
		font-size: var(--ds-text-sm);
	}
	.usage__mark {
		font-weight: 700;
	}
	.usage__col--use .usage__mark {
		color: var(--ds-positive);
	}
	.usage__col--avoid .usage__mark {
		color: var(--ds-negative);
	}
	.usage ul {
		margin: 0;
		padding-left: var(--z-ds-space-16);
		display: flex;
		flex-direction: column;
		gap: var(--z-ds-space-6);
	}
	.usage li {
		font-size: var(--ds-text-sm);
		color: var(--ds-text);
		line-height: 1.5;
	}
</style>
