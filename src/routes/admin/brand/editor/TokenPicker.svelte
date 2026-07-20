<!--
  TokenPicker — Eingabe für Farb-Token-Felder (V1b): ruhiges Textfeld mit
  Live-Swatch davor + Autocomplete über die echten Token aus global.css.
  Freitext bleibt möglich (Hex/rgb/…); die Validierung meldet Unbekanntes.
  Da global.css app-weit geladen ist, zeigt `var(--token)` die echte Farbe.
  Positionierung + Outside-Close über die geteilten core/actions (kein Sheet —
  ein an das Feld gebundenes Autocomplete, kein Mobile-Bottom-Sheet).
-->
<script lang="ts">
	import { clickOutside, anchoredPopover } from '../core/actions';
	import { cycleIndex } from '../core/cycle';
	import { tokenToCssColor } from '../core/cms-components';

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
	let inputEl = $state<HTMLInputElement | null>(null);

	const swatchColor = $derived(tokenToCssColor(value) ?? 'transparent');
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
			activeIdx = cycleIndex(activeIdx, n, 1);
		} else if (e.key === 'ArrowUp') {
			e.preventDefault();
			activeIdx = cycleIndex(activeIdx, n, -1);
		} else if (e.key === 'Enter') {
			if (n) {
				e.preventDefault();
				pick(filtered[activeIdx]);
			}
		}
	}
</script>

<div class="token-picker" use:clickOutside={() => (open = false)}>
	<span
		class="token-picker__swatch"
		class:token-picker__swatch--empty={!value.trim()}
		style:background={swatchColor}
	></span>
	<!-- Bewusst KEIN ui/Field (Paket 3, P2): inputEl ist zugleich der Anker von
	     use:anchoredPopover (matchWidth am RohElement) UND trägt einen führenden Swatch
	     im selben Feldrahmen. Field kapselt das Element in einen Wrapper und leitet
	     keine `use:`-Action durch → ein Tausch würde die Popover-Anker-/Breiten-Logik
	     und das Swatch-Layout umbauen (Verhaltensrisiko). Darum bleibt es ein Roh-Input. -->
	<input
		bind:this={inputEl}
		class="token-picker__input"
		class:token-picker__input--error={!!error}
		type="text"
		{value}
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
		<ul
			class="token-picker__popover"
			role="listbox"
			use:anchoredPopover={{ anchor: inputEl, reflowKey: filtered.length, matchWidth: true }}
		>
			{#each filtered as t, i (t)}
				<li>
					<button
						type="button"
						class="token-picker__option"
						class:token-picker__option--active={i === activeIdx}
						role="option"
						aria-selected={i === activeIdx}
						onmouseenter={() => (activeIdx = i)}
						onpointerdown={(e) => {
							e.preventDefault();
							pick(t);
						}}
					>
						<span class="token-picker__swatch" style:background={`var(${t})`}></span>
						<code class="token-picker__name">{t}</code>
					</button>
				</li>
			{/each}
		</ul>
	{/if}
</div>

<style>
	.token-picker {
		position: relative;
		display: flex;
		align-items: center;
		gap: var(--z-ds-space-6);
		min-width: 0;
	}
	.token-picker__swatch {
		flex: none;
		width: 1.15rem;
		height: 1.15rem;
		border-radius: var(--ds-radius-xs, 0.25rem);
		border: 1px solid rgb(from var(--ds-text) r g b / 0.18);
	}
	/* Leer/unauflösbar: Schachbrett als „keine Farbe"-Signal. */
	.token-picker__swatch--empty {
		background: conic-gradient(
				rgb(from var(--ds-text) r g b / 0.12) 0 25%,
				transparent 0 50%,
				rgb(from var(--ds-text) r g b / 0.12) 0 75%,
				transparent 0
			)
			0 0 / 8px 8px !important;
	}
	.token-picker__input {
		flex: 1 1 auto;
		min-width: 0;
		font: inherit;
		font-family: var(--ds-font-mono);
		font-size: var(--ds-text-sm);
		color: var(--ds-text);
		background: var(--ds-surface);
		border: 1px solid var(--ds-border);
		border-radius: var(--ds-radius, 8px);
		padding: 9px 12px;
		transition: border-color var(--ds-dur, 0.15s) var(--ds-ease-out, ease-out);
	}
	.token-picker__input::placeholder {
		color: var(--ds-text-faint, var(--ds-text-muted));
	}
	.token-picker__input:hover {
		border-color: var(--ds-border-hover, var(--ds-border-strong, var(--ds-border)));
	}
	.token-picker__input:focus-visible {
		outline: 2px solid var(--ds-focus-ring);
		outline-offset: 1px;
	}
	.token-picker__input--error {
		border-color: var(--ds-negative, #b91109);
	}
	/* Fixed statt absolut: entkommt Karten-Grenzen; Position/maxHeight setzt
	   die anchoredPopover-Action (Flip nach oben, Viewport-Klammer, folgt Scroll). */
	.token-picker__popover {
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
	.token-picker__option {
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
	.token-picker__option--active {
		background: rgb(from var(--ds-accent) r g b / 0.12);
	}
	.token-picker__name {
		font-family: var(--ds-font-mono);
		font-size: var(--ds-text-xs);
		color: var(--ds-text-body);
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}
	@media (prefers-reduced-motion: reduce) {
		.token-picker__input {
			transition: none;
		}
	}
</style>
