<script lang="ts">
	// Kleines, stroke-basiertes Icon je Komponenten-Kategorie (Editor-Toolbar/Menü).
	// `key` kommt aus `iconFor(name)` in cms-components.ts.
	let { key = 'block' }: { key?: string } = $props();
</script>

<svg
	class="ico"
	viewBox="0 0 16 16"
	fill="none"
	stroke="currentColor"
	stroke-width="1.4"
	stroke-linecap="round"
	stroke-linejoin="round"
	aria-hidden="true"
>
	{#if key === 'text'}
		<path d="M3 4h10M3 8h10M3 12h6" />
	{:else if key === 'image'}
		<rect x="2" y="3" width="12" height="10" rx="1.5" /><circle cx="6" cy="6.5" r="1" /><path
			d="M2.5 11l3.5-3 3 2.5L11 8l2.5 2.5"
		/>
	{:else if key === 'gallery'}
		<rect x="4" y="2.5" width="9.5" height="9.5" rx="1.5" /><path d="M2.5 5v8.5H11" />
	{:else if key === 'alert'}
		<path d="M8 2.5l5.5 10H2.5z" /><path d="M8 6.5v3" />
	{:else if key === 'dodont'}
		<circle cx="8" cy="8" r="5.5" /><path d="M5.5 8l1.8 1.8 3.2-3.4" />
	{:else if key === 'color'}
		<circle cx="8" cy="8" r="5.5" /><path d="M8 2.5v11" />
	{:else if key === 'video'}
		<rect x="2" y="3.5" width="12" height="9" rx="1.5" /><path
			d="M7 6.5l3 1.5-3 1.5z"
			fill="currentColor"
			stroke="none"
		/>
	{:else if key === 'download'}
		<path d="M8 2.5v7" /><path d="M5 7l3 3 3-3" /><path d="M3 12.5h10" />
	{:else if key === 'hero'}
		<rect x="2" y="3" width="12" height="10" rx="1.5" /><path d="M2 6.5h12" />
	{:else if key === 'card'}
		<rect x="3" y="3" width="10" height="10" rx="1.5" /><path d="M5.5 6.5h5M5.5 9h3" />
	{:else if key === 'grid'}
		<rect x="2.5" y="2.5" width="4.5" height="4.5" rx="0.8" /><rect
			x="9"
			y="2.5"
			width="4.5"
			height="4.5"
			rx="0.8"
		/><rect x="2.5" y="9" width="4.5" height="4.5" rx="0.8" /><rect
			x="9"
			y="9"
			width="4.5"
			height="4.5"
			rx="0.8"
		/>
	{:else}
		<rect x="2.5" y="4" width="11" height="8" rx="1.5" />
	{/if}
</svg>

<style>
	.ico {
		width: 1em;
		height: 1em;
		flex: none;
		color: var(--ds-text-muted);
	}
</style>
