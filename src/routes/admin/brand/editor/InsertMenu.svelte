<!--
  InsertMenu — Button-getriggertes Insert-Menü (Notion-artig). Desktop-Popover,
  Mobile-Sheet, Scroll-Lock, Outside-Click und Positionierung liefert die
  PopoverSheet-Hülle; hier bleibt nur Trigger + Suche + gefilterte Liste.
  Die Item-Liste ist in BlockMenuList ausgelagert (geteilt mit dem Slash-Menü).
-->
<script lang="ts">
	import BlockMenuList from './BlockMenuList.svelte';
	import PopoverSheet from './PopoverSheet.svelte';
	import { Icon } from '$lib/icons/cms';
	import { cycleIndex } from '../core/cycle';

	type Item = { name: string; label: string; icon: string };
	let {
		items,
		onpick,
		label = 'Einfügen',
		compact = false
	}: {
		items: Item[];
		onpick: (name: string) => void;
		label?: string;
		compact?: boolean;
	} = $props();

	let open = $state(false);
	let query = $state('');
	let activeIdx = $state(0);
	let input = $state<HTMLInputElement | null>(null);
	let triggerEl = $state<HTMLElement | null>(null);

	const filtered = $derived(
		items.filter((i) => i.label.toLowerCase().includes(query.trim().toLowerCase()))
	);

	function toggle() {
		open = !open;
		if (open) {
			query = '';
			activeIdx = 0;
			queueMicrotask(() => input?.focus());
		}
	}
	function close() {
		open = false;
	}
	function pick(name: string) {
		onpick(name);
		close();
	}
	function onkey(e: KeyboardEvent) {
		if (e.key === 'Escape') {
			close();
			return;
		}
		const n = filtered.length;
		if (e.key === 'ArrowDown') {
			e.preventDefault();
			activeIdx = cycleIndex(activeIdx, n, 1);
		} else if (e.key === 'ArrowUp') {
			e.preventDefault();
			activeIdx = cycleIndex(activeIdx, n, -1);
		} else if (e.key === 'Enter') {
			e.preventDefault();
			const it = filtered[activeIdx];
			if (it) pick(it.name);
		}
	}
</script>

<div class="insert-menu">
	<button
		type="button"
		class="insert-menu__trigger"
		class:insert-menu__trigger--compact={compact}
		bind:this={triggerEl}
		aria-haspopup="listbox"
		aria-expanded={open}
		onclick={toggle}
	>
		<span class="insert-menu__plus" aria-hidden="true"><Icon name="plus" /></span>
		{#if !compact}<span>{label}</span>{/if}
	</button>

	<PopoverSheet
		{open}
		{label}
		anchor={triggerEl}
		reflowKey={filtered.length}
		contentOffset={64}
		maxWidth="80vw"
		onclose={close}
	>
		<input
			bind:this={input}
			class="insert-menu__search"
			type="text"
			placeholder="Suchen…"
			bind:value={query}
			oninput={() => (activeIdx = 0)}
			onkeydown={onkey}
		/>
		<BlockMenuList
			items={filtered}
			activeIndex={activeIdx}
			onpick={pick}
			onhover={(i) => (activeIdx = i)}
		/>
	</PopoverSheet>
</div>

<style>
	.insert-menu {
		position: relative;
		display: inline-block;
	}
	.insert-menu__trigger {
		display: inline-flex;
		align-items: center;
		gap: var(--z-ds-space-6);
		border: 1px solid var(--ds-border);
		background: var(--ds-surface-raised, var(--ds-surface));
		border-radius: var(--ds-radius-sm);
		padding: 3px var(--z-ds-space-s);
		font-size: var(--ds-text-xs);
		color: var(--ds-text-body);
		cursor: pointer;
		white-space: nowrap;
	}
	.insert-menu__trigger:hover {
		border-color: var(--ds-accent);
	}
	.insert-menu__trigger:focus-visible {
		outline: 2px solid var(--ds-focus-ring);
		outline-offset: 2px;
	}
	.insert-menu__trigger--compact {
		padding: 2px var(--z-ds-space-6);
		border-style: dashed;
		background: var(--ds-surface);
		color: var(--ds-text-muted);
	}
	.insert-menu__plus {
		display: inline-flex;
		flex: none;
	}

	.insert-menu__search {
		width: 100%;
		font: inherit;
		font-size: var(--ds-text-sm);
		color: var(--ds-text);
		background: var(--ds-surface);
		border: 1px solid var(--ds-border);
		border-radius: var(--ds-radius-sm);
		padding: var(--z-ds-space-6) var(--z-ds-space-8);
		margin-bottom: var(--z-ds-space-6);
	}
	.insert-menu__search:focus-visible {
		outline: 2px solid var(--ds-focus-ring);
		outline-offset: 1px;
	}
</style>
