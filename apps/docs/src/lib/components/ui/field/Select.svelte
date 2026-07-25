<!--
  Select.svelte — das gemeinsame Auswahl-Feld der Doku-UI. Teilt sich die Fläche/
  Kontur/Fokus-Optik mit Field.svelte (field-base.css) und ergänzt einen eigenen
  Pfeil (Muster aus PropField). Optionen kommen entweder deklarativ über `options`
  oder als `children`-Snippet (rohe <option>-Elemente).

  `value` ist `bind:value`-fähig ($bindable); alle nativen <select>-Attribute werden
  durchgereicht.

  Nutzung:
    <Select bind:value density="compact" options={[{ value: 'a', label: 'A' }]} />
    <Select bind:value onchange={…} aria-label="Status">
      <option value="ready">ready</option>
    </Select>
-->
<script lang="ts" generics="T extends string = string">
	import type { Snippet } from 'svelte';
	import type { HTMLSelectAttributes } from 'svelte/elements';
	import './field-base.css';

	type Option = { value: T; label: string };

	type Props = {
		/** Ausgewählter Wert (bind:value-fähig). Der Wert-Typ folgt den options. */
		value?: T;
		/** Dichte: kompaktes Editor-Feld oder komfortables Formular-Feld. */
		density?: 'compact' | 'comfortable';
		/** Optionen deklarativ; alternativ rohe <option> via children. */
		options?: readonly Option[];
		/** Rohe <option>-Elemente statt `options`. */
		children?: Snippet;
		/** Fehler-Zustand (roter Rand). */
		error?: boolean;
		/** Zusätzliche Klassen auf dem Wrapper. */
		class?: string;
	} & Omit<HTMLSelectAttributes, 'value' | 'class'>;

	let {
		value = $bindable('' as T),
		density = 'comfortable',
		options,
		children,
		error = false,
		class: className = '',
		...restProps
	}: Props = $props();
</script>

<div class="field field--{density} field--select {className}" class:field--error={error}>
	<select class="field__control" bind:value {...restProps}>
		{#if children}
			{@render children()}
		{:else if options}
			{#each options as o (o.value)}
				<option value={o.value}>{o.label}</option>
			{/each}
		{/if}
	</select>
	<span class="field__arrow" aria-hidden="true"></span>
</div>
