<!--
  TokenPicker — Eingabe für Farb-Token-Felder (V1b): ruhiges Textfeld mit
  Live-Swatch davor + Autocomplete über die echten Token aus global.css.
  Freitext bleibt möglich (Hex/rgb/…); die Validierung meldet Unbekanntes.
  Da global.css app-weit geladen ist, zeigt `var(--token)` die echte Farbe.
-->
<script lang="ts">
	import { placePopover } from './popover-position';

	let {
		value = '',
		tokens = [],
		error = null,
		set
	}: {
		value?: string;
		tokens?: readonly string[];
		error?: string | null;
		set: (v: string) => void;
	} = $props();

	let open = $state(false);
	let activeIdx = $state(0);
	let wrap = $state<HTMLElement | null>(null);
	let inputEl = $state<HTMLInputElement | null>(null);
	let popEl = $state<HTMLElement | null>(null);

	const swatchColor = $derived(
		value.trim() === '' ? 'transparent' : value.startsWith('--') ? `var(${value})` : value
	);
	const filtered = $derived(
		tokens.filter((t) => t.toLowerCase().includes(value.trim().toLowerCase())).slice(0, 40)
	);

	function pick(t: string) {
		set(t);
		open = false;
	}
	function onkey(e: KeyboardEvent) {
		if (!open && (e.key === 'ArrowDown' || e.key === 'ArrowUp')) {
			open = true;
			return;
		}
		if (!open) return;
		const n = filtered.length;
		if (e.key === 'Escape') {
			open = false;
		} else if (e.key === 'ArrowDown') {
			e.preventDefault();
			activeIdx = n ? (activeIdx + 1) % n : 0;
		} else if (e.key === 'ArrowUp') {
			e.preventDefault();
			activeIdx = n ? (activeIdx - 1 + n) % n : 0;
		} else if (e.key === 'Enter') {
			if (n) {
				e.preventDefault();
				pick(filtered[activeIdx]);
			}
		}
	}

	// Klick außerhalb schließt.
	$effect(() => {
		if (!open) return;
		const onDown = (e: MouseEvent) => {
			if (wrap && !wrap.contains(e.target as Node)) open = false;
		};
		document.addEventListener('pointerdown', onDown, true);
		return () => document.removeEventListener('pointerdown', onDown, true);
	});

	// Fixed am Anker platzieren (Flip + Viewport-Klammer); folgt Scroll/Resize.
	$effect(() => {
		// eslint-disable-next-line @typescript-eslint/no-unused-expressions -- reaktive Abhängigkeit: bei Filter-Änderung neu messen
		filtered.length;
		const a = inputEl;
		const p = popEl;
		if (!open || !a || !p) return;
		const place = () => placePopover(a, p, { matchWidth: true });
		place();
		window.addEventListener('scroll', place, true);
		window.addEventListener('resize', place);
		return () => {
			window.removeEventListener('scroll', place, true);
			window.removeEventListener('resize', place);
		};
	});
</script>

<div class="tp" bind:this={wrap}>
	<span class="tp-swatch" class:tp-swatch--empty={!value.trim()} style:background={swatchColor}
	></span>
	<input
		bind:this={inputEl}
		class="tp-input"
		class:tp-input--err={!!error}
		type="text"
		value={value}
		placeholder="--z-ds-color-… oder #hex"
		spellcheck="false"
		aria-invalid={!!error}
		oninput={(e) => {
			set(e.currentTarget.value);
			open = true;
			activeIdx = 0;
		}}
		onfocus={() => (open = true)}
		onkeydown={onkey}
	/>

	{#if open && filtered.length}
		<ul class="tp-pop" role="listbox" bind:this={popEl}>
			{#each filtered as t, i (t)}
				<li>
					<button
						type="button"
						class="tp-opt"
						class:tp-opt--active={i === activeIdx}
						role="option"
						aria-selected={i === activeIdx}
						onmouseenter={() => (activeIdx = i)}
						onpointerdown={(e) => {
							e.preventDefault();
							pick(t);
						}}
					>
						<span class="tp-swatch" style:background={`var(${t})`}></span>
						<code class="tp-name">{t}</code>
					</button>
				</li>
			{/each}
		</ul>
	{/if}
</div>

<style>
	.tp {
		position: relative;
		display: flex;
		align-items: center;
		gap: var(--z-ds-space-6);
		min-width: 0;
	}
	.tp-swatch {
		flex: none;
		width: 1.15rem;
		height: 1.15rem;
		border-radius: var(--ds-radius-xs, 0.25rem);
		border: 1px solid rgb(from var(--ds-text) r g b / 0.18);
	}
	/* Leer/unauflösbar: Schachbrett als „keine Farbe"-Signal. */
	.tp-swatch--empty {
		background:
			conic-gradient(
					rgb(from var(--ds-text) r g b / 0.12) 0 25%,
					transparent 0 50%,
					rgb(from var(--ds-text) r g b / 0.12) 0 75%,
					transparent 0
				)
				0 0 / 8px 8px !important;
	}
	.tp-input {
		flex: 1 1 auto;
		min-width: 0;
		font: inherit;
		font-family: var(--z-ds-font-mono, monospace);
		font-size: var(--ds-text-sm);
		color: var(--ds-text);
		background: var(--ds-surface);
		border: 1px solid var(--ds-border);
		border-radius: var(--ds-radius, 8px);
		padding: 9px 12px;
		transition: border-color var(--ds-dur, 0.15s) var(--ds-ease-out, ease-out);
	}
	.tp-input::placeholder {
		color: var(--ds-text-faint, var(--ds-text-muted));
	}
	.tp-input:hover {
		border-color: var(--ds-border-hover, var(--ds-border-strong, var(--ds-border)));
	}
	.tp-input:focus-visible {
		outline: 2px solid var(--ds-focus-ring);
		outline-offset: 1px;
	}
	.tp-input--err {
		border-color: var(--ds-negative, #b91109);
	}
	/* Fixed statt absolut: entkommt Karten-Grenzen; Position/maxHeight setzt
	   placePopover (Flip nach oben, Viewport-Klammer, folgt Scroll). */
	.tp-pop {
		position: fixed;
		z-index: 60;
		list-style: none;
		margin: 0;
		padding: var(--z-ds-space-xs);
		max-height: 14rem;
		overflow-y: auto;
		background: var(--ds-surface);
		border: 1px solid var(--ds-border);
		border-radius: var(--ds-radius-sm);
		box-shadow: 0 8px 24px rgb(from var(--ds-text) r g b / 0.28);
	}
	.tp-opt {
		display: flex;
		align-items: center;
		gap: var(--z-ds-space-s);
		width: 100%;
		border: none;
		background: none;
		border-radius: var(--ds-radius-xs, 0.25rem);
		padding: var(--z-ds-space-xs) var(--z-ds-space-6);
		cursor: pointer;
		text-align: left;
	}
	.tp-opt--active {
		background: rgb(from var(--ds-accent) r g b / 0.12);
	}
	.tp-name {
		font-family: var(--z-ds-font-mono, monospace);
		font-size: var(--ds-text-xs);
		color: var(--ds-text-body);
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}
	@media (prefers-reduced-motion: reduce) {
		.tp-input {
			transition: none;
		}
	}
</style>
