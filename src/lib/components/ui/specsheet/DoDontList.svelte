<!-- DoDontList.svelte — Do/Don't als adaptive Liste. -->
<script lang="ts">
	import type { DoDont } from '$types/spec';
	import Mark from './Mark.svelte';
	let { doDont = null }: { doDont?: DoDont | null } = $props();
</script>

{#if doDont}
	<div class="do-dont">
		{#if doDont.do?.length}
			<ul class="do-dont__do">
				{#each doDont.do as d}<li><Mark kind="good" class="do-dont__mark" />{d}</li>{/each}
			</ul>
		{/if}
		{#if doDont.dont?.length}
			<ul class="do-dont__dont">
				{#each doDont.dont as d}<li><Mark kind="bad" class="do-dont__mark" />{d}</li>{/each}
			</ul>
		{/if}
	</div>
{/if}

<style>
	.do-dont {
		display: flex;
		flex-direction: column;
		gap: var(--z-ds-space-16);
	}
	.do-dont ul {
		list-style: none;
		margin: 0;
		padding: 0;
		display: flex;
		flex-direction: column;
		gap: var(--z-ds-space-10);
	}
	.do-dont li {
		position: relative;
		padding-left: 26px;
		margin: 0;
		font-size: var(--ds-text-base);
		color: var(--ds-text);
		line-height: 1.5;
	}
	/* Marke sitzt (wie zuvor das ::before) absolut am Zeilenanfang. */
	.do-dont li :global(.do-dont__mark) {
		position: absolute;
		left: 0;
		top: 0;
	}
</style>
