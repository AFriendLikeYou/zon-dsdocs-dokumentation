<script lang="ts">
	import BlockIcon from './BlockIcon.svelte';

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
	let wrap = $state<HTMLElement | null>(null);
	let input = $state<HTMLInputElement | null>(null);

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
		if (e.key === 'ArrowDown') {
			e.preventDefault();
			activeIdx = Math.min(activeIdx + 1, filtered.length - 1);
		} else if (e.key === 'ArrowUp') {
			e.preventDefault();
			activeIdx = Math.max(activeIdx - 1, 0);
		} else if (e.key === 'Enter') {
			e.preventDefault();
			const it = filtered[activeIdx];
			if (it) pick(it.name);
		}
	}

	// Klick außerhalb schließt.
	$effect(() => {
		if (!open) return;
		const onDown = (e: MouseEvent) => {
			if (wrap && !wrap.contains(e.target as Node)) close();
		};
		document.addEventListener('pointerdown', onDown, true);
		return () => document.removeEventListener('pointerdown', onDown, true);
	});
</script>

<div class="insert-menu" bind:this={wrap}>
	<button
		type="button"
		class="trigger"
		class:trigger--compact={compact}
		aria-haspopup="listbox"
		aria-expanded={open}
		onclick={toggle}
	>
		<span class="plus" aria-hidden="true">+</span>
		{#if !compact}<span>{label}</span>{/if}
	</button>

	{#if open}
		<div class="pop" role="dialog" aria-label={label}>
			<input
				bind:this={input}
				class="search"
				type="text"
				placeholder="Suchen…"
				bind:value={query}
				oninput={() => (activeIdx = 0)}
				onkeydown={onkey}
			/>
			<ul class="opts" role="listbox">
				{#each filtered as it, i (it.name)}
					<li>
						<button
							type="button"
							class="opt"
							class:opt--active={i === activeIdx}
							role="option"
							aria-selected={i === activeIdx}
							onmouseenter={() => (activeIdx = i)}
							onclick={() => pick(it.name)}
						>
							<BlockIcon key={it.icon} />
							<span>{it.label}</span>
						</button>
					</li>
				{/each}
				{#if filtered.length === 0}
					<li class="empty">Kein Treffer</li>
				{/if}
			</ul>
		</div>
	{/if}
</div>

<style>
	.insert-menu {
		position: relative;
		display: inline-block;
	}
	.trigger {
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
	.trigger:hover {
		border-color: var(--ds-accent);
	}
	.trigger:focus-visible {
		outline: 2px solid var(--ds-focus-ring);
		outline-offset: 2px;
	}
	.trigger--compact {
		padding: 2px var(--z-ds-space-6);
		border-style: dashed;
		background: var(--ds-surface);
		color: var(--ds-text-muted);
	}
	.plus {
		font-weight: 700;
		line-height: 1;
	}
	.pop {
		position: absolute;
		top: calc(100% + 4px);
		left: 0;
		z-index: 20;
		width: 15rem;
		max-width: 80vw;
		background: var(--ds-surface);
		border: 1px solid var(--ds-border);
		border-radius: var(--ds-radius-sm);
		box-shadow: 0 8px 24px rgb(from var(--ds-text) r g b / 0.18);
		padding: var(--z-ds-space-6);
	}
	.search {
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
	.search:focus-visible {
		outline: 2px solid var(--ds-focus-ring);
		outline-offset: 1px;
	}
	.opts {
		list-style: none;
		margin: 0;
		padding: 0;
		max-height: 16rem;
		overflow-y: auto;
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
	.empty {
		padding: var(--z-ds-space-s);
		font-size: var(--ds-text-sm);
		color: var(--ds-text-muted);
	}
</style>
