<!--
  DoDontGroup.svelte — flexbox-Gruppierung für DoDont-Karten (steuert die Karten-
  Breite über den .dodont-Hook). Verwendet auf den Brand-/Foundations-Seiten und
  als CMS-Container (cms-components.ts).
-->
<script lang="ts">
	interface Props {
		/** Karten pro Zeile (Default 2). */
		columns?: number;
		/** DoDont-Karten als Kinder. */
		children?: import('svelte').Snippet;
	}

	let { columns = 2, children }: Props = $props();
</script>

{#if children}
	<div class="dodont-group" style="--columns: {columns}">
		{@render children()}
	</div>
{/if}

<style>
	.dodont-group {
		display: flex;
		flex-wrap: wrap;
		gap: 2rem;
		width: 100%;
	}

	.dodont-group :global(.dodont) {
		flex: 1 1 calc(100% / var(--columns) - 2rem);
		min-width: 120px;
	}
</style>
