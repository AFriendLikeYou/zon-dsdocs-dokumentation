<!--
  Field.svelte — das gemeinsame Text-Eingabefeld der Doku-UI (input ODER textarea).
  Konsolidiert die zuvor ≥8× je Datei gepflegte Feld-Optik aus zwei Systemen
  (Product-CMS „compact" + Brand-PropField „comfortable") auf EINE Basis
  (field-base.css). Öffentlicher Consumer: das Such-Feld im Navbar-Header.

  Fläche/Kontur/Fokus trägt der Wrapper; das Bedienelement ist randlos. Führendes
  Icon (`icon`) und rechtes Slot-Element (`shortcut`, z. B. ⌘K oder Esc) liegen
  innerhalb der Feldfläche. `value` ist `bind:value`-fähig ($bindable).

  Nutzung:
    <Field bind:value placeholder="Seiten durchsuchen…" density="compact" />
    <Field bind:value multiline rows={4} />
    <Field bind:value density="compact">
      {#snippet icon()}<SearchIcon />{/snippet}
      {#snippet shortcut()}<Kbd>⌘K</Kbd>{/snippet}
    </Field>
-->
<script lang="ts">
	import type { Snippet } from 'svelte';
	import type { HTMLInputAttributes, HTMLTextareaAttributes } from 'svelte/elements';
	import './field-base.css';

	type Props = {
		/** Eingabewert (bind:value-fähig). */
		value?: string;
		/** Dichte: kompaktes Editor-Feld oder komfortables Formular-Feld. */
		density?: 'compact' | 'comfortable';
		/** Rendert eine wachsende Textarea statt eines einzeiligen Inputs. */
		multiline?: boolean;
		/** Zeilenzahl der Textarea (nur bei multiline). */
		rows?: number;
		/** Führendes Icon in der Feldfläche (z. B. SearchIcon). */
		icon?: Snippet;
		/** Rechtes Slot-Element (z. B. <Kbd>⌘K</Kbd> oder Esc-Hinweis). */
		shortcut?: Snippet;
		/** Fehler-Zustand (roter Rand). */
		error?: boolean;
		/** Zusätzliche Klassen auf dem Wrapper. */
		class?: string;
		/** Bedienelement (input/textarea) — bind:element für Fokus-/Anker-Zugriff. */
		element?: HTMLInputElement | HTMLTextAreaElement | null;
	} & Omit<HTMLInputAttributes & HTMLTextareaAttributes, 'value' | 'class'>;

	let {
		value = $bindable(''),
		density = 'comfortable',
		multiline = false,
		rows = 3,
		icon,
		shortcut,
		error = false,
		class: className = '',
		element = $bindable(null),
		...restProps
	}: Props = $props();
</script>

<div
	class="field field--{density} {className}"
	class:field--multiline={multiline}
	class:field--error={error}
>
	{#if icon}
		<span class="field__icon">{@render icon()}</span>
	{/if}
	{#if multiline}
		<textarea class="field__control" bind:this={element} bind:value {rows} {...restProps}></textarea>
	{:else}
		<input class="field__control" bind:this={element} bind:value {...restProps} />
	{/if}
	{#if shortcut}
		<span class="field__shortcut">{@render shortcut()}</span>
	{/if}
</div>
