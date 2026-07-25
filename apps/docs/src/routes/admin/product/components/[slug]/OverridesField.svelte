<!--
  OverridesField — der Editor für BEGRÜNDETE Widersprüche gegen Maschinenwerte
  (MIGRATIONSPLAN §2.3, PR 7).

  Warum es diese Karte überhaupt gibt: Bis hierher konnte man einen Figma-Wert
  einfach in die Redaktionsdatei schreiben — er gewann kommentarlos, und wenn
  Figma ihn später korrigierte, maskierte der alte Eintrag den neuen LAUTLOS.
  Jetzt ist Widersprechen ein eigener, sichtbarer Vorgang mit vier Angaben:
  WAS gilt stattdessen (`wert`), WARUM (`grund`, PFLICHT), WOMIT belegt
  (`belegt`) und GEGEN WELCHEN Maschinenwert entschieden wurde (`maschinenwert`,
  automatisch mitgeschrieben). Der letzte Punkt ist der Kern: Bewegt sich die
  Quelle, meldet `check-content`, dass der Widerspruch neu zu prüfen ist.

  Einträge entstehen NICHT hier, sondern am Wert selbst — über „Widersprechen"
  in der Maschinen-Zone darüber. So steht die Entscheidung dort, wo der Wert
  steht, statt in einem Formular, das man erst finden muss.

  Props:
  - list:  reaktives Override-Array aus dem Eltern-Model (Proxy).
  - belege: Optionen für „belegt".
-->
<script lang="ts" module>
	/** Ein Widerspruch im Editor — alle Felder als String (bind:value-tauglich). */
	export type OverrideEntry = {
		pfad: string;
		wert: string;
		grund: string;
		belegt: string;
		maschinenwert: string;
	};

	/**
	 * Menschlicher Name eines Override-Pfads. Der Editor bietet Widersprüche
	 * heute nur für die Maße an — dort ist der Fall real (`text-button`), und
	 * jeder Zeile entspricht genau ein Punkt-Pfad ins Modell.
	 */
	export const PFAD_LABEL: Record<string, string> = {
		'masse.hoehe.px': 'Höhe',
		'masse.breite.px': 'Breite',
		'masse.padding.px': 'Innenabstand',
		'masse.radius.px': 'Radius'
	};

	/** Womit ist der abweichende Wert gedeckt? (Enum aus content.schema.json.) */
	export const BELEGE = [
		{ value: 'produktion', label: 'in der Produktion gemessen' },
		{ value: 'figma', label: 'in Figma belegt' },
		{ value: 'entscheidung', label: 'bewusste Entscheidung' }
	] as const;
</script>

<script lang="ts">
	import { Field, Select } from '$components/ui/field';
	import { Chip } from '$components/ui/chip';
	import { Icon } from '$lib/icons/cms';
	import { IconActionButton } from '$components/ui/icon-action-button';

	let {
		list,
		belege
	}: {
		list: OverrideEntry[];
		belege?: readonly { value: string; label: string }[];
	} = $props();

	const optionen = $derived(belege ?? BELEGE);
	const label = (pfad: string) => PFAD_LABEL[pfad] ?? pfad;
</script>

<div class="ovf">
	{#each list as _, i (list[i].pfad)}
		{@const eintrag = list[i]}
		<div class="ovf__row">
			<div class="ovf__head">
				<span class="ovf__title">{label(eintrag.pfad)}</span>
				<Chip value={eintrag.pfad} tone="machine" />
				<span class="ovf__machine">
					Maschine sagt <strong>{eintrag.maschinenwert || '—'}</strong>
				</span>
				<IconActionButton
					class="ovf__remove"
					onclick={() => list.splice(i, 1)}
					ariaLabel="Widerspruch zu {label(eintrag.pfad)} zurücknehmen"
					><Icon name="close" /></IconActionButton
				>
			</div>
			<div class="ovf__fields">
				<label class="ovf__field ovf__field--wert">
					<span class="ovf__label">Gilt stattdessen</span>
					<Field bind:value={list[i].wert} density="compact" placeholder="z. B. 34" />
				</label>
				<label class="ovf__field ovf__field--beleg">
					<span class="ovf__label">Belegt durch</span>
					<Select bind:value={list[i].belegt} density="compact">
						{#each optionen as b (b.value)}
							<option value={b.value}>{b.label}</option>
						{/each}
					</Select>
				</label>
			</div>
			<label class="ovf__field">
				<span class="ovf__label">
					Begründung
					<span class="ovf__required" aria-hidden="true">Pflicht</span>
				</span>
				<Field
					bind:value={list[i].grund}
					density="compact"
					multiline
					rows={2}
					error={!eintrag.grund.trim()}
					placeholder="Warum gilt hier etwas anderes als in Figma?"
				/>
			</label>
			{#if !eintrag.grund.trim()}
				<p class="ovf__hint">
					Ohne Begründung ist das nur ein stiller Override mit Extraschritt — Speichern bleibt
					gesperrt.
				</p>
			{/if}
		</div>
	{/each}
</div>

<style>
	.ovf {
		display: flex;
		flex-direction: column;
		gap: var(--z-ds-space-s);
	}
	/* Ein Widerspruch ist eine Aussage über EINEN Wert → eigene, abgesetzte Zeile
	   mit ruhiger Kontur (keine zweite Karte im Karten-Karton). */
	.ovf__row {
		display: flex;
		flex-direction: column;
		gap: var(--z-ds-space-6);
		padding: var(--z-ds-space-8);
		border: 1px solid var(--ds-border-soft);
		border-radius: var(--ds-radius-sm);
		background: var(--ds-surface);
	}
	.ovf__head {
		display: flex;
		align-items: center;
		gap: var(--z-ds-space-8);
		flex-wrap: wrap;
	}
	.ovf__title {
		font-size: var(--ds-text-sm);
		font-weight: 600;
		color: var(--ds-text);
	}
	.ovf__machine {
		font-size: var(--ds-text-xs);
		color: var(--ds-text-muted);
		/* Schiebt den Entfernen-Trigger ans Zeilenende. */
		margin-right: auto;
	}
	.ovf__machine strong {
		font-family: var(--ds-font-mono);
		font-weight: 400;
		color: var(--ds-text-body);
	}
	.ovf__fields {
		display: flex;
		gap: var(--z-ds-space-8);
		flex-wrap: wrap;
	}
	.ovf__field {
		display: flex;
		flex-direction: column;
		gap: 2px;
		min-width: 0;
	}
	.ovf__field--wert {
		flex: 1 1 8rem;
	}
	.ovf__field--beleg {
		flex: 1 1 12rem;
	}
	.ovf__label {
		display: flex;
		align-items: center;
		gap: var(--z-ds-space-6);
		font-size: var(--ds-text-xs);
		color: var(--ds-text-muted);
	}
	.ovf__required {
		color: var(--ds-text-faint);
		text-transform: uppercase;
		letter-spacing: 0.06em;
		font-size: 0.6875rem;
	}
	.ovf__hint {
		margin: 0;
		font-size: var(--ds-text-xs);
		color: var(--ds-negative, var(--ds-text-muted));
	}

	/* Entfernen-Trigger wie in den Listenzeilen: ruhig, erscheint bei Hover/Fokus. */
	.ovf__row :global(.ovf__remove) {
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
	.ovf__row:hover :global(.ovf__remove),
	.ovf__row:focus-within :global(.ovf__remove) {
		opacity: 1;
	}
	.ovf__row :global(.ovf__remove:hover) {
		color: var(--ds-negative, var(--ds-text));
		background: rgb(from var(--ds-negative, var(--ds-text)) r g b / 0.1);
	}
	.ovf__row :global(.ovf__remove:focus-visible) {
		outline: 2px solid var(--ds-focus-ring);
		outline-offset: 2px;
		opacity: 1;
	}
	@media (hover: none) {
		.ovf__row :global(.ovf__remove) {
			opacity: 1;
		}
	}
	@media (prefers-reduced-motion: reduce) {
		.ovf__row :global(.ovf__remove) {
			transition: none;
		}
	}
</style>
