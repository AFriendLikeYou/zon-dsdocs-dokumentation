<script lang="ts">
	import { tick, untrack } from 'svelte';
	import { enhance } from '$app/forms';
	import type { SubmitFunction } from '@sveltejs/kit';
	import { getToastState } from '$stores/toast-state.svelte';
	import { Icon } from '$lib/icons/cms';
	import { Swatch } from '$components/ui/swatch';
	import { SegmentedControl } from '$components/ui/segmented-control';
	import { resolveCssVar } from '$lib/utils';
	import { AdminPageHeader, AdminBadge, AdminFlash } from '../../../ui';
	import ProvenanceChip from './ProvenanceChip.svelte';
	import MachineZone from './MachineZone.svelte';
	import StringListField from './StringListField.svelte';
	import CodeExamplesField from './CodeExamplesField.svelte';
	import LegendPopover from './LegendPopover.svelte';

	let { data }: import('./$types').PageProps = $props();
	const toast = getToastState();

	// ── Redaktioneller Editor-Zustand (nur die editierbaren Felder) ──────────────
	type A11yStatus = 'pass' | 'warn' | 'todo';
	type Editorial = {
		zweck: string;
		status: string;
		verwendung: { nutzen: string[]; nichtNutzen: string[] };
		doDont: { do: string[]; dont: string[] };
		komposition: string[];
		a11y: { label: string; wert: string; status: A11yStatus }[];
		wording: { schlecht: string; gut: string; hinweis: string }[];
		verwandt: string[];
		codeBeispiele: { label: string; sprache: string; code: string; hinweis: string }[];
		codeSvelte: string;
		repoCodeSvelte: string;
		codeNote: string;
		repoNote: string;
	};

	/** Die vier feldweisen Snippet-Override-Keys (leer = Maschine gewinnt). */
	type OverrideKey = 'codeSvelte' | 'repoCodeSvelte' | 'codeNote' | 'repoNote';

	const c = data.content as {
		zweck?: string;
		status?: string;
		verwendung?: { nutzen?: string[]; nichtNutzen?: string[] };
		doDont?: { do?: string[]; dont?: string[] };
		komposition?: string[];
		a11y?: { label?: string; wert?: string; status?: string }[];
		wording?: { schlecht?: string; gut?: string; hinweis?: string }[];
		verwandt?: string[];
		codeBeispiele?: { label?: string; sprache?: string; code?: string; hinweis?: string }[];
		codeSvelte?: string;
		repoCodeSvelte?: string;
		codeNote?: string;
		repoNote?: string;
	};

	// Fabrik → „Verwerfen"/Reset stellen exakt den Ausgangsstand wieder her.
	function makeState(): Editorial {
		return {
			zweck: c.zweck ?? '',
			status: c.status ?? 'ready_for_dev',
			verwendung: {
				nutzen: [...(c.verwendung?.nutzen ?? [])],
				nichtNutzen: [...(c.verwendung?.nichtNutzen ?? [])]
			},
			doDont: { do: [...(c.doDont?.do ?? [])], dont: [...(c.doDont?.dont ?? [])] },
			komposition: [...(c.komposition ?? [])],
			a11y: (c.a11y ?? []).map((r) => ({
				label: r.label ?? '',
				wert: r.wert ?? '',
				status: (r.status ?? 'warn') as A11yStatus
			})),
			wording: (c.wording ?? []).map((r) => ({
				schlecht: r.schlecht ?? '',
				gut: r.gut ?? '',
				hinweis: r.hinweis ?? ''
			})),
			verwandt: [...(c.verwandt ?? [])],
			codeBeispiele: (c.codeBeispiele ?? []).map((b) => ({
				label: b.label ?? '',
				sprache: b.sprache ?? 'svelte',
				code: b.code ?? '',
				hinweis: b.hinweis ?? ''
			})),
			codeSvelte: c.codeSvelte ?? '',
			repoCodeSvelte: c.repoCodeSvelte ?? '',
			codeNote: c.codeNote ?? '',
			repoNote: c.repoNote ?? ''
		};
	}
	let model = $state<Editorial>(makeState());

	// Status-Optionen für die SegmentedControl in den A11y-Zeilen (Schema-Tokens).
	const A11Y_STATUS_OPTIONS = [
		{ value: 'pass', label: 'pass' },
		{ value: 'warn', label: 'warn' },
		{ value: 'todo', label: 'todo' }
	];

	// ── Ghost-Karten: leere Redaktions-Abschnitte einladend statt als leeres Formular ──
	// Ein Abschnitt gilt als „aufgeklappt“, sobald er beim Laden Inhalt hatte ODER die
	// Ghost-Karte angeklickt wurde. So klappt er beim Leeren nicht mitten im Tippen zu.
	function initialExpanded(): Record<string, boolean> {
		return {
			zweck: !!c.zweck?.trim(),
			verwendung: !!(c.verwendung?.nutzen?.length || c.verwendung?.nichtNutzen?.length),
			doDont: !!(c.doDont?.do?.length || c.doDont?.dont?.length),
			komposition: !!c.komposition?.length,
			a11y: !!c.a11y?.length,
			wording: !!c.wording?.length,
			verwandt: !!c.verwandt?.length,
			codeBeispiele: !!c.codeBeispiele?.length,
			snippets: !!(c.codeSvelte || c.repoCodeSvelte || c.codeNote || c.repoNote)
		};
	}
	let expanded = $state<Record<string, boolean>>(initialExpanded());

	// Abschnitt aufklappen; leere Mehrfeld-Abschnitte bekommen die erste Zeile, dann
	// wandert der Fokus in die erste Ghost-Zeile / das erste Feld des Abschnitts.
	async function reveal(key: string) {
		expanded[key] = true;
		if (key === 'a11y' && model.a11y.length === 0)
			model.a11y.push({ label: '', wert: '', status: 'warn' });
		else if (key === 'wording' && model.wording.length === 0)
			model.wording.push({ schlecht: '', gut: '', hinweis: '' });
		else if (key === 'verwandt' && model.verwandt.length === 0) model.verwandt.push('');
		else if (key === 'codeBeispiele' && model.codeBeispiele.length === 0)
			model.codeBeispiele.push({ label: '', sprache: 'svelte', code: '', hinweis: '' });
		await tick();
		const sec = document.getElementById(`sec-${key}`);
		sec?.querySelector<HTMLElement>('.string-list__ghost, input, textarea, select')?.focus();
	}

	// State → content.json-Form. Leere Listen/Objekte weglassen (content.json bleibt
	// schlank, check-content sauber). Nur editierbare Keys — Rest bleibt serverseitig.
	const payload = $derived.by(() => {
		const out: Record<string, unknown> = { zweck: model.zweck.trim(), status: model.status };
		const nutzen = model.verwendung.nutzen.map((s) => s.trim()).filter(Boolean);
		const nichtNutzen = model.verwendung.nichtNutzen.map((s) => s.trim()).filter(Boolean);
		if (nutzen.length || nichtNutzen.length) out.verwendung = { nutzen, nichtNutzen };
		const doo = model.doDont.do.map((s) => s.trim()).filter(Boolean);
		const dont = model.doDont.dont.map((s) => s.trim()).filter(Boolean);
		if (doo.length || dont.length) out.doDont = { do: doo, dont };
		const komposition = model.komposition.map((s) => s.trim()).filter(Boolean);
		if (komposition.length) out.komposition = komposition;
		const a11y = model.a11y
			.filter((r) => r.label.trim() || r.wert.trim())
			.map((r) => ({ label: r.label.trim(), wert: r.wert.trim(), status: r.status }));
		if (a11y.length) out.a11y = a11y;
		const wording = model.wording
			.filter((r) => r.schlecht.trim() || r.gut.trim())
			.map((r) => {
				const o: Record<string, unknown> = { schlecht: r.schlecht.trim(), gut: r.gut.trim() };
				const h = r.hinweis.trim();
				if (h) o.hinweis = h;
				return o;
			});
		if (wording.length) out.wording = wording;
		const verwandt = [...new Set(model.verwandt.map((s) => s.trim()).filter(Boolean))];
		if (verwandt.length) out.verwandt = verwandt;
		// Code-Beispiele: nur Einträge mit Titel UND Code; Code am Ende getrimmt
		// (Zeilenstruktur bleibt). sprache immer mitschreiben, hinweis nur wenn gesetzt.
		const codeBeispiele = model.codeBeispiele
			.filter((b) => b.label.trim() && b.code.trim())
			.map((b) => {
				const o: Record<string, unknown> = {
					label: b.label.trim(),
					code: b.code.replace(/\s+$/, '')
				};
				if (b.sprache) o.sprache = b.sprache;
				const h = b.hinweis.trim();
				if (h) o.hinweis = h;
				return o;
			});
		if (codeBeispiele.length) out.codeBeispiele = codeBeispiele;
		// Snippet-Overrides: nur schreiben, wenn gefüllt — leer bedeutet „Maschine gewinnt"
		// (der Key fehlt dann in content.json, der Server löscht ihn beim Speichern).
		const codeSvelte = model.codeSvelte.replace(/\s+$/, '');
		if (codeSvelte.trim()) out.codeSvelte = codeSvelte;
		const repoCodeSvelte = model.repoCodeSvelte.replace(/\s+$/, '');
		if (repoCodeSvelte.trim()) out.repoCodeSvelte = repoCodeSvelte;
		const codeNote = model.codeNote.trim();
		if (codeNote) out.codeNote = codeNote;
		const repoNote = model.repoNote.trim();
		if (repoNote) out.repoNote = repoNote;
		return JSON.stringify(out);
	});

	// ── Maschinen-Zonen: Maße normalisieren ──────────────────────────────────────
	type Herkunft = 'gemessen' | 'abgeleitet' | 'geschätzt';
	type MasseRow = { label: string; px: string; token?: string; herkunft: Herkunft };
	const MASSE_LABELS: Record<string, string> = {
		hoehe: 'Höhe',
		breite: 'Breite',
		padding: 'Innenabstand',
		radius: 'Radius'
	};
	const masseRows = $derived.by<MasseRow[]>(() => {
		const m = data.machine.masse as Record<string, unknown> | null;
		if (!m) return [];
		const rows: MasseRow[] = [];
		for (const [key, label] of Object.entries(MASSE_LABELS)) {
			const v = m[key];
			if (v === undefined || v === null) continue;
			if (typeof v === 'string') {
				rows.push({ label, px: v, herkunft: 'gemessen' });
			} else if (typeof v === 'object') {
				const o = v as { px?: string; token?: string; herkunft?: Herkunft };
				rows.push({
					label,
					px: o.px ?? '',
					token: o.token,
					herkunft: o.herkunft ?? 'gemessen'
				});
			}
		}
		return rows;
	});

	type SpacingRow = { label: string; px: string; token?: string; herkunft: Herkunft };
	const spacingRows = $derived.by<SpacingRow[]>(() =>
		(data.machine.spacing as { label?: string; px?: string; token?: string; herkunft?: Herkunft }[]).map(
			(s) => ({
				label: s.label ?? '',
				px: s.px ?? '',
				token: s.token,
				herkunft: s.herkunft ?? 'gemessen'
			})
		)
	);

	// ── Maschinen-Zonen: Tokens live auflösen (wie TokenTable) ───────────────────
	type TokenItem = { name: string; hinweis?: string; swatch?: string; translucent?: boolean };
	type TokenGroup = { kategorie: string; items: TokenItem[] };
	const tokenGroups = data.machine.tokens as TokenGroup[];
	type ResolvedGroup = {
		kategorie: string;
		items: (TokenItem & { wert: string })[];
	};
	let resolvedTokens = $state<ResolvedGroup[]>([]);
	$effect(() => {
		resolvedTokens = tokenGroups.map((g) => ({
			kategorie: g.kategorie,
			items: (g.items ?? []).map((t) => ({ ...t, wert: resolveCssVar(t.name) }))
		}));
	});
	const tokenView = $derived<ResolvedGroup[]>(
		resolvedTokens.length
			? resolvedTokens
			: tokenGroups.map((g) => ({
					kategorie: g.kategorie,
					items: (g.items ?? []).map((t) => ({ ...t, wert: '' }))
				}))
	);

	type VariantGroup = { prop: string; werte: { label: string; default?: boolean }[] };
	const varianten = data.machine.varianten as VariantGroup[];
	const zustaende = data.machine.zustaende as { label: string; vorhanden?: boolean }[];

	// v1-read-only Editorial-Felder als JSON-Hinweis („im Code pflegen").
	const readonlyEditorialShown = $derived.by(() => {
		const r = data.readonlyEditorial;
		return (
			[
				['variantInfo', r.variantInfo],
				['callouts', r.callouts],
				['tastatur', r.tastatur],
				['doDontBeispiele', r.doDontBeispiele]
			] as const
		).filter(([, v]) => v != null);
	});

	// ── Dirty-Tracking + Save-Bar (Muster aus dem Brand-/[slug]-Editor) ──────────
	let formEl = $state<HTMLFormElement | null>(null);
	let savedPayload = $state(untrack(() => payload));
	const dirty = $derived(payload !== savedPayload);

	function discard() {
		model = makeState();
		expanded = initialExpanded();
	}

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

<svelte:head><title>{data.name} — Spec-Editor</title></svelte:head>
<svelte:window onkeydown={onGlobalKeydown} onbeforeunload={onBeforeUnload} />

{#snippet herkunftBadge(h: Herkunft)}
	{#if h === 'abgeleitet'}
		<span class="herkunft herkunft--abgeleitet">abgeleitet</span>
	{:else if h === 'geschätzt'}
		<span class="herkunft herkunft--geschaetzt">≈ geschätzt</span>
	{/if}
{/snippet}

{#snippet ghostCard(key: string, label: string)}
	<button type="button" class="ghost-card" onclick={() => reveal(key)}>
		<span class="ghost-card__plus" aria-hidden="true">+</span>
		<span class="ghost-card__label">{label} ergänzen</span>
	</button>
{/snippet}

{#snippet ghostToggle(key: string, text: string)}
	<button type="button" class="ghost-card" onclick={() => reveal(key)}>
		<span class="ghost-card__plus" aria-hidden="true">+</span>
		<span class="ghost-card__label">{text}</span>
	</button>
{/snippet}

{#snippet overrideField(key: OverrideKey, label: string, machine: string, multiline: boolean)}
	<div class="override">
		<label class="override__label" for="ov-{key}">{label}</label>
		{#if multiline}
			<textarea
				id="ov-{key}"
				class="override__input override__input--mono"
				rows="4"
				spellcheck="false"
				bind:value={model[key]}
				placeholder={machine || '(kein Maschinen-Wert)'}
			></textarea>
		{:else}
			<input
				id="ov-{key}"
				class="override__input"
				bind:value={model[key]}
				placeholder={machine || '(kein Maschinen-Wert)'}
			/>
		{/if}
		<span class="override__note">
			{model[key].trim() ? 'Überschreibt den Maschinen-Wert' : 'leer → Maschine gewinnt'}
		</span>
	</div>
{/snippet}

<div class="spec-edit">
	<!-- 1 · Kopfzeile -->
	<AdminPageHeader
		title={data.name}
		crumb={{ href: '/admin', label: 'Alle Komponenten' }}
	>
		{#snippet actions()}
			<LegendPopover />
		{/snippet}
		<span class="head-meta">
			{#if data.status}<AdminBadge tone="default">{data.status}</AdminBadge>{/if}
			<span class="head-sync">
				Sync: Figma-Node <code>{data.nodeId ?? '—'}</code>
				{#if data.aktualisiertAm}· Stand {data.aktualisiertAm}{/if}
			</span>
			<a class="head-link" href={data.viewHref} title="Öffentliche Doku-Seite">Doku-Seite ansehen ↗</a>
			{#if data.figmaUrl}<a class="head-link" href={data.figmaUrl} target="_blank" rel="noreferrer">Figma ↗</a>{/if}
		</span>
	</AdminPageHeader>

	{#if !data.writable}
		<AdminFlash tone="warn">
			Nur-Lese-Vorschau: Schreiben ist im Prod-Modus deaktiviert (Prod öffnet später einen GitHub-PR).
		</AdminFlash>
	{/if}

	<!-- 2 · Drift-Banner (nur wenn figma-raw.json neuer als model.json) -->
	{#if data.figmaRawNeuerAlsModel}
		<div class="drift" role="status">
			<div class="drift__body">
				<strong class="drift__title">Design hat sich seit dem letzten Import geändert</strong>
				<p class="drift__text">
					Die Figma-Roh-Daten (<code>figma-raw.json</code>) sind neuer als das
					<code>model.json</code>. Maße, Tokens und Varianten unten könnten veraltet sein. Der
					Re-Import ist bewusst ein manueller CLI-Schritt — die Doku rät nie.
				</p>
			</div>
			<a class="drift__cta" href={data.importGuideHref} target="_blank" rel="noreferrer"
				>Zur Anleitung ↗</a
			>
		</div>
	{/if}

	<!-- 3 · Maschinen-Zonen (read-only, aus Figma) -->
	{#if masseRows.length || spacingRows.length}
		<MachineZone
			title="Maße & Spacing"
			hint="Werte aus dem Figma-Import. Änderung: in Figma anpassen, dann Re-Import."
		>
			{#if masseRows.length}
				<table class="mz-table">
					<tbody>
						{#each masseRows as r (r.label)}
							<tr>
								<td class="mz-table__label">{r.label}</td>
								<td class="mz-table__value">{r.px}</td>
								<td class="mz-table__token">{#if r.token}<code>{r.token}</code>{/if}</td>
								<td class="mz-table__herkunft">{@render herkunftBadge(r.herkunft)}</td>
							</tr>
						{/each}
					</tbody>
				</table>
			{/if}
			{#if spacingRows.length}
				<div class="mz-subhead">Abstände</div>
				<table class="mz-table">
					<tbody>
						{#each spacingRows as r, i (i)}
							<tr>
								<td class="mz-table__label">{r.label}</td>
								<td class="mz-table__value">{r.px}</td>
								<td class="mz-table__token">{#if r.token}<code>{r.token}</code>{/if}</td>
								<td class="mz-table__herkunft">{@render herkunftBadge(r.herkunft)}</td>
							</tr>
						{/each}
					</tbody>
				</table>
			{/if}
		</MachineZone>
	{/if}

	{#if tokenView.length}
		<MachineZone title="Tokens" hint="Werte live aus dem aktiven Theme aufgelöst — nicht gespeichert.">
			{#each tokenView as group (group.kategorie)}
				<div class="mz-subhead">{group.kategorie}</div>
				<table class="mz-table mz-table--tokens">
					<tbody>
						{#each group.items as t (t.name)}
							<tr>
								<td class="mz-table__swatch">
									{#if t.translucent}
										<Swatch checkerboard />
									{:else if t.swatch}
										<Swatch color={t.wert || t.swatch} />
									{/if}
								</td>
								<td class="mz-table__token"><code>{t.name}</code></td>
								<td class="mz-table__value mz-table__value--mono">{t.wert || '…'}</td>
								<td class="mz-table__hinweis">{t.hinweis ?? ''}</td>
							</tr>
						{/each}
					</tbody>
				</table>
			{/each}
		</MachineZone>
	{/if}

	{#if varianten.length || zustaende.length}
		<MachineZone title="Varianten & Zustände">
			{#if varianten.length}
				<div class="mz-chips">
					{#each varianten as axis (axis.prop)}
						<div class="mz-chips__row">
							<span class="mz-chips__label">{axis.prop}</span>
							{#each axis.werte as w (w.label)}
								<span class="mz-chip">{w.label}{#if w.default} ·default{/if}</span>
							{/each}
						</div>
					{/each}
				</div>
			{/if}
			{#if zustaende.length}
				<div class="mz-chips mz-chips--states">
					<span class="mz-chips__label">Zustände</span>
					{#each zustaende as z (z.label)}
						<span class="mz-chip" class:mz-chip--off={!z.vorhanden}>
							{z.vorhanden ? '✓' : '–'} {z.label}
						</span>
					{/each}
				</div>
			{/if}
		</MachineZone>
	{/if}

	<!-- 4 · Redaktions-Felder (editierbar) -->
	<div class="editorial-head">
		<h2 class="editorial-head__title">Redaktion</h2>
		<ProvenanceChip variant="editorial" />
	</div>

	<form method="POST" bind:this={formEl} use:enhance={handleSubmit}>
		<input type="hidden" name="payload" value={payload} />

		<!-- Zweck -->
		{#if expanded.zweck}
			<section class="card" id="sec-zweck">
				<div class="card-head"><span class="card-title">Zweck</span></div>
				<div class="card-body"><textarea bind:value={model.zweck} rows="3"></textarea></div>
			</section>
		{:else}
			{@render ghostCard('zweck', 'Zweck')}
		{/if}

		<!-- Status (immer sichtbar — trägt stets einen Wert) -->
		<section class="card">
			<div class="card-head"><span class="card-title">Status</span></div>
			<div class="card-body">
				<select class="field--short" bind:value={model.status}>
					<option value="ready_for_dev">ready_for_dev</option>
					<option value="completed">completed</option>
					<option value="changed">changed</option>
				</select>
			</div>
		</section>

		<!-- Verwendung -->
		{#if expanded.verwendung}
			<section class="card" id="sec-verwendung">
				<div class="card-head"><span class="card-title">Verwendung</span></div>
				<div class="card-body">
					<div class="sublist">
						<span class="sublist__label">Wann nutzen</span>
						<StringListField list={model.verwendung.nutzen} />
					</div>
					<div class="sublist">
						<span class="sublist__label">Wann nicht</span>
						<StringListField list={model.verwendung.nichtNutzen} />
					</div>
				</div>
			</section>
		{:else}
			{@render ghostCard('verwendung', 'Verwendung')}
		{/if}

		<!-- Do & Don't -->
		{#if expanded.doDont}
			<section class="card" id="sec-doDont">
				<div class="card-head"><span class="card-title">Do &amp; Don't</span></div>
				<div class="card-body">
					<div class="sublist">
						<span class="sublist__label">Do</span>
						<StringListField list={model.doDont.do} />
					</div>
					<div class="sublist">
						<span class="sublist__label">Don't</span>
						<StringListField list={model.doDont.dont} />
					</div>
				</div>
			</section>
		{:else}
			{@render ghostCard('doDont', "Do & Don't")}
		{/if}

		<!-- Komposition -->
		{#if expanded.komposition}
			<section class="card" id="sec-komposition">
				<div class="card-head">
					<span class="card-title">Komposition (Hinweise für Agenten &amp; Devs)</span>
				</div>
				<div class="card-body">
					<StringListField
						list={model.komposition}
						addLabel="+ Hinweis ergänzen"
						placeholder="z. B. In Formularen mit Input und Label kombinieren."
					/>
				</div>
			</section>
		{:else}
			{@render ghostCard('komposition', 'Komposition')}
		{/if}

		<!-- Barrierefreiheit -->
		{#if expanded.a11y}
			<section class="card" id="sec-a11y">
				<div class="card-head">
					<span class="card-title">Barrierefreiheit (Label · Wert · Status)</span>
				</div>
				<div class="card-body">
					{#each model.a11y as _, i (i)}
						<div class="row">
							<span class="row__dot row__dot--{model.a11y[i].status}" aria-hidden="true"></span>
							<input
								class="row__input row__input--key"
								bind:value={model.a11y[i].label}
								placeholder="Label"
							/>
							<input class="row__input" bind:value={model.a11y[i].wert} placeholder="Wert" />
							<SegmentedControl
								ariaLabel="Status"
								options={A11Y_STATUS_OPTIONS}
								value={model.a11y[i].status}
								onchange={(v) => (model.a11y[i].status = v as A11yStatus)}
							/>
							<button
								type="button"
								class="row__remove"
								onclick={() => model.a11y.splice(i, 1)}
								aria-label="Entfernen"><Icon name="close" /></button
							>
						</div>
					{/each}
					<button
						type="button"
						class="row-add"
						onclick={() => model.a11y.push({ label: '', wert: '', status: 'warn' })}>+ Eintrag</button
					>
				</div>
			</section>
		{:else}
			{@render ghostCard('a11y', 'Barrierefreiheit')}
		{/if}

		<!-- Wording -->
		{#if expanded.wording}
			<section class="card" id="sec-wording">
				<div class="card-head"><span class="card-title">Wording (Schlecht → Gut · Hinweis)</span></div>
				<div class="card-body">
					{#each model.wording as _, i (i)}
						<div class="row">
							<input
								class="row__input"
								bind:value={model.wording[i].schlecht}
								placeholder="Schlecht"
							/>
							<span class="row__arrow" aria-hidden="true">→</span>
							<input class="row__input" bind:value={model.wording[i].gut} placeholder="Gut" />
							<input
								class="row__input row__input--hint"
								bind:value={model.wording[i].hinweis}
								placeholder="Hinweis (optional)"
							/>
							<button
								type="button"
								class="row__remove"
								onclick={() => model.wording.splice(i, 1)}
								aria-label="Entfernen"><Icon name="close" /></button
							>
						</div>
					{/each}
					<button
						type="button"
						class="row-add"
						onclick={() => model.wording.push({ schlecht: '', gut: '', hinweis: '' })}>+ Regel</button
					>
				</div>
			</section>
		{:else}
			{@render ghostCard('wording', 'Wording-Regeln')}
		{/if}

		<!-- Verwandte Komponenten -->
		{#if expanded.verwandt}
			<section class="card" id="sec-verwandt">
				<div class="card-head">
					<span class="card-title">Verwandte Komponenten (Katalog-Slugs)</span>
				</div>
				<div class="card-body">
					{#each model.verwandt as _, i (i)}
						{@const gueltig = data.validSlugs.includes(model.verwandt[i])}
						<div class="row">
							<select
								class="row__input"
								bind:value={model.verwandt[i]}
								class:field-row__invalid={!gueltig}
							>
								<option value="" disabled>– Komponente wählen –</option>
								{#each data.slugs as s (s)}
									<option value={s}>{s}</option>
								{/each}
							</select>
							{#if model.verwandt[i] && !gueltig}
								<span class="field-warn" title="Kein bekannter Katalog-Slug">unbekannt</span>
							{/if}
							<button
								type="button"
								class="row__remove"
								onclick={() => model.verwandt.splice(i, 1)}
								aria-label="Entfernen"><Icon name="close" /></button
							>
						</div>
					{/each}
					<button type="button" class="row-add" onclick={() => model.verwandt.push('')}>+ Slug</button>
				</div>
			</section>
		{:else}
			{@render ghostCard('verwandt', 'Verwandte Komponenten')}
		{/if}

		<!-- Code-Beispiele (Develop-Tab) -->
		{#if expanded.codeBeispiele}
			<section class="card" id="sec-codeBeispiele">
				<div class="card-head"><span class="card-title">Code-Beispiele (Develop-Tab)</span></div>
				<div class="card-body">
					<p class="hint">
						Redaktionelle Snippets fürs zeit.de-Repo — erscheinen im Develop-Tab unter den
						maschinellen Code-Sektionen. Reiner Text, nie ausgeführt.
					</p>
					<CodeExamplesField list={model.codeBeispiele} />
				</div>
			</section>
		{:else}
			{@render ghostCard('codeBeispiele', 'Code-Beispiel')}
		{/if}

		<!-- Snippets überschreiben: feldweise Overrides über die Maschinen-Werte -->
		{#if expanded.snippets}
			<section class="card" id="sec-snippets">
				<div class="card-head"><span class="card-title">Snippets überschreiben</span></div>
				<div class="card-body">
					<p class="hint">
						Überschreibt die maschinellen Code-Snippets feldweise. Leer lassen = der
						Maschinen-Wert (aus Figma/<code>render</code>) gewinnt; er steht als Platzhalter.
					</p>
					{@render overrideField('codeSvelte', 'Svelte-Code', data.machineSnippets.codeSvelte, true)}
					{@render overrideField(
						'repoCodeSvelte',
						'Repo-Komponente (Svelte)',
						data.machineSnippets.repoCodeSvelte,
						true
					)}
					{@render overrideField('repoNote', 'Repo-Hinweis', data.machineSnippets.repoNote, true)}
					{@render overrideField(
						'codeNote',
						'HTML-Kommentar (Code-Note)',
						data.machineSnippets.codeNote,
						false
					)}
				</div>
			</section>
		{:else}
			{@render ghostToggle('snippets', 'Snippets überschreiben')}
		{/if}

		<!-- v1-read-only Editorial-Felder: nur Hinweis, Pflege im Code -->
		{#if readonlyEditorialShown.length}
			<section class="card card--readonly">
				<div class="card-head">
					<span class="card-title">Weitere Felder</span>
					<ProvenanceChip
						variant="machine"
						title="In v1 nur im Code (content.json) pflegen — kein Formular"
					/>
				</div>
				<div class="card-body">
					<p class="hint">
						Diese Felder bleiben in v1 ohne Formular — bei einem Speichern unverändert erhalten. Pflege
						direkt in <code>content.json</code>.
					</p>
					{#each readonlyEditorialShown as [key, value] (key)}
						<details class="ro-json">
							<summary>{key}</summary>
							<pre>{JSON.stringify(value, null, 2)}</pre>
						</details>
					{/each}
				</div>
			</section>
		{/if}

		{#if dirty}
			<div class="savebar" role="status">
				<span class="savebar-info">Ungespeicherte Änderungen</span>
				<button type="button" class="savebar-discard" onclick={discard}>Verwerfen</button>
				<button type="submit" class="save" disabled={!data.writable}>Speichern <kbd>⌘S</kbd></button>
			</div>
		{/if}
	</form>
</div>

<style>
	.spec-edit {
		max-width: 52rem;
		margin: 0 auto;
		padding: var(--z-ds-space-xl) var(--z-ds-space-l) 7rem;
	}

	/* ── Kopfzeile-Meta ── */
	.head-meta {
		display: inline-flex;
		align-items: center;
		flex-wrap: wrap;
		gap: var(--z-ds-space-m);
	}
	.head-sync {
		font-size: var(--ds-text-sm);
		color: var(--ds-text-muted);
	}
	.head-sync code {
		font-family: var(--ds-font-mono);
	}
	.head-link {
		font-size: var(--ds-text-sm);
		color: var(--ds-accent);
		text-decoration: none;
	}
	.head-link:hover {
		text-decoration: underline;
	}
	.head-link:focus-visible {
		outline: 2px solid var(--ds-focus-ring);
		outline-offset: 2px;
	}

	/* ── Drift-Banner ── */
	.drift {
		display: flex;
		align-items: flex-start;
		gap: var(--z-ds-space-m);
		background: rgb(from var(--ds-warning) r g b / 0.15);
		border: 1px solid rgb(from var(--ds-warning) r g b / 0.4);
		border-radius: var(--ds-radius, 8px);
		padding: var(--z-ds-space-m);
		margin-bottom: var(--z-ds-space-l);
	}
	.drift__title {
		display: block;
		font-size: var(--ds-text-base);
		color: var(--ds-text);
	}
	.drift__text {
		margin: var(--z-ds-space-6) 0 0;
		font-size: var(--ds-text-sm);
		color: var(--ds-text-body);
		max-width: 44rem;
	}
	.drift__text code {
		font-family: var(--ds-font-mono);
		font-size: 0.9em;
	}
	.drift__cta {
		flex: none;
		align-self: center;
		font-size: var(--ds-text-sm);
		font-weight: 600;
		color: var(--ds-text);
		text-decoration: none;
		border: 1px solid var(--ds-border);
		border-radius: 999px;
		padding: var(--z-ds-space-6) var(--z-ds-space-m);
		background: var(--ds-surface);
		white-space: nowrap;
		transition: border-color var(--ds-dur, 0.15s) var(--ds-ease-out, ease-out);
	}
	.drift__cta:hover {
		border-color: var(--ds-accent);
	}
	.drift__cta:focus-visible {
		outline: 2px solid var(--ds-focus-ring);
		outline-offset: 2px;
	}

	/* ── Maschinen-Tabellen ── */
	.mz-table {
		width: 100%;
		border-collapse: collapse;
	}
	.mz-table td {
		padding: var(--z-ds-space-6) var(--z-ds-space-8) var(--z-ds-space-6) 0;
		border-bottom: 1px solid var(--ds-border);
		vertical-align: middle;
		font-size: var(--ds-text-sm);
		color: var(--ds-text-body);
	}
	.mz-table__label {
		color: var(--ds-text);
		white-space: nowrap;
	}
	.mz-table__value--mono,
	.mz-table__token code {
		font-family: var(--ds-font-mono);
		font-size: var(--ds-text-xs);
	}
	.mz-table__token code {
		color: var(--ds-text-muted);
	}
	.mz-table__herkunft {
		text-align: right;
		white-space: nowrap;
	}
	.mz-table__swatch {
		width: 24px;
	}
	.mz-table__hinweis {
		color: var(--ds-text-muted);
	}
	.mz-subhead {
		margin: var(--z-ds-space-m) 0 var(--z-ds-space-6);
		font-size: var(--ds-text-xs);
		text-transform: uppercase;
		letter-spacing: 0.06em;
		color: var(--ds-text-muted);
		font-weight: 600;
	}

	/* ── Herkunft-Badges ── */
	.herkunft {
		display: inline-flex;
		align-items: center;
		font-size: var(--ds-text-xs);
		border-radius: 999px;
		padding: 1px var(--z-ds-space-8);
		border: 1px solid var(--ds-border-soft);
		color: var(--ds-text-muted);
		background: var(--ds-surface-raised, var(--ds-surface));
	}
	.herkunft--abgeleitet {
		color: var(--ds-text-body);
	}
	.herkunft--geschaetzt {
		color: var(--ds-warning-text, var(--ds-text));
		border-color: rgb(from var(--ds-warning) r g b / 0.5);
		background: rgb(from var(--ds-warning) r g b / 0.15);
	}

	/* ── Varianten/Zustände-Chips ── */
	.mz-chips {
		display: flex;
		flex-direction: column;
		gap: var(--z-ds-space-8);
	}
	.mz-chips--states {
		flex-direction: row;
		flex-wrap: wrap;
		align-items: center;
		margin-top: var(--z-ds-space-m);
	}
	.mz-chips__row {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: var(--z-ds-space-8);
	}
	.mz-chips__label {
		font-size: var(--ds-text-xs);
		text-transform: uppercase;
		letter-spacing: 0.06em;
		color: var(--ds-text-muted);
		font-weight: 600;
		margin-right: var(--z-ds-space-6);
	}
	.mz-chip {
		display: inline-flex;
		align-items: center;
		font-size: var(--ds-text-xs);
		border: 1px solid var(--ds-border-soft);
		border-radius: var(--ds-radius-sm);
		padding: 1px var(--z-ds-space-8);
		color: var(--ds-text-body);
		background: var(--ds-surface-raised, var(--ds-surface));
	}
	.mz-chip--off {
		color: var(--ds-text-muted);
		opacity: 0.7;
	}

	/* ── Redaktions-Kopf ── */
	.editorial-head {
		display: flex;
		align-items: center;
		gap: var(--z-ds-space-s);
		margin: var(--z-ds-space-xl) 0 var(--z-ds-space-m);
	}
	.editorial-head__title {
		margin: 0;
		font-size: var(--ds-text-lg, var(--ds-text-base));
	}

	/* ── Editor-Karten (wie Brand-/[slug]-Editor) ── */
	.card {
		background: var(--ds-surface-raised, var(--ds-surface));
		border-radius: var(--ds-radius, 8px);
		padding: 12px;
		margin-bottom: var(--z-ds-space-m);
	}
	.card--readonly {
		background: var(--ds-surface-sunken, var(--ds-surface));
		border: 1px dashed var(--ds-border);
	}
	.card-head {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: var(--z-ds-space-s);
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
	.hint code {
		font-family: var(--ds-font-mono);
	}
	textarea,
	select,
	input {
		width: 100%;
		font: inherit;
		font-size: var(--ds-text-sm);
		color: var(--ds-text);
		background: var(--ds-surface);
		border: 1px solid var(--ds-border);
		border-radius: var(--ds-radius-sm);
		padding: var(--z-ds-space-6) var(--z-ds-space-8);
	}
	textarea {
		resize: vertical;
	}
	textarea:focus-visible,
	select:focus-visible,
	input:focus-visible {
		outline: 2px solid var(--ds-focus-ring);
		outline-offset: 1px;
	}
	/* Kurzes Feld (Status) nicht über die volle Breite ziehen. */
	.field--short {
		max-width: 16rem;
	}

	/* ── Snippet-Override-Felder ── */
	.override {
		display: flex;
		flex-direction: column;
		gap: var(--z-ds-space-6);
	}
	.override + .override {
		margin-top: var(--z-ds-space-s);
		padding-top: var(--z-ds-space-s);
		border-top: 1px solid var(--ds-border-soft);
	}
	.override__label {
		font-size: var(--ds-text-xs);
		color: var(--ds-text-muted);
		font-weight: 600;
	}
	.override__input--mono {
		font-family: var(--ds-font-mono);
		font-size: var(--ds-text-xs);
		line-height: 1.6;
		white-space: pre;
		resize: vertical;
	}
	.override__note {
		font-size: var(--ds-text-xs);
		color: var(--ds-text-faint);
	}

	/* ── Gruppierte Unterlisten (Verwendung, Do & Don't) ── */
	.sublist {
		display: flex;
		flex-direction: column;
		gap: var(--z-ds-space-6);
	}
	.sublist + .sublist {
		margin-top: var(--z-ds-space-s);
	}
	.sublist__label {
		font-size: var(--ds-text-xs);
		color: var(--ds-text-muted);
		font-weight: 600;
	}

	/* ── Dichte Zeilen (A11y, Wording, Verwandt) ── */
	.row {
		display: flex;
		align-items: center;
		gap: var(--z-ds-space-6);
		border-bottom: 1px solid var(--ds-border-soft);
	}
	.row__input {
		flex: 1;
		min-width: 0;
		background: transparent;
		border: none;
		padding: var(--z-ds-space-6) var(--z-ds-space-6);
	}
	.row__input:focus-visible {
		outline: 2px solid var(--ds-focus-ring);
		outline-offset: -2px;
	}
	.row__input--key {
		flex: 0 1 11rem;
	}
	.row__input--hint {
		flex: 0 1 12rem;
		color: var(--ds-text-muted);
	}
	.row__dot {
		flex: none;
		width: 9px;
		height: 9px;
		border-radius: 50%;
		background: var(--ds-text-faint);
	}
	.row__dot--pass {
		background: var(--ds-positive);
	}
	.row__dot--warn {
		background: var(--ds-warning);
	}
	.row__dot--todo {
		background: var(--ds-text-faint);
	}
	.row__arrow {
		flex: none;
		color: var(--ds-text-faint);
		font-size: var(--ds-text-sm);
	}
	.row__remove {
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
	.row:hover .row__remove,
	.row:focus-within .row__remove {
		opacity: 1;
	}
	.row__remove:hover {
		color: var(--ds-negative, var(--ds-text));
		background: rgb(from var(--ds-negative, var(--ds-text)) r g b / 0.1);
	}
	.row__remove:focus-visible {
		opacity: 1;
	}
	@media (hover: none) {
		.row__remove {
			opacity: 1;
		}
	}
	@media (prefers-reduced-motion: reduce) {
		.row__remove {
			transition: none;
		}
	}
	.field-row__invalid {
		border-color: var(--ds-warning, var(--ds-border));
	}
	.field-warn {
		flex: none;
		font-size: var(--ds-text-xs);
		color: var(--ds-warning-text, var(--ds-text-muted));
	}

	/* ── Ghost-Karte: leerer Abschnitt als Einladung ── */
	.ghost-card {
		display: flex;
		align-items: center;
		gap: var(--z-ds-space-8);
		width: 100%;
		text-align: left;
		background: none;
		border: 1px dashed var(--ds-border);
		border-radius: var(--ds-radius, 8px);
		padding: var(--z-ds-space-m);
		margin-bottom: var(--z-ds-space-m);
		color: var(--ds-text-muted);
		cursor: pointer;
		transition:
			border-color var(--ds-dur, 0.15s) var(--ds-ease-out, ease-out),
			color var(--ds-dur, 0.15s) var(--ds-ease-out, ease-out),
			background var(--ds-dur, 0.15s) var(--ds-ease-out, ease-out);
	}
	.ghost-card:hover {
		border-color: var(--ds-accent);
		color: var(--ds-text-body);
		background: rgb(from var(--ds-accent) r g b / 0.04);
	}
	.ghost-card:active {
		background: rgb(from var(--ds-accent) r g b / 0.08);
	}
	.ghost-card:focus-visible {
		outline: 2px solid var(--ds-focus-ring);
		outline-offset: 2px;
	}
	.ghost-card__plus {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		width: 1.25rem;
		height: 1.25rem;
		flex: none;
		border-radius: 999px;
		border: 1px solid var(--ds-border);
		font-size: var(--ds-text-sm);
		line-height: 1;
	}
	.ghost-card__label {
		font-size: var(--ds-text-sm);
	}
	@media (prefers-reduced-motion: reduce) {
		.ghost-card {
			transition: none;
		}
	}
	.ro-json {
		font-size: var(--ds-text-sm);
	}
	.ro-json summary {
		cursor: pointer;
		color: var(--ds-text-body);
		font-family: var(--ds-font-mono);
		font-size: var(--ds-text-xs);
	}
	.ro-json pre {
		margin: var(--z-ds-space-6) 0 0;
		padding: var(--z-ds-space-8);
		background: var(--ds-surface);
		border-radius: var(--ds-radius-sm);
		overflow-x: auto;
		font-family: var(--ds-font-mono);
		font-size: var(--ds-text-xs);
		color: var(--ds-text-body);
	}
	.row-add {
		align-self: flex-start;
		background: none;
		border: 1px dashed var(--ds-border);
		border-radius: var(--ds-radius-sm);
		padding: var(--z-ds-space-6) var(--z-ds-space-m);
		color: var(--ds-text-body);
		cursor: pointer;
		font-size: var(--ds-text-sm);
		transition: border-color var(--ds-dur, 0.15s) var(--ds-ease-out, ease-out);
	}
	.row-add:hover {
		border-color: var(--ds-accent);
	}
	.row-add:focus-visible,
	.save:focus-visible,
	.savebar-discard:focus-visible {
		outline: 2px solid var(--ds-focus-ring);
		outline-offset: 2px;
	}

	/* ── Save-Bar (Muster aus dem Brand-Editor) ── */
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
		width: auto;
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
