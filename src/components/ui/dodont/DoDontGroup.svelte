<script lang="ts">
	interface Props {
		columns?: number; // Default to 2 columns
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
