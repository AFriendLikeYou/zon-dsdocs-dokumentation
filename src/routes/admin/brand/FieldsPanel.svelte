<!--
  FieldsPanel — aufklappbares Eigenschaften-Panel einer Block-/Kind-Karte
  (details.fields): Summary mit Feld-Zähler (rot bei Fehlern), darunter die
  PropField-Liste. Vorher dreimal im Editor dupliziert (Komponente / Container /
  Container-Kind) — jetzt EINE Quelle für Markup, Toggle-Verhalten und den
  Chrome-::details-content-Fix.
-->
<script lang="ts">
	import type { CmsPropDef } from './cms-components';
	import PropField from './PropField.svelte';

	type MediaImage = { path: string; name: string; kind?: 'image' | 'video' };
	let {
		label = 'Eigenschaften bearbeiten',
		props,
		values,
		errors = {},
		media = [],
		tokens = [],
		uploadable = false,
		open = false,
		onToggle,
		set
	}: {
		label?: string;
		props: CmsPropDef[];
		values: Record<string, string | boolean>;
		errors?: Record<string, string>;
		media?: MediaImage[];
		tokens?: readonly string[];
		uploadable?: boolean;
		open?: boolean;
		/** Nutzer-Toggle — der Auf/Zu-Zustand gehört dem Aufrufer (Item/Child). */
		onToggle: (open: boolean) => void;
		set: (key: string, value: string | boolean) => void;
	} = $props();

	const errorCount = $derived(Object.keys(errors).length);
</script>

<details class="fields" {open} ontoggle={(e) => onToggle(e.currentTarget.open)}>
	<summary class="fields-sum"
		>{label}<span class="fields-n" class:fields-n--err={errorCount > 0}>{props.length}</span
		></summary
	>
	<div class="cmp-fields">
		{#each props as p (p.key)}
			<PropField
				prop={p}
				value={values[p.key]}
				{media}
				{uploadable}
				{tokens}
				error={errors[p.key]}
				set={(v) => set(p.key, v)}
			/>
		{/each}
	</div>
</details>

<style>
	.fields {
		border-top: 1px dashed var(--ds-border-soft);
		padding-top: var(--z-ds-space-6);
	}
	/* Chromes UA-Style gibt ::details-content ein content-visibility — das macht
	   das Pseudo-Element zum Containing Block für position:fixed und verschiebt
	   die Picker-Popover (Token/Media) um den Karten-Offset. NUR im offenen Zustand
	   aufheben: Popover erscheinen ohnehin nur bei offenem Panel, und im geschlossenen
	   Zustand MUSS Chromes natives content-visibility:hidden greifen — sonst bleibt
	   der Inhalt sichtbar und das Panel klappt nie ein. */
	.fields[open]::details-content {
		content-visibility: visible;
	}
	.fields-sum {
		list-style: none;
		cursor: pointer;
		user-select: none;
		display: flex;
		align-items: center;
		gap: var(--z-ds-space-6);
		font-size: var(--ds-text-xs);
		text-transform: uppercase;
		letter-spacing: var(--ds-label-tracking);
		font-weight: 600;
		color: var(--ds-text-muted);
	}
	.fields-sum::-webkit-details-marker {
		display: none;
	}
	.fields-sum::before {
		content: '▸';
		color: var(--ds-accent);
		transition: transform var(--ds-dur, 0.15s) var(--ds-ease-out, ease-out);
	}
	.fields[open] .fields-sum::before {
		transform: rotate(90deg);
	}
	.fields-sum:focus-visible {
		outline: 2px solid var(--ds-focus-ring);
		outline-offset: 2px;
	}
	.fields-n {
		margin-left: auto;
		font-weight: 500;
		text-transform: none;
		letter-spacing: normal;
		color: var(--ds-text-muted);
		background: var(--ds-surface-sunken, var(--ds-surface));
		border: 1px solid var(--ds-border-soft);
		border-radius: 999px;
		padding: 0 var(--z-ds-space-6);
		min-width: 1.25rem;
		text-align: center;
	}
	.fields-n--err {
		color: var(--ds-negative, #b91109);
		border-color: rgb(from var(--ds-negative, #b91109) r g b / 0.4);
		background: rgb(from var(--ds-negative, #b91109) r g b / 0.08);
	}
	.cmp-fields {
		display: grid;
		gap: var(--z-ds-space-10, 10px);
		margin-top: var(--z-ds-space-s);
	}
	@media (prefers-reduced-motion: reduce) {
		.fields-sum::before {
			transition: none;
		}
	}
</style>
