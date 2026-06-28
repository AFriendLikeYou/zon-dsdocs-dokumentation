<script lang="ts">
	const {
		left,
		right,
		reverse
	}: {
		left: () => ReturnType<import('svelte').Snippet>;
		right: () => ReturnType<import('svelte').Snippet>;
		reverse?: boolean;
	} = $props();
</script>

<div class="two-col-wrapper">
	<div class="two-col {reverse ? 'reverse' : ''}">
		<div class="col left">
			{@render left()}
		</div>
		<div class="col right">
			{@render right()}
		</div>
	</div>
</div>

<style>
	.two-col-wrapper {
		display: flex;
		container-type: inline-size;
		container-name: twoCol;
		width: 100%;
	}

	.two-col {
		display: flex;
		flex-direction: column;
		gap: var(--z-ds-space-xl);
		padding-block: var(--z-ds-space-24);
		background-color: var(--z-ds-color-background-0);
		color: var(--z-ds-color-text-100);
		width: 100%;
	}

	.col {
		flex: 1;
	}

	.left {
		max-width: 600px;
	}

	.right {
		display: flex;
		justify-content: center;
		align-items: center;
	}

	.reverse {
		flex-direction: column-reverse;
	}

	@container twoCol (min-width: 768px) {
		.two-col {
			flex-direction: row;
			justify-content: space-between;
			align-items: flex-start;
		}

		.reverse {
			flex-direction: row-reverse;
		}

		.col.right {
			max-width: 420px;
		}
	}
</style>
