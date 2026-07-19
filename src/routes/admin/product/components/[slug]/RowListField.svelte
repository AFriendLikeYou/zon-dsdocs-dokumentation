<!--
  RowListField — dichter Zeilen-Editor für Listen aus MEHREREN Feldern (Wording:
  3 Inputs · Barrierefreiheit: 2 Inputs + Status-Select). Gemeinsames Gehäuse zu
  StringListField (Ein-Feld-Fassung): je Eintrag eine Zeile mit ✕-Entfernen (nur bei
  Hover/Fokus voll sichtbar, auf Touch immer), plus eine GHOST-ZEILE am Ende zum
  Anlegen. Sobald in der Ghost-Zeile ein Pflichtfeld getippt wird, wandert der Eintrag
  in die Liste (Enter bestätigt und lässt den Cursor stehen → nächste Ghost-Zeile;
  Verlassen der Zeile bestätigt ebenfalls, ein leerer Entwurf wird verworfen).

  Generisch: `columns` beschreibt die Felder (Schema → leerer Entwurf + „ist leer?"),
  das `row`-Snippet rendert die konkreten Inputs (bindet an das übergebene Zeilen-
  Objekt). `list` ist das reaktive $state-Array aus dem Eltern-Model (Proxy) → push/
  splice + bind:value wirken direkt aufs Original zurück (Payload identisch zur
  früheren Inline-Fassung mit „+"-Button).

  Props:
  - list:    reaktives Zeilen-Array (Proxy) aus dem Eltern-Model.
  - columns: Feld-Definitionen — { key · type? ‚input'|‚select' · options? } (Schema).
  - row:     Snippet, das die Felder EINER Zeile rendert (entry, index).
  - addLabel: Aria-Label/Platzhalter-Hinweis der Ghost-Zeile.
-->
<script lang="ts">
	import type { Snippet } from 'svelte';
	import { Icon } from '$lib/icons/cms';

	/** Zeilen-Objekt: Feld-Key → Wert. Bewusst flach (String-Felder + Status-Selects). */
	type Row = Record<string, string>;
	type Column = {
		key: string;
		/** ‚input' zählt zu den Pflicht-/Leerprüf-Feldern; ‚select' hat immer einen Wert. */
		type?: 'input' | 'select';
		/** Optionen bei type ‚select' — der erste Wert ist die Vorbelegung. */
		options?: readonly { value: string; label: string }[];
	};

	let {
		list,
		columns,
		row,
		addLabel = 'Eintrag ergänzen'
	}: {
		list: Row[];
		columns: readonly Column[];
		row: Snippet<[Row, number]>;
		addLabel?: string;
	} = $props();

	/** Leerer Entwurf aus dem Spalten-Schema (Selects mit erstem Options-Wert). */
	function blank(): Row {
		const out: Row = {};
		for (const c of columns) out[c.key] = c.type === 'select' ? (c.options?.[0]?.value ?? '') : '';
		return out;
	}

	// Nur die Text-Inputs entscheiden über „leer" (ein Select trägt immer einen Wert).
	const inputKeys = columns.filter((c) => c.type !== 'select').map((c) => c.key);
	const isEmpty = (entry: Row) => !inputKeys.some((k) => (entry[k] ?? '').trim());

	let draft = $state<Row>(blank());
	let ghostEl = $state<HTMLDivElement | null>(null);

	/** Nicht-leeren Entwurf anlegen; Entwurf an Ort und Stelle leeren (Fokus bleibt). */
	function commit(): boolean {
		if (isEmpty(draft)) return false;
		list.push({ ...draft });
		const b = blank();
		for (const c of columns) draft[c.key] = b[c.key];
		return true;
	}
	function onGhostKeydown(e: KeyboardEvent) {
		if (e.key === 'Enter') {
			e.preventDefault();
			commit(); // Cursor bleibt → direkt die nächste Ghost-Zeile
		} else if (e.key === 'Escape') {
			e.preventDefault();
			const b = blank();
			for (const c of columns) draft[c.key] = b[c.key];
			(e.target as HTMLElement)?.blur();
		}
	}
	function onGhostFocusout(e: FocusEvent) {
		// Nur committen, wenn der Fokus die Ghost-Zeile wirklich verlässt.
		if (ghostEl?.contains(e.relatedTarget as Node | null)) return;
		commit();
	}
</script>

<div class="rlf">
	{#each list as _, i (i)}
		<div class="rlf__row">
			{@render row(list[i], i)}
			<button
				type="button"
				class="rlf__remove"
				onclick={() => list.splice(i, 1)}
				aria-label="Entfernen"><Icon name="close" /></button
			>
		</div>
	{/each}
	<!-- Die Handler fangen nur die BUBBLENDEN Tastatur-/Fokus-Events der echten Inputs
	     (aus dem row-Snippet) ab — die Zeile selbst ist kein Bedienelement. -->
	<!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
	<div
		bind:this={ghostEl}
		class="rlf__row rlf__row--ghost"
		role="group"
		aria-label={addLabel}
		onkeydown={onGhostKeydown}
		onfocusout={onGhostFocusout}
	>
		{@render row(draft, -1)}
		<span class="rlf__ghost-hint" aria-hidden="true">+</span>
	</div>
</div>

<style>
	.rlf {
		display: flex;
		flex-direction: column;
	}
	.rlf__row {
		display: flex;
		align-items: center;
		gap: var(--z-ds-space-6);
		border-bottom: 1px solid var(--ds-border-soft);
	}
	.rlf__row--ghost {
		border-bottom: none;
		opacity: 0.85;
	}
	.rlf__row--ghost:focus-within {
		opacity: 1;
	}
	/* Inputs/Selects der Zeilen liefert das row-Snippet (Eltern) — hier nur das Layout,
	   die Feld-Optik teilen sich Editor + Feld über die globalen .rlf-*-Klassen der Seite. */
	.rlf__ghost-hint {
		flex: none;
		width: 1.5rem;
		text-align: center;
		color: var(--ds-text-faint);
		font-size: var(--ds-text-sm);
	}
	.rlf__remove {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		width: 1.5rem;
		height: 1.5rem;
		flex: none;
		border: none;
		background: none;
		border-radius: var(--ds-radius-sm);
		padding: 0;
		color: var(--ds-text-muted);
		cursor: pointer;
		line-height: 1;
		opacity: 0;
		transition:
			opacity var(--ds-dur, 0.15s) var(--ds-ease-out, ease-out),
			background var(--ds-dur, 0.15s) var(--ds-ease-out, ease-out),
			color var(--ds-dur, 0.15s) var(--ds-ease-out, ease-out);
	}
	.rlf__row:hover .rlf__remove,
	.rlf__row:focus-within .rlf__remove {
		opacity: 1;
	}
	.rlf__remove:hover {
		color: var(--ds-negative, var(--ds-text));
		background: rgb(from var(--ds-negative, var(--ds-text)) r g b / 0.1);
	}
	.rlf__remove:focus-visible {
		outline: 2px solid var(--ds-focus-ring);
		outline-offset: 2px;
		opacity: 1;
	}
	@media (hover: none) {
		.rlf__remove {
			opacity: 1;
		}
	}
	@media (prefers-reduced-motion: reduce) {
		.rlf__remove {
			transition: none;
		}
	}
</style>
