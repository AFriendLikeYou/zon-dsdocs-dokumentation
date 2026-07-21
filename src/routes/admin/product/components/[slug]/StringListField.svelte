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
	import { Field } from '$components/ui/field';
	import { IconActionButton } from '$components/ui/icon-action-button';

	let {
		list,
		addLabel = '+ Punkt ergänzen',
		placeholder = '',
		itemLabel = 'Eintrag'
	}: {
		list: string[];
		/** Platzhalter der Ghost-Zeile (Aufforderung zum Anlegen). */
		addLabel?: string;
		/** Platzhalter der bestehenden Zeilen (leerer Eintrag). */
		placeholder?: string;
		/**
		 * Basis für das `aria-label` der bestehenden Zeilen („Eintrag 1", „Eintrag 2" …).
		 * Die Zeilen tragen keine sichtbare Beschriftung — ohne dieses Label wären sie
		 * für Screenreader namenlos (axe-Regel `label`, WCAG 4.1.2).
		 */
		itemLabel?: string;
	} = $props();

	let draft = $state('');

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
			(e.target as HTMLElement | null)?.blur();
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
			<Field
				class="string-list__input"
				density="compact"
				bind:value={list[i]}
				{placeholder}
				aria-label={`${itemLabel} ${i + 1}`}
			/>
			<IconActionButton
				class="string-list__remove"
				onclick={() => list.splice(i, 1)}
				ariaLabel="Entfernen"><Icon name="close" /></IconActionButton
			>
		</div>
	{/each}
	<div class="string-list__row string-list__row--ghost">
		<Field
			class="string-list__ghost"
			density="compact"
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
	/* Feld-Optik (Inset-Fläche, Kontur, Radius, Fokus) kommt aus dem Field-Atom
	   (compact). Das Field füllt die Zeile. */
	:global(.string-list__input) {
		flex: 1;
	}
	/* Ghost-Zeile bleibt klar unterscheidbar: gestrichelte Kontur, gedämpfter Text,
	   leise/transparente Fläche — noch kein „echtes" Feld. */
	:global(.string-list__ghost) {
		flex: 1;
		background: transparent;
		border-style: dashed;
		border-color: var(--ds-border);
	}
	:global(.string-list__ghost .field__control) {
		color: var(--ds-text-muted);
	}
	:global(.string-list__ghost .field__control::placeholder) {
		color: var(--ds-text-faint);
	}
	/* Der Entfernen-Button ist jetzt ui/IconActionButton; die Klasse wird durchgereicht
	   → Passthrough-Regeln als :global (unter der scoped .string-list__row verankert,
	   damit kein globaler Leak). Base-Look/Hover/Fokus/Touch bleiben wie zuvor. */
	.string-list__row :global(.string-list__remove) {
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
	.string-list__row:hover :global(.string-list__remove),
	.string-list__row:focus-within :global(.string-list__remove) {
		opacity: 1;
	}
	.string-list__row :global(.string-list__remove:hover) {
		color: var(--ds-negative, var(--ds-text));
		background: rgb(from var(--ds-negative, var(--ds-text)) r g b / 0.1);
	}
	.string-list__row :global(.string-list__remove:focus-visible) {
		outline: 2px solid var(--ds-focus-ring);
		outline-offset: 2px;
		opacity: 1;
	}
	/* Touch-Geräte ohne Hover: Entfernen-Button dauerhaft sichtbar. */
	@media (hover: none) {
		.string-list__row :global(.string-list__remove) {
			opacity: 1;
		}
	}
	@media (prefers-reduced-motion: reduce) {
		.string-list__row :global(.string-list__remove) {
			transition: none;
		}
	}
</style>
