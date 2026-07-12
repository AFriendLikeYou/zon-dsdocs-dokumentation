<!-- DoDontList.svelte — Do/Don't als adaptive Liste. -->
<script lang="ts">
	import type { DoDont } from '$types/spec';
	import Mark from './Mark.svelte';
	let { doDont = null }: { doDont?: DoDont | null } = $props();
</script>

{#if doDont}
	<div class="dd">
		{#if doDont.do?.length}
			<ul class="do">
				{#each doDont.do as d}<li><Mark kind="good" class="dd-mark" />{d}</li>{/each}
			</ul>
		{/if}
		{#if doDont.dont?.length}
			<ul class="dont">
				{#each doDont.dont as d}<li><Mark kind="bad" class="dd-mark" />{d}</li>{/each}
			</ul>
		{/if}
	</div>
{/if}

<style>
	.dd {
		display: flex;
		flex-direction: column;
		gap: var(--z-ds-space-16);
	}
	.dd ul {
		list-style: none;
		margin: 0;
		padding: 0;
		display: flex;
		flex-direction: column;
		gap: var(--z-ds-space-10);
	}
	.dd li {
		position: relative;
		padding-left: 26px;
		margin: 0;
		font-size: var(--ds-text-base);
		color: var(--ds-text);
		line-height: 1.5;
	}
	/* Marke sitzt (wie zuvor das ::before) absolut am Zeilenanfang. */
	.dd li :global(.dd-mark) {
		position: absolute;
		left: 0;
		top: 0;
	}
</style>
