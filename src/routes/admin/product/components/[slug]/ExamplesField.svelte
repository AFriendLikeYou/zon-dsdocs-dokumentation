<!--
  ExamplesField — Redaktions-Editor für die benannten `beispiele` einer Komponente
  (Design-Tab, direkt hinter dem Playground). Je Beispiel eine Karte:
  titel · beschreibung · die gezeigten INSTANZEN · welche Varianten-Werte das
  Beispiel abdeckt · ✕-Entfernen. „+ Beispiel" hängt einen leeren Eintrag an.

  Eine Instanz ist ein Satz Control-Werte — genau der Playground-State. Darum
  bietet der Editor je Instanz exakt die `render.controls` der Komponente an
  (Select → Dropdown, toggle/attr → Häkchen) statt freier Strings: was hier
  einstellbar ist, kann das Template auch instanziieren. Ohne `render.template`
  (Specimen-Escape-Hatch) gibt es nichts zu instanziieren — dann erklärt das Feld,
  warum es leer bleibt.

  `abdeckt` verknüpft das Beispiel mit den Varianten-Werten aus Figma: abgehakte
  Werte fallen aus dem „Weitere Varianten"-Raster der Doku-Seite. Sind alle
  abgehakt, entfällt die Sektion — Redaktionsarbeit wird sofort sichtbar belohnt,
  und was NICHT abgedeckt ist, bleibt im Raster stehen statt still zu verschwinden.

  `list` ist das reaktive $state-Array aus dem Eltern-Model (Proxy) → push/splice
  und `bind:value={list[i].feld}` wirken direkt aufs Original zurück.
-->
<script lang="ts" module>
	/** Control-Werte einer Instanz: Control-Key → Wert (String für select, Boolean sonst). */
	export type Instanz = Record<string, string | boolean>;
	export type Beispiel = {
		titel: string;
		beschreibung: string;
		instanzen: Instanz[];
		abdeckt: string[];
	};
	export type Control = {
		key: string;
		label: string;
		type: string;
		default?: string | boolean;
		options?: { value: string; label: string }[];
	};

	/** Startwert eines Controls — deckungsgleich mit dem Playground-Default. */
	function controlDefault(c: Control): string | boolean {
		if (c.default !== undefined) return c.default;
		return c.type === 'select' ? (c.options?.[0]?.value ?? '') : false;
	}

	/**
	 * Neue Instanz = alle Controls auf ihrem Default (der Redakteur ändert nur, was
	 * zählt). Exportiert, weil auch die Editor-Seite beim Aufklappen der Ghost-Karte
	 * ein erstes Beispiel anlegt — eine Quelle für beide.
	 */
	export function blankInstanz(controls: Control[]): Instanz {
		const out: Instanz = {};
		for (const c of controls) out[c.key] = controlDefault(c);
		return out;
	}

	/** Leeres Beispiel mit einer Default-Instanz. */
	export function blankBeispiel(controls: Control[]): Beispiel {
		return { titel: '', beschreibung: '', instanzen: [blankInstanz(controls)], abdeckt: [] };
	}
</script>

<script lang="ts">
	import { Icon } from '$lib/icons/cms';
	import { IconActionButton } from '$components/ui/icon-action-button';
	import { Button } from '$components/ui/button';
	import { Checkbox } from '$components/ui/checkbox';
	import { Field, Select } from '$components/ui/field';

	let {
		list,
		controls = [],
		hatTemplate = false,
		variantLabels = []
	}: {
		/** Reaktives Beispiel-Array aus dem Eltern-Model. */
		list: Beispiel[];
		/** Playground-Controls der Komponente (render.controls) — die Achsen einer Instanz. */
		controls?: Control[];
		/** Hat die Komponente ein render.template? Ohne das rendern Beispiele nicht. */
		hatTemplate?: boolean;
		/** Varianten-Werte-Labels aus den Maschinen-Achsen (Ziel von `abdeckt`). */
		variantLabels?: string[];
	} = $props();

	function toggleAbdeckt(beispiel: Beispiel, label: string, an: boolean) {
		if (an) {
			if (!beispiel.abdeckt.includes(label)) beispiel.abdeckt.push(label);
		} else {
			const idx = beispiel.abdeckt.indexOf(label);
			if (idx > -1) beispiel.abdeckt.splice(idx, 1);
		}
	}
</script>

{#if !hatTemplate}
	<p class="examples__note">
		Diese Komponente rendert über ein eigenes <code>Specimen.svelte</code> statt über ein
		<code>render.template</code>. Benannte Beispiele brauchen ein Template zum Instanziieren und
		erscheinen deshalb auf der Doku-Seite nicht.
	</p>
{/if}

<div class="examples">
	{#each list as beispiel, i (i)}
		<div class="examples__item">
			<div class="examples__head">
				<Field
					class="examples__title"
					density="compact"
					bind:value={list[i].titel}
					placeholder="Titel des Beispiels, z. B. „Semantik“"
					aria-label="Titel"
				/>
				<IconActionButton
					class="examples__remove"
					onclick={() => list.splice(i, 1)}
					ariaLabel="Beispiel entfernen"><Icon name="close" /></IconActionButton
				>
			</div>
			<Field
				density="compact"
				multiline
				rows={2}
				bind:value={list[i].beschreibung}
				placeholder="Ein bis zwei Sätze: Was zeigt das Beispiel, wann greift man dazu?"
				aria-label="Beschreibung"
			/>

			{#if controls.length}
				<fieldset class="examples__group">
					<legend class="examples__legend">Instanzen</legend>
					{#each beispiel.instanzen as instanz, j (j)}
						<div class="examples__instance">
							{#each controls as c (c.key)}
								<span class="examples__control">
									{#if c.type === 'select'}
										<!-- Select ist ein natives <select> unter der Feld-Optik: der Wert kommt
										     über den DOM-Change (kein bind:value, weil `instanz[key]` string|boolean ist). -->
										<Select
											class="examples__select"
											density="compact"
											value={String(instanz[c.key] ?? '')}
											options={c.options ?? []}
											aria-label="{c.label} — Instanz {j + 1}"
											onchange={(e: Event & { currentTarget: HTMLSelectElement }) =>
												(instanz[c.key] = e.currentTarget.value)}
										/>
									{:else}
										<Checkbox
											label={c.label}
											checked={!!instanz[c.key]}
											onchange={(v: boolean) => (instanz[c.key] = v)}
										/>
									{/if}
								</span>
							{/each}
							<IconActionButton
								class="examples__remove"
								onclick={() => beispiel.instanzen.splice(j, 1)}
								ariaLabel="Instanz {j + 1} entfernen"><Icon name="close" /></IconActionButton
							>
						</div>
					{/each}
					<Button dashed size="sm" onclick={() => beispiel.instanzen.push(blankInstanz(controls))}>
						+ Instanz
					</Button>
				</fieldset>
			{/if}

			{#if variantLabels.length}
				<fieldset class="examples__group">
					<legend class="examples__legend">
						Deckt diese Varianten ab — abgehakte fallen aus „Weitere Varianten"
					</legend>
					<div class="examples__covers">
						{#each variantLabels as label (label)}
							<Checkbox
								{label}
								checked={beispiel.abdeckt.includes(label)}
								onchange={(v: boolean) => toggleAbdeckt(beispiel, label, v)}
							/>
						{/each}
					</div>
				</fieldset>
			{/if}
		</div>
	{/each}
	<Button dashed onclick={() => list.push(blankBeispiel(controls))}>+ Beispiel</Button>
</div>

<style>
	.examples {
		display: flex;
		flex-direction: column;
		gap: var(--z-ds-space-s);
	}
	.examples__note {
		margin: 0 0 var(--z-ds-space-8);
		font-size: var(--ds-text-sm);
		line-height: 1.5;
		color: var(--ds-text-muted);
	}
	.examples__item {
		display: flex;
		flex-direction: column;
		gap: var(--z-ds-space-8);
		padding: var(--z-ds-space-8);
		border: 1px solid var(--ds-border-soft);
		border-radius: var(--ds-radius-sm);
		background: var(--ds-surface);
	}
	.examples__head {
		display: flex;
		align-items: center;
		gap: var(--z-ds-space-6);
	}
	/* Titel-Feld wächst; das Field-Atom trägt die Optik. */
	:global(.examples__title) {
		flex: 1;
		min-width: 0;
	}
	/* Gruppen (Instanzen · Abdeckung) — fieldset/legend statt Pseudo-Überschriften,
	   damit Screenreader die Zugehörigkeit der Bedienelemente hören. */
	.examples__group {
		display: flex;
		flex-direction: column;
		align-items: flex-start;
		gap: var(--z-ds-space-6);
		margin: 0;
		padding: 0;
		border: none;
	}
	.examples__legend {
		padding: 0;
		font-size: var(--ds-text-xs);
		font-weight: 500;
		color: var(--ds-text-muted);
	}
	.examples__instance {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: var(--z-ds-space-8);
		width: 100%;
	}
	.examples__control {
		display: inline-flex;
		align-items: center;
	}
	:global(.examples__select) {
		width: auto;
	}
	.examples__covers {
		display: flex;
		flex-wrap: wrap;
		gap: var(--z-ds-space-12);
	}
	/* Entfernen-Button = ui/IconActionButton (Klasse durchgereicht) → Passthrough-Regeln
	   als :global unter den scoped Zeilen (kein globaler Leak). */
	.examples__item :global(.examples__remove) {
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
		transition:
			background var(--ds-dur, 0.15s) var(--ds-ease-out, ease-out),
			color var(--ds-dur, 0.15s) var(--ds-ease-out, ease-out);
	}
	.examples__item :global(.examples__remove:hover) {
		color: var(--ds-negative, var(--ds-text));
		background: rgb(from var(--ds-negative, var(--ds-text)) r g b / 0.1);
	}
	.examples__item :global(.examples__remove:focus-visible) {
		outline: 2px solid var(--ds-focus-ring);
		outline-offset: 2px;
	}
	/* „+ Beispiel" / „+ Instanz" = ui/Button dashed; nur die Ausrichtung bleibt hier. */
	.examples :global(.app-button) {
		align-self: flex-start;
	}
	@media (prefers-reduced-motion: reduce) {
		.examples__item :global(.examples__remove) {
			transition: none;
		}
	}
</style>
