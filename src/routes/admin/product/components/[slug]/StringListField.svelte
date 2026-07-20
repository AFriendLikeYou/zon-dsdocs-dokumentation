<!--
  StringListField — dichter Zeilen-Editor für eine flache String-Liste (Verwendung,
  Do/Don't, Komposition): je Eintrag eine einzeilige Row mit Inline-Editing und
  einem dezenten ✕-Entfernen-Button am Zeilenende (nur bei Hover/Fokus voll sichtbar;
  auf Touch immer sichtbar).

  Hinzufügen läuft über eine GHOST-ZEILE am Listenende: ein gedämpftes Input mit dem
  Platzhalter „+ Punkt ergänzen“. Fokus/Klick aktiviert es; Enter legt den Eintrag an
  und lässt den Cursor stehen (→ nächste Ghost-Zeile), Esc bricht ab, ein leeres Blur
  verwirft. So entfällt der separate Input-plus-Button-Block.

  `list` ist das reaktive $state-Array aus dem Eltern-Model; da es ein Proxy ist,
  wirken push/splice und `bind:value={list[i]}` direkt auf das Original zurück
  (kein $bindable nötig, Payload identisch zur Inline-Fassung).
-->
<script lang="ts">
	import { Icon } from '$lib/icons/cms';

	let {
		list,
		addLabel = '+ Punkt ergänzen',
		placeholder = ''
	}: {
		list: string[];
		/** Platzhalter der Ghost-Zeile (Aufforderung zum Anlegen). */
		addLabel?: string;
		/** Platzhalter der bestehenden Zeilen (leerer Eintrag). */
		placeholder?: string;
	} = $props();

	let draft = $state('');
	let ghostEl = $state<HTMLInputElement | null>(null);

	/** Nicht-leeren Entwurf anlegen; Feld leeren. Gibt zurück, ob angelegt wurde. */
	function commit(): boolean {
		const v = draft.trim();
		if (!v) return false;
		list.push(v);
		draft = '';
		return true;
	}
	function onGhostKeydown(e: KeyboardEvent) {
		if (e.key === 'Enter') {
			e.preventDefault();
			commit(); // Input behält den Fokus → direkt die nächste Ghost-Zeile
		} else if (e.key === 'Escape') {
			e.preventDefault();
			draft = '';
			ghostEl?.blur();
		}
	}
	function onGhostBlur() {
		commit(); // nicht-leer → anlegen, leer → verwerfen
		draft = '';
	}
</script>

<div class="string-list">
	{#each list as _, i (i)}
		<div class="string-list__row">
			<input class="string-list__input" bind:value={list[i]} {placeholder} />
			<button
				type="button"
				class="string-list__remove"
				onclick={() => list.splice(i, 1)}
				aria-label="Entfernen"><Icon name="close" /></button
			>
		</div>
	{/each}
	<div class="string-list__row string-list__row--ghost">
		<input
			bind:this={ghostEl}
			class="string-list__input string-list__ghost"
			bind:value={draft}
			placeholder={addLabel}
			aria-label={addLabel}
			onkeydown={onGhostKeydown}
			onblur={onGhostBlur}
		/>
	</div>
</div>

<style>
	.string-list {
		display: flex;
		flex-direction: column;
		/* Feld-Optik trägt die Kontur je Zeile → Zeilen bekommen Luft statt Hairlines. */
		gap: var(--z-ds-space-6);
	}
	.string-list__row {
		display: flex;
		align-items: center;
		gap: var(--z-ds-space-6);
	}
	/* Echte Feld-Optik: Inset-Fläche, deutliche Kontur, kleiner Radius. */
	.string-list__input {
		flex: 1;
		min-width: 0;
		font: inherit;
		font-size: var(--ds-text-sm);
		color: var(--ds-text);
		background: var(--ds-surface-inset);
		border: 1px solid var(--ds-border-strong);
		border-radius: var(--ds-radius-sm);
		padding: var(--z-ds-space-6) var(--z-ds-space-6);
	}
	.string-list__input:focus-visible {
		outline: 2px solid var(--ds-focus-ring);
		outline-offset: 1px;
	}
	/* Ghost-Zeile bleibt klar unterscheidbar: gestrichelte Kontur, gedämpfter Text,
	   leise/transparente Fläche — noch kein „echtes" Feld. */
	.string-list__ghost {
		background: transparent;
		border-style: dashed;
		border-color: var(--ds-border);
		color: var(--ds-text-muted);
	}
	.string-list__ghost::placeholder {
		color: var(--ds-text-faint);
	}
	.string-list__remove {
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
	.string-list__row:hover .string-list__remove,
	.string-list__row:focus-within .string-list__remove {
		opacity: 1;
	}
	.string-list__remove:hover {
		color: var(--ds-negative, var(--ds-text));
		background: rgb(from var(--ds-negative, var(--ds-text)) r g b / 0.1);
	}
	.string-list__remove:focus-visible {
		outline: 2px solid var(--ds-focus-ring);
		outline-offset: 2px;
		opacity: 1;
	}
	/* Touch-Geräte ohne Hover: Entfernen-Button dauerhaft sichtbar. */
	@media (hover: none) {
		.string-list__remove {
			opacity: 1;
		}
	}
	@media (prefers-reduced-motion: reduce) {
		.string-list__remove {
			transition: none;
		}
	}
</style>
