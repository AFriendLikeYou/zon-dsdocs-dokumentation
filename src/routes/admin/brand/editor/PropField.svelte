<!--
  PropField — ein Eigenschafts-Feld nach der Figma-Vorlage (689:11510): Label oben
  (12px, muted), darunter das volle-Breite-Control auf --ds-surface mit --ds-border
  und radius 8; Werte 16px. Kurze Enums als Segmented Control, Booleans als Switch,
  Textareas wachsen mit. Fehler inline (rote Meldung + roter Rand), Pflichtfelder
  mit ∗. API unverändert: prop + value rein, set(v) raus.
-->
<script lang="ts">
	import type { CmsPropDef } from '../core/cms-components';
	import MediaPicker from './MediaPicker.svelte';
	import TokenPicker from './TokenPicker.svelte';

	type MediaImage = { path: string; name: string; kind?: 'image' | 'video' };
	let {
		prop,
		value,
		media = [],
		tokens = [],
		error = null,
		uploadable = false,
		set
	}: {
		prop: CmsPropDef;
		value: string | boolean;
		media?: MediaImage[];
		tokens?: readonly string[];
		error?: string | null;
		uploadable?: boolean;
		set: (v: string | boolean) => void;
	} = $props();

	const str = $derived(typeof value === 'string' ? value : '');
	// Kurze Enums als Segmented Control, lange bleiben ein Select.
	const segmented = $derived(prop.type === 'select' && (prop.options ?? []).length <= 4);
	const placeholder = $derived(
		prop.format === 'url' ? 'https://… oder /pfad' : `${prop.label} eingeben …`
	);
</script>

<label class="pf" class:pf--check={prop.type === 'boolean'}>
	<span class="pf-lbl"
		>{prop.label}{#if prop.required}<span class="pf-req" title="Pflichtfeld">∗</span>{/if}</span
	>
	<span class="pf-val">
		{#if prop.type === 'boolean'}
			<input
				type="checkbox"
				class="switch"
				role="switch"
				checked={value === true}
				onchange={(e) => set(e.currentTarget.checked)}
			/>
		{:else if prop.type === 'number'}
			<input
				type="number"
				class:err={!!error}
				value={str}
				placeholder="0"
				aria-invalid={!!error}
				oninput={(e) => set(e.currentTarget.value)}
			/>
		{:else if segmented}
			<span class="seg" role="group" aria-label={prop.label}>
				{#each prop.options ?? [] as o (o)}
					<button
						type="button"
						class="seg-opt"
						class:seg-opt--on={str === o}
						aria-pressed={str === o}
						onclick={() => set(o)}>{o}</button
					>
				{/each}
			</span>
		{:else if prop.type === 'select'}
			<select value={str} onchange={(e) => set(e.currentTarget.value)}>
				{#each prop.options ?? [] as o (o)}
					<option value={o}>{o}</option>
				{/each}
			</select>
		{:else if prop.type === 'media'}
			<MediaPicker
				value={str}
				{media}
				kind={prop.mediaKind}
				{error}
				{uploadable}
				set={(v) => set(v)}
			/>
		{:else if prop.format === 'token-color'}
			<TokenPicker value={str} {tokens} {error} set={(v) => set(v)} />
		{:else if prop.type === 'textarea'}
			<textarea
				class:err={!!error}
				rows={Math.max(2, str.split('\n').length)}
				value={str}
				{placeholder}
				aria-invalid={!!error}
				oninput={(e) => set(e.currentTarget.value)}
			></textarea>
		{:else}
			<input
				class:err={!!error}
				value={str}
				{placeholder}
				inputmode={prop.format === 'url' ? 'url' : undefined}
				aria-invalid={!!error}
				oninput={(e) => set(e.currentTarget.value)}
			/>
		{/if}
		{#if error}
			<span class="pf-err" role="alert">{error}</span>
		{/if}
	</span>
</label>

<style>
	/* Gestapelt: Label oben, Control volle Breite (Figma 689:11510). */
	.pf {
		display: flex;
		flex-direction: column;
		gap: var(--z-ds-space-4, 4px);
		margin: 0;
	}
	.pf-lbl {
		font-size: var(--ds-text-xs);
		color: var(--ds-text-muted);
		line-height: 1.3;
	}
	.pf-req {
		color: var(--ds-negative, #b91109);
		margin-left: 2px;
	}
	.pf-val {
		display: flex;
		flex-direction: column;
		gap: 2px;
		min-width: 0;
	}
	.pf--check {
		flex-direction: row;
		align-items: center;
		gap: var(--z-ds-space-s);
		min-height: 1.9rem;
	}
	.pf--check .pf-lbl {
		order: 1;
	}
	.pf-err {
		font-size: var(--ds-text-xs);
		color: var(--ds-negative, #b91109);
		padding-left: 2px;
	}

	/* Controls: Fläche = Seite (--ds-surface), Rand, radius 8, Werte 16px. */
	input,
	textarea,
	select {
		width: 100%;
		font: inherit;
		font-size: var(--ds-text-base);
		color: var(--ds-text);
		background: var(--ds-surface);
		border: 1px solid var(--ds-border);
		border-radius: var(--ds-radius, 8px);
		padding: 9px 12px;
		transition: border-color var(--ds-dur, 0.15s) var(--ds-ease-out, ease-out);
	}
	input::placeholder,
	textarea::placeholder {
		color: var(--ds-text-faint, var(--ds-text-muted));
	}
	input:hover,
	textarea:hover,
	select:hover {
		border-color: var(--ds-border-hover, var(--ds-border-strong, var(--ds-border)));
	}
	input:focus-visible,
	textarea:focus-visible,
	select:focus-visible {
		outline: 2px solid var(--ds-focus-ring);
		outline-offset: 1px;
	}
	input.err,
	textarea.err {
		border-color: var(--ds-negative, #b91109);
	}
	textarea {
		resize: vertical;
		line-height: 1.5;
		field-sizing: content;
		min-height: 2.6rem;
	}
	select {
		appearance: none;
		background-image:
			linear-gradient(45deg, transparent 50%, var(--ds-text-muted) 50%),
			linear-gradient(135deg, var(--ds-text-muted) 50%, transparent 50%);
		background-position:
			calc(100% - 18px) 50%,
			calc(100% - 13px) 50%;
		background-size:
			5px 5px,
			5px 5px;
		background-repeat: no-repeat;
		padding-right: 32px;
	}

	/* Switch statt Checkbox. */
	.switch {
		appearance: none;
		width: 2.1rem;
		height: 1.2rem;
		flex: none;
		margin: 0;
		padding: 0;
		border-radius: 999px;
		background: var(--ds-border);
		border: none;
		position: relative;
		cursor: pointer;
		transition: background var(--ds-dur, 0.15s) var(--ds-ease-out, ease-out);
	}
	.switch::after {
		content: '';
		position: absolute;
		top: 2px;
		left: 2px;
		width: calc(1.2rem - 4px);
		height: calc(1.2rem - 4px);
		border-radius: 50%;
		background: var(--ds-static-white, #fff);
		box-shadow: 0 1px 2px rgb(from var(--ds-text) r g b / 0.25);
		transition: transform var(--ds-dur, 0.15s) var(--ds-ease-out, ease-out);
	}
	.switch:checked {
		background: var(--ds-accent);
	}
	.switch:checked::after {
		transform: translateX(0.9rem);
	}
	.switch:active::after {
		transform: scale(0.92);
	}
	.switch:checked:active::after {
		transform: translateX(0.9rem) scale(0.92);
	}
	.switch:focus-visible {
		outline: 2px solid var(--ds-focus-ring);
		outline-offset: 2px;
	}

	/* Segmented Control für kurze Enums. */
	.seg {
		display: inline-flex;
		gap: 2px;
		padding: 2px;
		border-radius: var(--ds-radius, 8px);
		background: var(--ds-surface);
		border: 1px solid var(--ds-border);
		align-self: start;
	}
	.seg-opt {
		border: none;
		background: none;
		font: inherit;
		font-size: var(--ds-text-sm);
		color: var(--ds-text-muted);
		padding: 5px var(--z-ds-space-m);
		border-radius: calc(var(--ds-radius, 8px) - 3px);
		cursor: pointer;
		transition:
			background var(--ds-dur, 0.15s) var(--ds-ease-out, ease-out),
			color var(--ds-dur, 0.15s) var(--ds-ease-out, ease-out);
	}
	.seg-opt:hover {
		color: var(--ds-text);
	}
	.seg-opt--on {
		background: var(--ds-surface-raised, var(--ds-surface));
		color: var(--ds-text);
		box-shadow: 0 1px 2px rgb(from var(--ds-text) r g b / 0.15);
	}
	.seg-opt:focus-visible {
		outline: 2px solid var(--ds-focus-ring);
		outline-offset: 1px;
	}

	@media (prefers-reduced-motion: reduce) {
		input,
		textarea,
		select,
		.switch,
		.switch::after,
		.seg-opt {
			transition: none;
		}
	}
</style>
