<!--
  TextListField — Zeilen-Editor für eine kurze, geordnete String-Liste des
  Startseiten-Editors (Überschrift-Zeilen des Heros, Stichworte der Stats-Zeile).

  Bewusst schlanker als der StringListField des Spec-Editors: die Listen hier sind
  kurz und ihre REIHENFOLGE ist gestalterisch relevant (Zeile 1 steht über Zeile 2),
  darum gibt es ↑/↓ statt einer Ghost-Zeile mit Schnell-Anlegen.

  `list` ist das reaktive $state-Array des Eltern-Models; als Proxy wirken
  push/splice und `bind:value={list[i]}` direkt auf das Original zurück
  (kein $bindable nötig — Muster wie StringListField).

  Atome: ui/field (Feld-Optik), ui/icon-action-button (Werkzeuge), ui/button (Anlegen).
-->
<script lang="ts">
	import { Field } from '$components/ui/field';
	import { IconActionButton } from '$components/ui/icon-action-button';
	import { Button } from '$components/ui/button';
	import { ButtonGroup } from '$components/ui/button-group';

	let {
		list,
		itemLabel = 'Eintrag',
		addLabel = '+ Zeile',
		placeholder = '',
		maxLength
	}: {
		list: string[];
		/** Basis des `aria-label` je Zeile — die Zeilen tragen keine sichtbare
		 *  Beschriftung und wären für Screenreader sonst namenlos (WCAG 4.1.2). */
		itemLabel?: string;
		/** Beschriftung des Anlegen-Buttons. */
		addLabel?: string;
		/** Platzhalter leerer Zeilen. */
		placeholder?: string;
		/** Empfohlene Höchstlänge — färbt die Zeile, sobald sie überschritten ist. */
		maxLength?: number;
	} = $props();

	function move(i: number, delta: number) {
		const to = i + delta;
		if (to < 0 || to >= list.length) return;
		const [item] = list.splice(i, 1);
		list.splice(to, 0, item);
	}
</script>

<div class="list">
	{#each list as _, i (i)}
		<div class="row">
			<Field
				class="row__input"
				density="compact"
				bind:value={list[i]}
				{placeholder}
				aria-label="{itemLabel} {i + 1}"
				error={maxLength !== undefined && list[i].length > maxLength}
			/>
			<ButtonGroup attached label="{itemLabel} {i + 1} verschieben">
				<IconActionButton
					subtle
					ariaLabel="{itemLabel} {i + 1} nach oben"
					title="Nach oben"
					disabled={i === 0}
					onclick={() => move(i, -1)}>↑</IconActionButton
				>
				<IconActionButton
					subtle
					ariaLabel="{itemLabel} {i + 1} nach unten"
					title="Nach unten"
					disabled={i === list.length - 1}
					onclick={() => move(i, 1)}>↓</IconActionButton
				>
			</ButtonGroup>
			<IconActionButton
				subtle
				tone="danger"
				ariaLabel="{itemLabel} {i + 1} entfernen"
				title="Entfernen"
				onclick={() => list.splice(i, 1)}>✕</IconActionButton
			>
		</div>
	{/each}
	<Button variant="quiet" dashed onclick={() => list.push('')}>{addLabel}</Button>
</div>

<style>
	.list {
		display: grid;
		gap: var(--z-ds-space-8);
		justify-items: start;
	}
	.row {
		display: flex;
		align-items: center;
		gap: var(--z-ds-space-6);
		width: 100%;
	}
	/* :global, weil die Klasse als Prop in das Field-Atom hineinreicht. */
	.row :global(.row__input) {
		flex: 1;
		min-width: 0;
	}
</style>
