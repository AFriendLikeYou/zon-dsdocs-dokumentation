<!--
  BlockMenuList — geteilte Item-Liste für die Insert-Menüs (Button-Popover, Slash-Menü,
  Mobile-Sheet). Rein präsentational: bekommt bereits gefilterte (und nach Kategorie
  vorsortierte) Items + den aktiven Index, meldet Auswahl/Hover zurück. Kategorie-
  Überschriften erscheinen, wenn sich `category` zwischen Nachbarn ändert (V2).
-->
<script lang="ts">
	import { Icon } from '$lib/icons/cms';

	type Item = { name: string; label: string; icon: string; category?: string };
	let {
		items,
		activeIndex = 0,
		onpick,
		onhover
	}: {
		items: Item[];
		activeIndex?: number;
		onpick: (name: string) => void;
		onhover?: (i: number) => void;
	} = $props();

	const showGroups = $derived(items.some((i) => i.category));
</script>

<ul class="opts" role="listbox">
	{#each items as it, i (it.name)}
		{#if showGroups && it.category && (i === 0 || items[i - 1].category !== it.category)}
			<li class="grp" role="presentation">{it.category}</li>
		{/if}
		<li>
			<button
				type="button"
				class="opt"
				class:opt--active={i === activeIndex}
				role="option"
				aria-selected={i === activeIndex}
				onmouseenter={() => onhover?.(i)}
				onclick={() => onpick(it.name)}
			>
				<Icon name={it.icon} />
				<span>{it.label}</span>
			</button>
		</li>
	{/each}
	{#if items.length === 0}
		<li class="empty">Kein Treffer</li>
	{/if}
</ul>

<style>
	.opts {
		list-style: none;
		margin: 0;
		padding: 0;
		max-height: 16rem;
		overflow-y: auto;
	}
	.grp {
		font-size: var(--ds-text-xs);
		text-transform: uppercase;
		letter-spacing: var(--ds-label-tracking);
		font-weight: 600;
		color: var(--ds-text-muted);
		padding: var(--z-ds-space-8) var(--z-ds-space-s) var(--z-ds-space-xs);
	}
	.grp:first-child {
		padding-top: var(--z-ds-space-xs);
	}
	.opt :global(svg) {
		flex: none;
		color: var(--ds-text-muted);
	}
	.opt {
		display: flex;
		align-items: center;
		gap: var(--z-ds-space-s);
		width: 100%;
		border: none;
		background: none;
		border-radius: var(--ds-radius-sm);
		padding: var(--z-ds-space-6) var(--z-ds-space-s);
		font-size: var(--ds-text-sm);
		color: var(--ds-text-body);
		text-align: left;
		cursor: pointer;
	}
	.opt--active {
		background: rgb(from var(--ds-accent) r g b / 0.12);
	}
	.opt:focus-visible {
		outline: 2px solid var(--ds-focus-ring);
		outline-offset: -2px;
	}
	.empty {
		padding: var(--z-ds-space-s);
		font-size: var(--ds-text-sm);
		color: var(--ds-text-muted);
	}
</style>
