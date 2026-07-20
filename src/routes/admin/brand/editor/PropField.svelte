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
	import { Field, Select } from '$components/ui/field';
	import { SegmentedControl } from '$components/ui/segmented-control';

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
			<Field
				type="number"
				error={!!error}
				value={str}
				placeholder="0"
				aria-invalid={!!error}
				oninput={(e) => set(e.currentTarget.value)}
			/>
		{:else if segmented}
			<SegmentedControl
				variant="flat"
				label={prop.label}
				options={(prop.options ?? []).map((o) => ({ value: o, label: o }))}
				value={str}
				onchange={(v) => set(v)}
			/>
		{:else if prop.type === 'select'}
			<Select value={str} onchange={(e) => set(e.currentTarget.value)}>
				{#each prop.options ?? [] as o (o)}
					<option value={o}>{o}</option>
				{/each}
			</Select>
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
			<Field
				multiline
				error={!!error}
				value={str}
				{placeholder}
				aria-invalid={!!error}
				oninput={(e) => set(e.currentTarget.value)}
			/>
		{:else}
			<Field
				error={!!error}
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

	/* Text-/Zahl-/Auswahl-Controls kommen aus den geteilten Atomen Field/Select
	   (field-base.css). Kurze Enums rendert jetzt ui/SegmentedControl variant="flat"
	   (dieselbe Figma-689:11510-Optik: Rechteck, radius 8, --ds-surface/--ds-border) —
	   die frühere lokale .seg-Kopie ist entfallen.

	   Bewusst PropField-lokal bleibt der Switch (Boolean): ui/Switch bündelt sein
	   eigenes Label (label-Prop, text-sm), PropField setzt das Label separat als
	   .pf-lbl (text-xs, muted, order:1 in der Boolean-Zeile). Ein Tausch brächte
	   doppeltes/abweichend gestyltes Label → .switch bleibt vorlagentreu lokal. */

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

	@media (prefers-reduced-motion: reduce) {
		.switch,
		.switch::after {
			transition: none;
		}
	}
</style>
