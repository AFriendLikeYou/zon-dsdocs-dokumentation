<!--
	Tabs.svelte — barrierefreie Tab-Leiste (ARIA tablist, Pfeiltasten/Home/End) mit
	gleitendem Aktiv-Unterstrich. Strukturiert u. a. die Design-Tabs der
	Component-Doku-Seiten (src/routes/product/components/*/+page.svx).
-->
<script lang="ts">
	import type { Snippet } from 'svelte';

	type TabItem = {
		/** Beschriftung des Tab-Buttons. */
		label: string;
		/** Inhalt des zugehörigen Panels (Svelte-Snippet). */
		component: Snippet;
	};

	type Props = {
		/** Tabs mit Label + Panel-Snippet. */
		items: TabItem[];
		/** Tab-Leiste beim Scrollen oben andocken. */
		sticky?: boolean;
	};

	let { items, sticky = false }: Props = $props();
	let activeIndex = $state(0);

	const handleClick = (index: number) => () => {
		activeIndex = index;
	};

	const handleKeyDown = (event: KeyboardEvent) => {
		const currentIndex = activeIndex;
		let nextIndex;

		switch (event.key) {
			case 'ArrowRight':
				nextIndex = (currentIndex + 1) % items.length;
				break;
			case 'ArrowLeft':
				nextIndex = (currentIndex - 1 + items.length) % items.length;
				break;
			case 'Home':
				nextIndex = 0;
				break;
			case 'End':
				nextIndex = items.length - 1;
				break;
			default:
				return; // Ignore other keys
		}

		event.preventDefault();
		activeIndex = nextIndex;
		document.getElementById(`tab-${nextIndex}`)?.focus();
	};
</script>

<ul role="tablist" aria-label="Tab Navigation" class:sticky>
	{#each items as item, index}
		<li role="presentation">
			<button
				id={`tab-${index}`}
				role="tab"
				aria-selected={activeIndex === index}
				aria-controls={`panel-${index}`}
				tabindex={activeIndex === index ? 0 : -1}
				class:active={activeIndex === index}
				onclick={handleClick(index)}
				onkeydown={handleKeyDown}
			>
				{item.label}
			</button>
		</li>
	{/each}
</ul>
{#each items as item, index}
	{#if activeIndex === index}
		<div
			id={`panel-${index}`}
			role="tabpanel"
			aria-labelledby={`tab-${index}`}
			tabindex="0"
			class="tab-panel"
		>
			{@render item.component()}
		</div>
	{/if}
{/each}

<style>
	.tab-panel {
		padding-block: var(--z-ds-space-m);
		max-width: var(--width-tablet);
	}

	ul {
		display: flex;
		flex-wrap: wrap;
		list-style: none;
		border-bottom: 1px solid var(--ds-border);
		margin-block: var(--z-ds-space-m);
		padding: 0;
		gap: 2px;
	}

	ul.sticky {
		position: sticky;
		top: var(--header-height, 0px);
		z-index: 20;
		flex-wrap: nowrap;
		overflow-x: auto;
		scrollbar-width: none;
		margin-block: var(--z-ds-space-m) 0;
		background: var(--ds-surface);
	}
	ul.sticky::-webkit-scrollbar {
		display: none;
	}

	ul li {
		margin-bottom: 0;
	}

	button {
		all: unset;
		cursor: pointer;
		position: relative;
		padding: var(--z-ds-space-xs) var(--z-ds-space-s);
		color: var(--ds-text-body);
		white-space: nowrap;
		transition: color var(--ds-dur) var(--ds-ease);
	}

	button.active {
		color: var(--ds-text);
	}

	/* Unterstrich erscheint instant — Tab-Wechsel ist tastatur-initiiert/-wiederholbar
	   (Pfeiltasten), darf also nicht bei jedem Schritt eine Keyframe-Animation neu
	   abspielen (Emil-Skill: keine Animation auf Keyboard-/High-Frequency-Aktionen).
	   Das smoothe, interruptierbare Color-Transition auf dem Button bleibt. */
	button.active::after {
		content: '';
		position: absolute;
		left: var(--z-ds-space-s);
		right: var(--z-ds-space-s);
		bottom: -1px;
		height: 2px;
		background: var(--ds-text);
		border-radius: 2px;
	}

	@media (hover: hover) and (pointer: fine) {
		button:not(.active):hover {
			color: var(--ds-text);
		}
	}

	button:focus-visible {
		outline: 2px solid var(--ds-focus-ring);
		outline-offset: -2px;
		border-radius: 4px;
	}

	@media (prefers-reduced-motion: reduce) {
		button {
			transition: none;
		}
	}
</style>
