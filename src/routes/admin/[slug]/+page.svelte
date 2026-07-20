<script lang="ts">
	import { untrack } from 'svelte';
	import { enhance } from '$app/forms';
	import type { SubmitFunction } from '@sveltejs/kit';
	import { getToastState } from '$stores/toast-state.svelte';
	import { Icon } from '$lib/icons/cms';
	import { AdminPageHeader } from '../ui';
	import { Alert } from '$components/ui/alert';
	import { Checkbox } from '$components/ui/checkbox';
	import { Field, Select } from '$components/ui/field';
	import { Button } from '$components/ui/button';

	let { data }: import('./$types').PageProps = $props();

	const toast = getToastState();

	// Editierbare Teilmenge, initialisiert aus content.json. Reaktiver Client-State;
	// beim Submit als JSON in ein Hidden-Feld serialisiert (robuster als FormData-
	// Array-Parsing). Der Server merged nur diese Keys zurück.
	type A11yStatus = 'pass' | 'warn' | 'todo';
	type CalloutRow = { nr: number; text: string; art?: string; optionalDurch?: string };
	type Content = {
		zweck: string;
		status: string;
		verwendung: { nutzen: string[]; nichtNutzen: string[] };
		doDont: { do: string[]; dont: string[] };
		variantInfo: { key: string; value: string }[];
		a11y: { label: string; wert: string; status: A11yStatus }[];
		tastatur: { taste: string; aktion: string }[];
		callouts: CalloutRow[];
		wording: { schlecht: string; gut: string; hinweis: string }[];
		komposition: string[];
		verwandt: string[];
		playground: { align: 'center' | 'fill'; resizable: boolean };
	};

	const c = data.content as {
		zweck?: string;
		status?: string;
		verwendung?: { nutzen?: string[]; nichtNutzen?: string[] };
		doDont?: { do?: string[]; dont?: string[] };
		variantInfo?: Record<string, string>;
		a11y?: { label?: string; wert?: string; status?: string }[];
		tastatur?: { taste?: string; aktion?: string }[];
		callouts?: { nr?: number; text?: string; art?: string; optionalDurch?: string }[];
		wording?: { schlecht?: string; gut?: string; hinweis?: string }[];
		komposition?: string[];
		verwandt?: string[];
		playground?: { align?: 'center' | 'fill'; resizable?: boolean };
	};
	// Frischer Content-Zustand aus content.json — Fabrik, damit „Verwerfen" (und der
	// Reset nach dem Speichern) exakt denselben Ausgangsstand wiederherstellen kann.
	function makeState(): Content {
		return {
			zweck: c.zweck ?? '',
			status: c.status ?? 'ready_for_dev',
			verwendung: {
				nutzen: [...(c.verwendung?.nutzen ?? [])],
				nichtNutzen: [...(c.verwendung?.nichtNutzen ?? [])]
			},
			doDont: { do: [...(c.doDont?.do ?? [])], dont: [...(c.doDont?.dont ?? [])] },
			variantInfo: Object.entries(c.variantInfo ?? {}).map(([key, value]) => ({
				key,
				value: String(value)
			})),
			a11y: (c.a11y ?? []).map((r) => ({
				label: r.label ?? '',
				wert: r.wert ?? '',
				status: (r.status ?? 'warn') as A11yStatus
			})),
			tastatur: (c.tastatur ?? []).map((r) => ({ taste: r.taste ?? '', aktion: r.aktion ?? '' })),
			// nr/text editierbar; art/optionalDurch werden pro Zeile mitgeführt und beim
			// Speichern erhalten (Round-Trip-sicher — keine Datenverluste an der Anatomie).
			callouts: (c.callouts ?? []).map((r) => ({
				nr: Number(r.nr ?? 0),
				text: r.text ?? '',
				...(r.art !== undefined ? { art: r.art } : {}),
				...(r.optionalDurch !== undefined ? { optionalDurch: r.optionalDurch } : {})
			})),
			wording: (c.wording ?? []).map((r) => ({
				schlecht: r.schlecht ?? '',
				gut: r.gut ?? '',
				hinweis: r.hinweis ?? ''
			})),
			komposition: [...(c.komposition ?? [])],
			verwandt: [...(c.verwandt ?? [])],
			// Playground-Bühne: Defaults center/false, wenn content.json nichts setzt.
			playground: {
				align: c.playground?.align === 'fill' ? 'fill' : 'center',
				resizable: c.playground?.resizable === true
			}
		};
	}
	let model = $state<Content>(makeState());

	// State → content.json-Form. Leere Listen/Objekte weglassen, damit die Datei
	// nicht mit leeren Feldern aufgebläht wird (und check-content sauber bleibt).
	const payload = $derived.by(() => {
		const out: Record<string, unknown> = { zweck: model.zweck.trim(), status: model.status };
		const nutzen = model.verwendung.nutzen.map((s) => s.trim()).filter(Boolean);
		const nichtNutzen = model.verwendung.nichtNutzen.map((s) => s.trim()).filter(Boolean);
		if (nutzen.length || nichtNutzen.length) out.verwendung = { nutzen, nichtNutzen };
		const doo = model.doDont.do.map((s) => s.trim()).filter(Boolean);
		const dont = model.doDont.dont.map((s) => s.trim()).filter(Boolean);
		if (doo.length || dont.length) out.doDont = { do: doo, dont };
		const vi = Object.fromEntries(
			model.variantInfo.filter((r) => r.key.trim()).map((r) => [r.key.trim(), r.value])
		);
		if (Object.keys(vi).length) out.variantInfo = vi;

		// a11y — Zeile behalten, sobald Label oder Wert etwas enthält; status immer dabei.
		const a11y = model.a11y
			.filter((r) => r.label.trim() || r.wert.trim())
			.map((r) => ({ label: r.label.trim(), wert: r.wert.trim(), status: r.status }));
		if (a11y.length) out.a11y = a11y;

		// tastatur — { taste, aktion }; leere Zeilen weglassen.
		const tastatur = model.tastatur
			.filter((r) => r.taste.trim() || r.aktion.trim())
			.map((r) => ({ taste: r.taste.trim(), aktion: r.aktion.trim() }));
		if (tastatur.length) out.tastatur = tastatur;

		// callouts — nr/text; art/optionalDurch nur schreiben, wenn gesetzt (erhalten).
		const callouts = model.callouts
			.filter((r) => r.text.trim())
			.map((r) => {
				const o: Record<string, unknown> = { nr: r.nr, text: r.text.trim() };
				if (r.art) o.art = r.art;
				if (r.optionalDurch) o.optionalDurch = r.optionalDurch;
				return o;
			});
		if (callouts.length) out.callouts = callouts;

		// wording — { schlecht, gut, hinweis? }; hinweis leer → weglassen.
		const wording = model.wording
			.filter((r) => r.schlecht.trim() || r.gut.trim())
			.map((r) => {
				const o: Record<string, unknown> = { schlecht: r.schlecht.trim(), gut: r.gut.trim() };
				const h = r.hinweis.trim();
				if (h) o.hinweis = h;
				return o;
			});
		if (wording.length) out.wording = wording;

		// komposition — Hinweise (je ein Satz), wie mit anderen Komponenten kombiniert
		// wird; leere Zeilen weglassen.
		const komposition = model.komposition.map((s) => s.trim()).filter(Boolean);
		if (komposition.length) out.komposition = komposition;

		// verwandt — Liste von Katalog-Slugs; leere/Dubletten entfernen.
		const verwandt = [...new Set(model.verwandt.map((s) => s.trim()).filter(Boolean))];
		if (verwandt.length) out.verwandt = verwandt;

		// playground — nur schreiben, wenn von den Defaults (center + false) abgewichen wird;
		// jeweils nur den abweichenden Key setzen, damit content.json minimal bleibt.
		const pg: Record<string, unknown> = {};
		if (model.playground.align === 'fill') pg.align = 'fill';
		if (model.playground.resizable) pg.resizable = true;
		if (Object.keys(pg).length) out.playground = pg;

		return JSON.stringify(out);
	});

	function addTo(list: string[]) {
		list.push('');
	}
	function removeFrom<T>(list: T[], i: number) {
		list.splice(i, 1);
	}

	// ── Dirty-Tracking + Save-Bar (Muster aus dem Brand-Editor) ───────────────
	// `payload` ist die kanonische Beschreibung des Editor-Stands; ein Snapshot beim
	// Laden/Speichern macht „dirty" zu einem einfachen String-Vergleich.
	let formEl = $state<HTMLFormElement | null>(null);
	let savedPayload = $state(untrack(() => payload));
	const dirty = $derived(payload !== savedPayload);

	function discard() {
		model = makeState();
	}

	// Save-Feedback über die globale Toast-Message (wie im Brand-Editor). Nach Erfolg
	// den Snapshot nachziehen, damit die Save-Bar verschwindet.
	const handleSubmit: SubmitFunction = () => {
		return async ({ result, update }) => {
			await update({ reset: false });
			if (result.type === 'success') {
				toast?.add('Gespeichert', 'Die Doku-Seite zeigt die Änderung nach dem Reload.');
				savedPayload = payload;
			} else if (result.type === 'failure') {
				const msg = (result.data as { message?: string } | undefined)?.message;
				toast?.add('Nicht gespeichert', msg ?? 'Unbekannter Fehler.');
			} else if (result.type === 'error') {
				toast?.add('Fehler', result.error?.message ?? 'Speichern fehlgeschlagen.');
			}
		};
	};

	function onGlobalKeydown(e: KeyboardEvent) {
		if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 's') {
			e.preventDefault();
			if (dirty && data.writable) formEl?.requestSubmit();
		}
	}
	function onBeforeUnload(e: BeforeUnloadEvent) {
		if (dirty) e.preventDefault();
	}
</script>

<svelte:head><title>{data.name} bearbeiten – Admin</title></svelte:head>
<svelte:window onkeydown={onGlobalKeydown} onbeforeunload={onBeforeUnload} />

<!--
  stringListCard — Karte für eine flache String-Liste (Verwendung, Do/Don't,
  Komposition). `liste` ist das reaktive Original-Array aus `model`; bind:value auf
  `liste[i]` schreibt direkt zurück (Payload identisch zur früheren Inline-Fassung).
-->
{#snippet stringListCard(titel: string, liste: string[], addLabel: string, platzhalter = '')}
	<section class="card">
		<div class="card-head"><span class="card-title">{titel}</span></div>
		<div class="card-body">
			{#each liste as _, i}
				<div class="field-row">
					<Field density="compact" bind:value={liste[i]} placeholder={platzhalter} />
					<button
						type="button"
						class="row-remove"
						onclick={() => removeFrom(liste, i)}
						aria-label="Entfernen"><Icon name="trash" /></button
					>
				</div>
			{/each}
			<Button dashed onclick={() => addTo(liste)}>{addLabel}</Button>
		</div>
	</section>
{/snippet}

<!--
  keyValueCard — Karte für eine Liste von Schlüssel/Wert-Objekten (Varianten-Info,
  Tastatur). `keyProp`/`valProp` benennen die beiden Felder je Zeile; bind:value auf
  `liste[i][keyProp]` mutiert das Original-Objekt (Payload identisch).
-->
{#snippet keyValueCard(
	titel: string,
	liste: Record<string, string>[],
	keyProp: string,
	valProp: string,
	keyPlatzhalter: string,
	valPlatzhalter: string,
	addLabel: string,
	neueZeile: Record<string, string>,
	hinweis = ''
)}
	<section class="card">
		<div class="card-head"><span class="card-title">{titel}</span></div>
		<div class="card-body">
			{#if hinweis}<p class="hint">{hinweis}</p>{/if}
			{#each liste as _, i}
				<div class="field-row field-row--pair">
					<Field
						class="field-row__key"
						density="compact"
						bind:value={liste[i][keyProp]}
						placeholder={keyPlatzhalter}
					/>
					<Field density="compact" bind:value={liste[i][valProp]} placeholder={valPlatzhalter} />
					<button
						type="button"
						class="row-remove"
						onclick={() => removeFrom(liste, i)}
						aria-label="Entfernen"><Icon name="trash" /></button
					>
				</div>
			{/each}
			<Button dashed onclick={() => liste.push({ ...neueZeile })}>{addLabel}</Button>
		</div>
	</section>
{/snippet}

<!-- readonlyChip — Marker rechts neben dem Titel, wenn Schreiben deaktiviert ist. -->
{#snippet readonlyChip()}
	<span class="readonly-chip">Nur lesen</span>
{/snippet}

<div class="edit">
	<AdminPageHeader
		title={data.name}
		crumb={{ href: '/admin', label: 'Alle Komponenten' }}
		actions={data.writable ? undefined : readonlyChip}
	>
		Bearbeitet <code>content.json</code>. Andere Felder bleiben unverändert.
	</AdminPageHeader>

	{#if !data.writable}
		<Alert compact variant="warning">
			Nur-Lese-Vorschau: Schreiben ist im Prod-Modus deaktiviert (Phase 1b: GitHub-PR).
		</Alert>
	{/if}

	<form method="POST" bind:this={formEl} use:enhance={handleSubmit}>
		<input type="hidden" name="payload" value={payload} />

		<section class="card">
			<div class="card-head"><span class="card-title">Zweck</span></div>
			<div class="card-body">
				<Field density="compact" multiline rows={3} bind:value={model.zweck} />
			</div>
		</section>

		<section class="card">
			<div class="card-head"><span class="card-title">Status</span></div>
			<div class="card-body">
				<Select
					density="compact"
					bind:value={model.status}
					options={[
						{ value: 'ready_for_dev', label: 'ready_for_dev' },
						{ value: 'completed', label: 'completed' },
						{ value: 'changed', label: 'changed' }
					]}
				/>
			</div>
		</section>

		<section class="card">
			<div class="card-head"><span class="card-title">Playground-Bühne</span></div>
			<div class="card-body">
				<label class="sub-label" for="pg-align">Ausrichtung</label>
				<Select
					id="pg-align"
					density="compact"
					bind:value={model.playground.align}
					options={[
						{ value: 'center', label: 'Zentriert (Objekt auf Bühne)' },
						{ value: 'fill', label: 'Volle Breite (Ausschnitt aus Seite)' }
					]}
				/>
				<Checkbox bind:checked={model.playground.resizable} label="Resize-Handle anzeigen" />
			</div>
		</section>

		{@render stringListCard('Verwendung — Wann nutzen', model.verwendung.nutzen, '+ Zeile')}
		{@render stringListCard('Verwendung — Wann nicht', model.verwendung.nichtNutzen, '+ Zeile')}
		{@render stringListCard('Do', model.doDont.do, '+ Zeile')}
		{@render stringListCard("Don't", model.doDont.dont, '+ Zeile')}

		{@render keyValueCard(
			'Varianten-Info (Label → Text)',
			model.variantInfo,
			'key',
			'value',
			'Label',
			'Beschreibung',
			'+ Eintrag',
			{ key: '', value: '' },
			data.variantLabels.length ? `Bekannte Labels: ${data.variantLabels.join(', ')}` : ''
		)}

		<section class="card">
			<div class="card-head">
				<span class="card-title">Barrierefreiheit (Label · Wert · Status)</span>
			</div>
			<div class="card-body">
				{#each model.a11y as _, i}
					<div class="field-row field-row--a11y">
						<Field class="field-row__key" density="compact" bind:value={model.a11y[i].label} placeholder="Label" />
						<Field density="compact" bind:value={model.a11y[i].wert} placeholder="Wert" />
						<Select
							class="field-row__status"
							density="compact"
							bind:value={model.a11y[i].status}
							options={[
								{ value: 'pass', label: 'pass' },
								{ value: 'warn', label: 'warn' },
								{ value: 'todo', label: 'todo' }
							]}
						/>
						<button
							type="button"
							class="row-remove"
							onclick={() => removeFrom(model.a11y, i)}
							aria-label="Entfernen"><Icon name="trash" /></button
						>
					</div>
				{/each}
				<Button dashed onclick={() => model.a11y.push({ label: '', wert: '', status: 'warn' })}
					>+ Eintrag</Button
				>
			</div>
		</section>

		{@render keyValueCard(
			'Tastatur (Taste → Aktion)',
			model.tastatur,
			'taste',
			'aktion',
			'Taste',
			'Aktion',
			'+ Zeile',
			{ taste: '', aktion: '' }
		)}

		<section class="card">
			<div class="card-head"><span class="card-title">Anatomie-Callouts (Nr · Text)</span></div>
			<div class="card-body">
				{#each model.callouts as _, i}
					<div class="field-row">
						<!-- Nummer: nacktes number-Input (justiert) — Field ist string-typisiert,
						     nr ist numerisch und geht so 1:1 wieder in content.json. -->
						<input
							class="field-row__number"
							type="number"
							min="1"
							bind:value={model.callouts[i].nr}
							aria-label="Nummer"
						/>
						<Field density="compact" bind:value={model.callouts[i].text} placeholder="Beschreibung" />
						<button
							type="button"
							class="row-remove"
							onclick={() => removeFrom(model.callouts, i)}
							aria-label="Entfernen"><Icon name="trash" /></button
						>
					</div>
				{/each}
				<Button
					dashed
					onclick={() => model.callouts.push({ nr: model.callouts.length + 1, text: '' })}
					>+ Callout</Button
				>
			</div>
		</section>

		<section class="card">
			<div class="card-head">
				<span class="card-title">Wording (Schlecht · Gut · Hinweis)</span>
			</div>
			<div class="card-body">
				{#each model.wording as _, i}
					<div class="field-row">
						<Field density="compact" bind:value={model.wording[i].schlecht} placeholder="Schlecht" />
						<Field density="compact" bind:value={model.wording[i].gut} placeholder="Gut" />
						<Field density="compact" bind:value={model.wording[i].hinweis} placeholder="Hinweis (optional)" />
						<button
							type="button"
							class="row-remove"
							onclick={() => removeFrom(model.wording, i)}
							aria-label="Entfernen"><Icon name="trash" /></button
						>
					</div>
				{/each}
				<Button dashed onclick={() => model.wording.push({ schlecht: '', gut: '', hinweis: '' })}
					>+ Regel</Button
				>
			</div>
		</section>

		{@render stringListCard(
			'Komposition (Hinweise für Agenten & Devs)',
			model.komposition,
			'+ Hinweis',
			'z. B. In Formularen zusammen mit Input und Label verwenden.'
		)}

		<section class="card">
			<div class="card-head">
				<span class="card-title">Verwandte Komponenten (Katalog-Slugs)</span>
			</div>
			<div class="card-body">
				{#each model.verwandt as _, i}
					<div class="field-row">
						<Select density="compact" bind:value={model.verwandt[i]}>
							<option value="" disabled>– Komponente wählen –</option>
							{#each data.slugs as s}
								<option value={s.slug}>{s.name} ({s.slug})</option>
							{/each}
						</Select>
						<button
							type="button"
							class="row-remove"
							onclick={() => removeFrom(model.verwandt, i)}
							aria-label="Entfernen"><Icon name="trash" /></button
						>
					</div>
				{/each}
				<Button dashed onclick={() => model.verwandt.push('')}>+ Slug</Button>
			</div>
		</section>

		{#if dirty}
			<div class="savebar" role="status">
				<span class="savebar-info">Ungespeicherte Änderungen</span>
				<button type="button" class="savebar-discard" onclick={discard}>Verwerfen</button>
				<button type="submit" class="save" disabled={!data.writable}>Speichern <kbd>⌘S</kbd></button
				>
			</div>
		{/if}
	</form>
</div>

<style>
	.edit {
		max-width: 46rem;
		margin: 0 auto;
		/* unten Luft für die schwebende Save-Bar */
		padding: var(--z-ds-space-xl) var(--z-ds-space-l) 7rem;
	}
	/* Nur-Lese-Marker rechts neben dem Titel (im Aktions-Slot des AdminPageHeader). */
	.readonly-chip {
		font-size: var(--ds-text-xs);
		font-weight: 600;
		letter-spacing: var(--ds-label-tracking);
		text-transform: uppercase;
		color: var(--ds-text-muted);
		background: var(--ds-surface-raised, var(--ds-surface));
		border: 1px solid var(--ds-border-soft);
		border-radius: 999px;
		padding: 2px var(--z-ds-space-s);
	}
	/* Karten-Blöcke wie im Brand-Editor (Figma 689:11510): Fläche raised, radius 8,
	   padding 12; Kopf mit Border-bottom (Label 12 bold uppercase, muted) + gestapelter
	   Body. */
	.card {
		background: var(--ds-surface-raised, var(--ds-surface));
		border-radius: var(--ds-radius, 8px);
		padding: 12px;
		margin-bottom: var(--z-ds-space-m);
	}
	.card-head {
		padding: 0 0 8px;
		border-bottom: 1px solid var(--ds-border);
	}
	.card-title {
		font-size: var(--ds-text-xs);
		text-transform: uppercase;
		letter-spacing: var(--ds-label-tracking);
		font-weight: 600;
		color: var(--ds-text-muted);
	}
	.card-body {
		display: flex;
		flex-direction: column;
		gap: var(--z-ds-space-s);
		padding: 8px 0 0;
	}
	.hint {
		font-size: var(--ds-text-xs);
		color: var(--ds-text-muted);
		margin: 0;
	}
	/* Nacktes number-Input (Callout-Nummer) — die einzige rohe Feld-Optik, die bleibt. */
	input[type='number'] {
		width: 100%;
		font: inherit;
		font-size: var(--ds-text-sm);
		color: var(--ds-text);
		background: var(--ds-surface);
		border: 1px solid var(--ds-border);
		border-radius: var(--ds-radius-sm);
		padding: var(--z-ds-space-6) var(--z-ds-space-8);
	}
	input[type='number']:focus-visible {
		outline: 2px solid var(--ds-focus-ring);
		outline-offset: 1px;
	}
	.field-row {
		display: flex;
		align-items: center;
		gap: var(--z-ds-space-8);
	}
	/* Breiten-Begrenzungen liegen auf den Field/Select-Wrappern (Kind-Komponente) → :global. */
	:global(.field-row__key) {
		max-width: 12rem;
	}
	.field-row__number {
		max-width: 5rem;
		flex: none;
	}
	:global(.field-row__status) {
		max-width: 8rem;
		flex: none;
	}
	.sub-label {
		font-size: var(--ds-text-xs);
		color: var(--ds-text-muted);
		margin: var(--z-ds-space-xs) 0 var(--z-ds-space-6);
	}
	/* Entfernen-Icon-Button (CMS-Standard: 24×24-Quadrat, radius 4, Hover =
	   negative Tönung — wie .blk-btn--del im Brand-Editor). */
	.row-remove {
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
	.row-remove:hover {
		color: var(--ds-negative, var(--ds-text));
		background: rgb(from var(--ds-negative, var(--ds-text)) r g b / 0.1);
	}
	/* „+ …"-Buttons sind jetzt ui/Button dashed; nur die Ausrichtung bleibt hier. */
	.card-body :global(.app-button--dashed) {
		align-self: flex-start;
	}
	.row-remove:focus-visible,
	.save:focus-visible,
	.savebar-discard:focus-visible {
		outline: 2px solid var(--ds-focus-ring);
		outline-offset: 2px;
	}
	/* Schwebende Save-Bar bei offenen Änderungen (Muster aus dem Brand-Editor). */
	.savebar {
		position: fixed;
		left: 50%;
		bottom: 1.25rem;
		transform: translateX(-50%);
		z-index: 40;
		display: flex;
		align-items: center;
		gap: var(--z-ds-space-s);
		background: var(--ds-surface);
		border: 1px solid var(--ds-border);
		border-radius: 999px;
		padding: var(--z-ds-space-6) var(--z-ds-space-6) var(--z-ds-space-6) var(--z-ds-space-l);
		box-shadow: 0 8px 24px rgb(from var(--ds-text) r g b / 0.18);
		animation: savebar-in 0.2s var(--ds-ease-out, ease-out);
	}
	@keyframes savebar-in {
		from {
			opacity: 0;
			transform: translate(-50%, 8px);
		}
		to {
			opacity: 1;
			transform: translate(-50%, 0);
		}
	}
	@media (prefers-reduced-motion: reduce) {
		.savebar {
			animation: none;
		}
	}
	.savebar-info {
		font-size: var(--ds-text-sm);
		color: var(--ds-text-body);
		white-space: nowrap;
	}
	.savebar-discard {
		border: none;
		background: none;
		color: var(--ds-text-muted);
		font-size: var(--ds-text-sm);
		cursor: pointer;
		padding: var(--z-ds-space-6) var(--z-ds-space-s);
		border-radius: 999px;
		transition:
			background var(--ds-dur, 0.15s) var(--ds-ease-out, ease-out),
			color var(--ds-dur, 0.15s) var(--ds-ease-out, ease-out);
	}
	.savebar-discard:hover {
		background: rgb(from var(--ds-text) r g b / 0.08);
		color: var(--ds-text);
	}
	.save {
		background: var(--ds-accent);
		color: var(--ds-static-white);
		border: none;
		border-radius: 999px;
		padding: var(--z-ds-space-8) var(--z-ds-space-l);
		font-weight: 600;
		cursor: pointer;
		transition: opacity var(--ds-dur, 0.15s) var(--ds-ease-out, ease-out);
	}
	.save:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}
	.savebar kbd {
		font-family: var(--ds-font-mono);
		font-size: 0.72em;
		opacity: 0.75;
		margin-left: 0.3em;
		background: rgb(from var(--ds-static-white) r g b / 0.18);
		padding: 1px 5px;
		border-radius: 4px;
	}
</style>
