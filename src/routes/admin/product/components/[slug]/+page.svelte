<script lang="ts">
	import { tick, untrack } from 'svelte';
	import { enhance } from '$app/forms';
	import type { SubmitFunction } from '@sveltejs/kit';
	import { getToastState } from '$stores/toast-state.svelte';
	import { Icon } from '$lib/icons/cms';
	import { ImportIcon, PencilIcon, AlertTriangleIcon } from '$lib/icons';
	import { Swatch } from '$components/ui/swatch';
	import { resolveCssVar } from '$lib/utils';
	import { AdminFlash, Pill } from '../../../ui';
	import ProvenanceChip from './ProvenanceChip.svelte';
	import MachineZone from './MachineZone.svelte';
	import StringListField from './StringListField.svelte';
	import CodeExamplesField from './CodeExamplesField.svelte';
	import LegendPopover from './LegendPopover.svelte';

	let { data }: import('./$types').PageProps = $props();
	const toast = getToastState();

	// ── Re-Import ist bewusst ein CLI-Schritt: der Button kopiert nur den fertigen
	// Befehl (Muster wie CopyButton → Toast-Feedback), er führt nichts aus. ────────
	const reImportCommand = $derived(
		data.figmaUrl
			? `node tooling/zeit-de-exporter/import.mjs '${data.figmaUrl}' ${data.slug}`
			: ''
	);
	async function copyReImport() {
		if (!reImportCommand) {
			toast?.add('Kein Re-Import möglich', 'Im model.json ist keine Figma-URL hinterlegt.');
			return;
		}
		try {
			await navigator.clipboard?.writeText(reImportCommand);
			toast?.add('Befehl kopiert', 'Re-Import-Befehl in der Zwischenablage — im Terminal ausführen.');
		} catch {
			toast?.add('Nicht kopiert', 'Zwischenablage nicht verfügbar.');
		}
	}

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
		/** Redaktioneller Hinweis-Text je Token (Token-Name → Freitext). */
		tokenHinweise: Record<string, string>;
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
		tokenHinweise?: Record<string, string>;
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
			// Alle Token-Namen mit '' vorbelegen (stabile bind:value-Ziele), dann die
			// vorhandenen Redaktions-Overrides darüberlegen. Leere Keys fallen im
			// payload wieder raus → Maschinen-hinweis gewinnt (delete-when-absent).
			tokenHinweise: (() => {
				const seed: Record<string, string> = {};
				for (const g of (data.machine.tokens as { items?: { name: string }[] }[]) ?? [])
					for (const t of g.items ?? []) seed[t.name] = '';
				return { ...seed, ...(c.tokenHinweise ?? {}) };
			})(),
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
			verwendung: !!(c.verwendung?.nutzen?.length || c.verwendung?.nichtNutzen?.length),
			doDont: !!(c.doDont?.do?.length || c.doDont?.dont?.length),
			komposition: !!c.komposition?.length,
			a11y: !!c.a11y?.length,
			wording: !!c.wording?.length,
			verwandt: !!c.verwandt?.length,
			tokenHinweise: !!(c.tokenHinweise && Object.keys(c.tokenHinweise).length),
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
		// Token-Hinweise: nur nicht-leere Einträge; leere → Key raus → Maschinen-hinweis
		// gewinnt wieder (delete-when-absent im EDITABLE-Muster).
		const tokenHinweise: Record<string, string> = {};
		for (const [name, txt] of Object.entries(model.tokenHinweise)) {
			const t = (txt ?? '').trim();
			if (t) tokenHinweise[name] = t;
		}
		if (Object.keys(tokenHinweise).length) out.tokenHinweise = tokenHinweise;
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

	/** Maß-Wert fürs Auge: „10 · 16" → „10 / 16", nackte Zahlen bekommen „ px" (Mockup-Duktus). */
	const anzeigeWert = (px: string): string => {
		const s = px.replace(/\s*·\s*/g, ' / ').trim();
		return /[a-z%]/i.test(s) ? s : `${s} px`;
	};

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

	// ── Summary-Zeilen der eingeklappten Maschinen-Riesen (V2) ───────────────────
	const tokenCount = $derived(tokenView.reduce((n, g) => n + g.items.length, 0));
	const tokenSummary = $derived(
		`${tokenCount} ${tokenCount === 1 ? 'Token' : 'Tokens'} · ${tokenView.map((g) => g.kategorie).join(' / ')}`
	);
	const variantSummary = $derived.by(() => {
		const parts: string[] = [];
		if (varianten.length) parts.push(`${varianten.length} ${varianten.length === 1 ? 'Achse' : 'Achsen'}`);
		if (zustaende.length)
			parts.push(`${zustaende.length} ${zustaende.length === 1 ? 'Zustand' : 'Zustände'}`);
		return parts.join(' · ');
	});

	// ── Flache Token-Liste (alle Gruppen) für die „Hinweis je Token"-Redaktionskarte:
	// je Token der Maschinen-hinweis als gedämpfter Platzhalter, Override als Wert. ──
	type FlatToken = { name: string; machineHinweis: string };
	// tokenGroups ist stabil (aus data) → plain const; kein $derived nötig. Token-Namen
	// können über Gruppen hinweg mehrfach vorkommen (z. B. --z-ds-color-text-100 als
	// Label und als Fläche) → je Name nur EINE Zeile (erste gewinnt), sonst doppelter
	// {#each}-Key. Der Redaktions-Hinweis ist ohnehin je Token-Name eindeutig.
	const flatTokens: FlatToken[] = (() => {
		const seen = new Set<string>();
		const out: FlatToken[] = [];
		for (const g of tokenGroups)
			for (const t of g.items ?? []) {
				if (seen.has(t.name)) continue;
				seen.add(t.name);
				out.push({ name: t.name, machineHinweis: t.hinweis ?? '' });
			}
		return out;
	})();

	// ── Gemischte A11y-Liste: Maschinen-Angaben (model.a11y), die die Redaktion NICHT
	// per Label überschreibt, erscheinen read-only mit ⇣-Mini-Pill („nicht editierbar").
	type MachineA11y = { label: string; wert: string; status?: string };
	const machineA11y = data.machine.a11y as MachineA11y[];
	const editorialA11yLabels = $derived(
		new Set(model.a11y.map((r) => r.label.trim().toLowerCase()).filter(Boolean))
	);
	const machineA11yUnedited = $derived(
		machineA11y.filter((m) => !editorialA11yLabels.has((m.label ?? '').trim().toLowerCase()))
	);

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
	const weitereSummary = $derived(
		`${readonlyEditorialShown.length} ${readonlyEditorialShown.length === 1 ? 'Feld' : 'Felder'} · read-only`
	);

	// ── Cluster-Ankerleiste (V5): Klick scrollt smooth zum Cluster-Kopf ──────────
	const ANCHORS = [
		{ id: 'cluster-overview', label: 'Übersicht' },
		{ id: 'cluster-design', label: 'Design' },
		{ id: 'cluster-inhalt', label: 'Inhalt' },
		{ id: 'cluster-a11y', label: 'A11y' },
		{ id: 'cluster-develop', label: 'Develop' }
	];
	function jumpTo(e: MouseEvent, id: string) {
		e.preventDefault();
		const el = document.getElementById(id);
		if (!el) return;
		const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
		el.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' });
	}

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
	{#if h === 'geschätzt'}
		<Pill tone="estimate" icon="≈">geschätzt</Pill>
	{:else}
		<!-- gemessen/abgeleitet: ruhiger Klartext rechts (kein Pill) — wie im Mockup. -->
		<span class="herkunft-text">{h}</span>
	{/if}
{/snippet}

{#snippet miniPill(variant: 'machine' | 'editorial')}
	<span class="mini-pill mini-pill--{variant}" aria-hidden="true">
		{#if variant === 'machine'}<ImportIcon width={11} height={11} />{:else}<PencilIcon
				width={11}
				height={11}
			/>{/if}
	</span>
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

<!-- Verschlankter Redaktions-Kartenkopf (V3): kurzer Titel + gedämpfte Subzeile,
     eigene ✎-Pill je Karte (kein Sammel-„Redaktion"-Monolith mehr). -->
{#snippet editorialHead(title: string, subline?: string)}
	<div class="card-head">
		<span class="card-titles">
			<span class="card-title">{title}</span>
			{#if subline}<span class="card-subline">{subline}</span>{/if}
		</span>
		<ProvenanceChip variant="editorial" />
	</div>
{/snippet}

{#snippet clusterEyebrow(id: string, label: string)}
	<div class="cluster-eyebrow" {id}>{label}</div>
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
	<nav class="crumb"><a href="/admin">← Alle Komponenten</a></nav>

	{#if !data.writable}
		<AdminFlash tone="warn">
			Nur-Lese-Vorschau: Schreiben ist im Prod-Modus deaktiviert (Prod öffnet später einen GitHub-PR).
		</AdminFlash>
	{/if}

	<!-- EIN äußerer Karten-Container um den gesamten Editor (Delta 1). -->
	<article class="editor-card">
		<!-- Kompakte Kopf-Leiste: Name + Status links · Sync-Meta + Re-Import rechts. -->
		<header class="editor-card__head">
			<div class="editor-card__ident">
				<span class="editor-card__name">{data.name}</span>
				{#if data.status}<Pill tone="status">{data.status}</Pill>{/if}
			</div>
			<div class="editor-card__meta">
				<span class="editor-card__sync">
					Sync: Figma-Node <code>{data.nodeId ?? '—'}</code>{#if data.aktualisiertAm}
						· Stand {data.aktualisiertAm}{/if}
				</span>
				<a class="editor-card__link" href={data.viewHref} title="Öffentliche Doku-Seite"
					>Doku-Seite ↗</a
				>
				{#if data.figmaUrl}<a
						class="editor-card__link"
						href={data.figmaUrl}
						target="_blank"
						rel="noreferrer">Figma ↗</a
					>{/if}
				<LegendPopover />
				<button
					type="button"
					class="reimport-btn"
					onclick={copyReImport}
					title="Re-Import ist ein CLI-Schritt — Befehl kopieren"
					aria-label="Re-Import ist ein CLI-Schritt — Befehl in die Zwischenablage kopieren"
				>
					<ImportIcon width={13} height={13} /> Re-Import
				</button>
			</div>
		</header>

		<!-- Cluster-Ankerleiste (V5): schmale Sprungzeile unter dem Kopf. -->
		<nav class="anchor-bar" aria-label="Zu Abschnitt springen">
			{#each ANCHORS as a (a.id)}
				<a class="anchor-bar__link" href={`#${a.id}`} onclick={(e) => jumpTo(e, a.id)}>{a.label}</a>
			{/each}
		</nav>

		<div class="editor-card__body">
			<!-- Drift-Banner (nur wenn figma-raw.json neuer als model.json) — Delta 7. -->
			{#if data.figmaRawNeuerAlsModel}
				<div class="drift" role="status">
					<span class="drift__icon" aria-hidden="true"><AlertTriangleIcon width={18} height={18} /></span>
					<div class="drift__body">
						<strong class="drift__title">Design hat sich seit dem letzten Import geändert</strong>
						<p class="drift__text">
							Die Figma-Roh-Daten (<code>figma-raw.json</code>) sind neuer als das
							<code>model.json</code>. Maße, Tokens und Varianten unten könnten veraltet sein. Der
							Re-Import ist bewusst ein manueller CLI-Schritt — die Doku rät nie.
						</p>
						<div class="drift__actions">
							<button type="button" class="drift__btn" onclick={copyReImport}>
								<ImportIcon width={13} height={13} /> Re-Import-Befehl kopieren
							</button>
							<a class="drift__btn" href={data.importGuideHref} target="_blank" rel="noreferrer"
								>Zur Anleitung ↗</a
							>
						</div>
					</div>
				</div>
			{/if}

			<form method="POST" bind:this={formEl} use:enhance={handleSubmit}>
				<input type="hidden" name="payload" value={payload} />

				<!-- ① Übersicht (V4): Zweck + Status in EINER Karte; erste Karte = Anker. -->
				<section class="card" id="cluster-overview">
					{@render editorialHead('Übersicht', 'Zweck & Status in einer Karte')}
					<div class="card-body">
						<textarea
							bind:value={model.zweck}
							rows="3"
							placeholder="Wozu dient die Komponente? …"
						></textarea>
						<div class="overview-status">
							<span class="overview-status__label">Status</span>
							<select
								class="status-select status-select--{model.status}"
								bind:value={model.status}
								aria-label="Status"
							>
								<option value="ready_for_dev">ready_for_dev</option>
								<option value="completed">completed</option>
								<option value="changed">changed</option>
							</select>
						</div>
					</div>
				</section>

				<!-- ═══ DESIGN ═══ -->
				{@render clusterEyebrow('cluster-design', 'Design')}

				<!-- ② Maße & Spacing (offen) -->
				{#if masseRows.length || spacingRows.length}
					<MachineZone
						title="Maße & Spacing"
						subline="Werte aus dem Figma-Import — Änderung in Figma, dann Re-Import."
					>
						{#if masseRows.length}
							<table class="mz-table">
								<tbody>
									{#each masseRows as r (r.label)}
										<tr>
											<td class="mz-table__label">{r.label}</td>
											<td class="mz-table__value"
												>{anzeigeWert(r.px)}{#if r.token} <code>{r.token}</code>{/if}</td
											>
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
											<td class="mz-table__value"
												>{anzeigeWert(r.px)}{#if r.token} <code>{r.token}</code>{/if}</td
											>
											<td class="mz-table__herkunft">{@render herkunftBadge(r.herkunft)}</td>
										</tr>
									{/each}
								</tbody>
							</table>
						{/if}
					</MachineZone>
				{/if}

				<!-- ③ Tokens (eingeklappt) — EINE Tabelle mit Gruppen-Eyebrow-Zeilen (V2). -->
				{#if tokenView.length}
					<MachineZone
						title="Tokens"
						subline="Live aus dem aktiven Theme aufgelöst — nicht gespeichert."
						collapsible
						summary={tokenSummary}
						defaultOpen={false}
					>
						<table class="mz-table mz-table--tokens">
							<tbody>
								{#each tokenView as group (group.kategorie)}
									<tr class="mz-grouprow">
										<td class="mz-grouprow__cell" colspan="4">{group.kategorie}</td>
									</tr>
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
								{/each}
							</tbody>
						</table>
					</MachineZone>
				{/if}

				<!-- „Hinweis je Token" DIREKT unter den Tokens, leicht eingerückt (zugehörig). -->
				{#if flatTokens.length}
					{#if expanded.tokenHinweise}
						<section class="card card--attached" id="sec-tokenHinweise">
							{@render editorialHead(
								'Hinweis je Token',
								'Direkt bei den Tokens — leer = Maschinen-Hinweis gewinnt'
							)}
							<div class="card-body">
								{#each flatTokens as t (t.name)}
									<div class="token-hint-row">
										<code class="token-hint-row__name">{t.name}</code>
										<input
											class="token-hint-row__input"
											bind:value={model.tokenHinweise[t.name]}
											placeholder={t.machineHinweis || '(kein Maschinen-Hinweis)'}
										/>
									</div>
								{/each}
							</div>
						</section>
					{:else}
						<div class="ghost-attached">
							{@render ghostToggle('tokenHinweise', 'Hinweis je Token ergänzen')}
						</div>
					{/if}
				{/if}

				<!-- ④ Varianten & Zustände (eingeklappt) -->
				{#if varianten.length || zustaende.length}
					<MachineZone
						title="Varianten & Zustände"
						collapsible
						summary={variantSummary}
						defaultOpen={false}
					>
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

				<!-- ═══ INHALT ═══ -->
				{@render clusterEyebrow('cluster-inhalt', 'Inhalt')}

				<!-- ⑤ Verwendung -->
				{#if expanded.verwendung}
					<section class="card" id="sec-verwendung">
						{@render editorialHead('Verwendung', 'Wann nutzen · wann nicht')}
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

				<!-- ⑥ Do & Don't -->
				{#if expanded.doDont}
					<section class="card" id="sec-doDont">
						{@render editorialHead("Do & Don't")}
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

				<!-- ⑦ Wording -->
				{#if expanded.wording}
					<section class="card" id="sec-wording">
						{@render editorialHead('Wording', 'Schlecht → Gut · Hinweis')}
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
								onclick={() => model.wording.push({ schlecht: '', gut: '', hinweis: '' })}
								>+ Regel</button
							>
						</div>
					</section>
				{:else}
					{@render ghostCard('wording', 'Wording-Regeln')}
				{/if}

				<!-- ═══ BARRIEREFREIHEIT ═══ -->
				{@render clusterEyebrow('cluster-a11y', 'Barrierefreiheit')}

				<!-- ⑧ Barrierefreiheit (gemischt) -->
				{#if expanded.a11y}
					<section class="card" id="sec-a11y">
						<div class="card-head">
							<span class="card-titles">
								<span class="card-title">Barrierefreiheit</span>
								<span class="card-subline">Label · Wert · Status</span>
							</span>
							<span class="card-head__side">
								{#if machineA11yUnedited.length}
									<span class="card-head__meta" title="Maschinen- und Redaktions-Zeilen gemischt"
										>gemischt</span
									>
								{/if}
								<ProvenanceChip variant="editorial" />
							</span>
						</div>
						<div class="card-body">
							{#each machineA11yUnedited as m (m.label)}
								<div class="row row--machine">
									{@render miniPill('machine')}
									<span class="row__static row__static--key">{m.label}</span>
									<span class="row__static">{m.wert}</span>
									<span class="row__prov">nicht editierbar</span>
								</div>
							{/each}
							{#each model.a11y as _, i (i)}
								<div class="row">
									{@render miniPill('editorial')}
									<input
										class="row__input row__input--key"
										bind:value={model.a11y[i].label}
										placeholder="Label"
									/>
									<input class="row__input" bind:value={model.a11y[i].wert} placeholder="Wert" />
									<select
										class="status-select status-select--{model.a11y[i].status}"
										bind:value={model.a11y[i].status}
										aria-label="Status"
									>
										{#each A11Y_STATUS_OPTIONS as o (o.value)}
											<option value={o.value}>{o.label}</option>
										{/each}
									</select>
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
								onclick={() => model.a11y.push({ label: '', wert: '', status: 'warn' })}
								>+ Eintrag</button
							>
						</div>
					</section>
				{:else}
					{@render ghostCard('a11y', 'Barrierefreiheit')}
				{/if}

				<!-- ⑨ Komposition -->
				{#if expanded.komposition}
					<section class="card" id="sec-komposition">
						{@render editorialHead('Komposition', 'Hinweise für Agenten & Devs')}
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

				<!-- ⑩ Verwandte Komponenten -->
				{#if expanded.verwandt}
					<section class="card" id="sec-verwandt">
						{@render editorialHead('Verwandte Komponenten', 'Katalog-Slugs')}
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
							<button type="button" class="row-add" onclick={() => model.verwandt.push('')}
								>+ Slug</button
							>
						</div>
					</section>
				{:else}
					{@render ghostCard('verwandt', 'Verwandte Komponenten')}
				{/if}

				<!-- ═══ DEVELOP ═══ -->
				{@render clusterEyebrow('cluster-develop', 'Develop')}

				<!-- ⑪ Code-Beispiele -->
				{#if expanded.codeBeispiele}
					<section class="card" id="sec-codeBeispiele">
						{@render editorialHead('Code-Beispiele', 'Develop-Tab · zeit.de-Repo')}
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

				<!-- Snippets überschreiben -->
				{#if expanded.snippets}
					<section class="card" id="sec-snippets">
						{@render editorialHead('Snippets überschreiben', 'Feldweise über die Maschinen-Werte')}
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

				<!-- ⑫ Weitere Felder (read-only, eingeklappt) -->
				{#if readonlyEditorialShown.length}
					<MachineZone
						title="Weitere Felder"
						subline="In v1 nur im Code (content.json) pflegen — kein Formular."
						hint="Diese Felder bleiben in v1 ohne Formular — beim Speichern unverändert erhalten. Pflege direkt in content.json."
						collapsible
						summary={weitereSummary}
						defaultOpen={false}
						pillTitle="In v1 nur im Code (content.json) pflegen — kein Formular"
					>
						{#each readonlyEditorialShown as [key, value] (key)}
							<details class="ro-json">
								<summary>{key}</summary>
								<pre>{JSON.stringify(value, null, 2)}</pre>
							</details>
						{/each}
					</MachineZone>
				{/if}

				{#if dirty}
					<div class="savebar" role="status">
						<span class="savebar-info">Ungespeicherte Änderungen</span>
						<button type="button" class="savebar-discard" onclick={discard}>Verwerfen</button>
						<button type="submit" class="save" disabled={!data.writable}
							>Speichern <kbd>⌘S</kbd></button
						>
					</div>
				{/if}
			</form>
		</div>
	</article>
</div>

<style>
	.spec-edit {
		max-width: 52rem;
		margin: 0 auto;
		padding: var(--z-ds-space-l) var(--z-ds-space-l) 7rem;
	}

	/* ── „← Alle Komponenten" klein oberhalb der Karte ── */
	.crumb {
		margin-bottom: var(--z-ds-space-m);
	}
	.crumb a {
		color: var(--ds-text-muted);
		text-decoration: none;
		font-size: var(--ds-text-sm);
		transition: color var(--ds-dur) var(--ds-ease-out);
	}
	.crumb a:hover {
		color: var(--ds-text);
	}
	.crumb a:focus-visible {
		outline: 2px solid var(--ds-focus-ring);
		outline-offset: 2px;
	}

	/* ── EIN äußerer Karten-Container um den gesamten Editor (Delta 1) ──
	   Hebt sich mit Hairline + 12px-Radius von der Seite ab. */
	.editor-card {
		background: var(--ds-surface-card);
		border: 1px solid var(--ds-border);
		border-radius: var(--ds-radius-lg);
		box-shadow: var(--ds-shadow-sm);
		overflow: hidden;
	}
	/* Kompakte Kopf-Leiste: Name+Status links, Sync-Meta+Re-Import rechts,
	   Hairline darunter. */
	.editor-card__head {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: var(--z-ds-space-m);
		flex-wrap: wrap;
		padding: var(--z-ds-space-s) var(--z-ds-space-l);
		border-bottom: 1px solid var(--ds-border);
	}
	.editor-card__ident {
		display: inline-flex;
		align-items: center;
		gap: var(--z-ds-space-s);
		min-width: 0;
	}
	.editor-card__name {
		font-size: var(--ds-text-base);
		font-weight: 700;
		color: var(--ds-text);
	}
	.editor-card__meta {
		display: inline-flex;
		align-items: center;
		flex-wrap: wrap;
		gap: var(--z-ds-space-m);
	}
	.editor-card__sync {
		font-size: var(--ds-text-xs);
		color: var(--ds-text-muted);
	}
	.editor-card__sync code {
		font-family: var(--ds-font-mono);
	}
	.editor-card__link {
		font-size: var(--ds-text-xs);
		color: var(--ds-accent);
		text-decoration: none;
	}
	.editor-card__link:hover {
		text-decoration: underline;
	}
	.editor-card__link:focus-visible {
		outline: 2px solid var(--ds-focus-ring);
		outline-offset: 2px;
	}
	/* Re-Import: kleiner Outline-Button (kopiert den CLI-Befehl, führt nichts aus). */
	.reimport-btn {
		display: inline-flex;
		align-items: center;
		gap: var(--z-ds-space-4);
		width: auto;
		font-size: var(--ds-text-xs);
		font-weight: 600;
		color: var(--ds-text);
		background: var(--ds-surface);
		border: 1px solid var(--ds-border-strong);
		border-radius: var(--ds-radius-sm);
		padding: var(--z-ds-space-4) var(--z-ds-space-8);
		cursor: pointer;
		transition:
			border-color var(--ds-dur) var(--ds-ease-out),
			background var(--ds-dur) var(--ds-ease-out);
	}
	.reimport-btn:hover {
		border-color: var(--ds-accent);
	}
	.reimport-btn:active {
		background: var(--ds-surface-sunken);
	}
	.reimport-btn:focus-visible {
		outline: 2px solid var(--ds-focus-ring);
		outline-offset: 2px;
	}
	@media (prefers-reduced-motion: reduce) {
		.reimport-btn {
			transition: none;
		}
	}
	.editor-card__body {
		padding: var(--z-ds-space-l);
	}

	/* ── Cluster-Ankerleiste (V5): schmale Sprungzeile unter dem Kopf ── */
	.anchor-bar {
		display: flex;
		flex-wrap: wrap;
		gap: var(--z-ds-space-m);
		padding: var(--z-ds-space-6) var(--z-ds-space-l);
		border-bottom: 1px solid var(--ds-border);
		background: var(--ds-surface-soft);
	}
	.anchor-bar__link {
		font-size: var(--ds-text-xs);
		font-weight: 500;
		color: var(--ds-text-muted);
		text-decoration: none;
		border-radius: var(--ds-radius-sm);
		padding: 1px var(--z-ds-space-4);
		transition: color var(--ds-dur) var(--ds-ease-out);
	}
	.anchor-bar__link:hover {
		color: var(--ds-text);
	}
	.anchor-bar__link:focus-visible {
		outline: 2px solid var(--ds-focus-ring);
		outline-offset: 2px;
	}
	@media (prefers-reduced-motion: reduce) {
		.anchor-bar__link {
			transition: none;
		}
	}

	/* ── Cluster-Eyebrow (V5): gedämpfte Letterspacing-Überschrift + Anker-Ziel ── */
	.cluster-eyebrow {
		margin: var(--z-ds-space-l) 0 var(--z-ds-space-8);
		font-size: var(--ds-text-xs);
		font-weight: 600;
		text-transform: uppercase;
		letter-spacing: 0.08em;
		color: var(--ds-text-faint);
		scroll-margin-top: var(--z-ds-space-l);
	}
	/* Erster Cluster-Anker (Übersicht-Karte) — nur Scroll-Offset, keine Optik. */
	#cluster-overview {
		scroll-margin-top: var(--z-ds-space-l);
	}

	/* ── Drift-Banner: getönte Warn-Fläche, Icon + fetter Titel + Erklärtext,
	   Aktion rechts (klein, outline) — Formensprache des Mockups. ── */
	.drift {
		display: flex;
		align-items: flex-start;
		gap: var(--z-ds-space-s);
		background: var(--ds-tint-warning-surface);
		border: 1px solid var(--ds-tint-warning-border);
		border-radius: var(--ds-radius);
		padding: var(--z-ds-space-m);
		margin-bottom: var(--z-ds-space-l);
	}
	.drift__icon {
		display: inline-flex;
		flex: none;
		color: var(--ds-tint-warning-text);
		margin-top: 1px;
	}
	.drift__body {
		flex: 1;
		min-width: 0;
	}
	.drift__title {
		display: block;
		font-size: var(--ds-text-base);
		color: var(--ds-tint-warning-text);
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
	/* Zwei kleine Outline-Buttons unter dem Text, links (Delta 7). */
	.drift__actions {
		display: flex;
		flex-wrap: wrap;
		gap: var(--z-ds-space-6);
		margin-top: var(--z-ds-space-8);
	}
	.drift__btn {
		display: inline-flex;
		align-items: center;
		gap: var(--z-ds-space-4);
		width: auto;
		font-size: var(--ds-text-xs);
		font-weight: 600;
		color: var(--ds-text);
		text-decoration: none;
		border: 1px solid var(--ds-border-strong);
		border-radius: var(--ds-radius-sm);
		padding: var(--z-ds-space-4) var(--z-ds-space-8);
		background: var(--ds-surface);
		cursor: pointer;
		transition: border-color var(--ds-dur, 0.15s) var(--ds-ease-out, ease-out);
	}
	.drift__btn:hover {
		border-color: var(--ds-accent);
	}
	.drift__btn:focus-visible {
		outline: 2px solid var(--ds-focus-ring);
		outline-offset: 2px;
	}
	@media (prefers-reduced-motion: reduce) {
		.drift__btn {
			transition: none;
		}
	}

	/* ── Maschinen-Tabellen ── */
	.mz-table {
		width: 100%;
		border-collapse: collapse;
	}
	/* Maschinen-Zone → Trenner GESTRICHELT (dieselbe „nicht editierbar"-Sprache).
	   Zeilen-Rhythmus: kompakt, aber mit Luft (Sichtabnahme 19.07.). */
	.mz-table td {
		padding: var(--z-ds-space-10) var(--z-ds-space-8) var(--z-ds-space-10) 0;
		border-bottom: 1px dashed var(--ds-border);
		vertical-align: middle;
		font-size: var(--ds-text-sm);
		color: var(--ds-text-body);
	}
	.mz-table tr:last-child td {
		border-bottom: none;
	}
	.mz-table__label {
		/* Eine Stufe leiser als muted — die Werte tragen die Zeile, das Label ordnet nur ein. */
		color: var(--ds-text-faint);
		white-space: nowrap;
		width: 1%;
		min-width: 148px;
		padding-right: var(--z-ds-space-m);
	}
	/* Wert-Spalte trägt die Zeile (Zahl + inline-Token) → nimmt den Restplatz;
	   der Messwert selbst in voller Textfarbe (Mockup: Wert klar, Label gedämpft). */
	.mz-table__value {
		width: 100%;
		color: var(--ds-text);
	}
	.mz-table__value--mono,
	.mz-table__value code,
	.mz-table__token code {
		font-family: var(--ds-font-mono);
		font-size: var(--ds-text-xs);
	}
	.mz-table__value code,
	.mz-table__token code {
		color: var(--ds-text-muted);
	}
	.mz-table__herkunft {
		text-align: right;
		white-space: nowrap;
	}
	/* gemessen/abgeleitet als ruhiger Klartext rechts (kein Pill) — Delta 3. */
	.herkunft-text {
		font-size: var(--ds-text-xs);
		color: var(--ds-text-muted);
	}
	.mz-table__swatch {
		width: 24px;
	}
	/* Token-Zeilen (Delta 5): Token-Name nimmt die Breite, Wert + Hinweis rechts.
	   Bewusst KOMPAKTER als die Maße-Zeilen — viele Zeilen, reine Referenzliste. */
	.mz-table--tokens td {
		padding-top: var(--z-ds-space-8);
		padding-bottom: var(--z-ds-space-8);
	}
	.mz-table--tokens .mz-table__token {
		width: 100%;
	}
	.mz-table--tokens .mz-table__value {
		width: auto;
		white-space: nowrap;
		text-align: right;
		color: var(--ds-text-body);
	}
	.mz-table__hinweis {
		color: var(--ds-text-muted);
		white-space: nowrap;
		text-align: right;
		padding-left: var(--z-ds-space-m);
	}
	.mz-subhead {
		margin: var(--z-ds-space-m) 0 var(--z-ds-space-6);
		font-size: var(--ds-text-xs);
		text-transform: uppercase;
		letter-spacing: 0.06em;
		color: var(--ds-text-muted);
		font-weight: 600;
	}
	/* Gruppen-Eyebrow-Zeile IN der Token-Tabelle (V2: eine Tabelle statt vier Boxen). */
	.mz-grouprow__cell {
		padding: var(--z-ds-space-m) 0 var(--z-ds-space-6);
		border-bottom: 1px dashed var(--ds-border);
		font-size: var(--ds-text-xs);
		text-transform: uppercase;
		letter-spacing: 0.06em;
		color: var(--ds-text-muted);
		font-weight: 600;
	}
	.mz-grouprow:first-child .mz-grouprow__cell {
		padding-top: 0;
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

	/* ── Editor-Karten (Sektions-Ebene) — auf --ds-surface-raised abgesetzt gegen
	   die weiße äußere Karte, damit sich die Ebenen klar staffeln. ── */
	.card {
		background: var(--ds-surface-raised, var(--ds-surface));
		border: 1px solid var(--ds-border-soft);
		border-radius: var(--ds-radius);
		padding: var(--z-ds-space-m);
		margin-bottom: var(--z-ds-space-m);
	}
	/* „Hinweis je Token" gehört zur Tokens-Zone → leicht eingerückt & aufgesetzt. */
	.card--attached {
		margin-left: var(--z-ds-space-m);
		margin-top: calc(-1 * var(--z-ds-space-6));
	}
	.ghost-attached {
		margin-left: var(--z-ds-space-m);
		margin-top: calc(-1 * var(--z-ds-space-6));
	}
	.card-head {
		display: flex;
		align-items: flex-start;
		justify-content: space-between;
		gap: var(--z-ds-space-s);
		padding: 0 0 var(--z-ds-space-8);
		border-bottom: 1px solid var(--ds-border-soft);
	}
	/* Titel + gedämpfte Subzeile gestapelt (V3). */
	.card-titles {
		display: flex;
		flex-direction: column;
		gap: 1px;
		min-width: 0;
	}
	.card-title {
		font-size: var(--ds-text-sm);
		font-weight: 600;
		color: var(--ds-text);
	}
	.card-subline {
		font-size: var(--ds-text-xs);
		font-weight: 400;
		color: var(--ds-text-muted);
	}
	.card-head__side {
		display: inline-flex;
		align-items: center;
		gap: var(--z-ds-space-8);
		flex: none;
	}
	.card-head__meta {
		font-size: var(--ds-text-xs);
		color: var(--ds-text-muted);
	}

	/* Übersicht (V4): Status als kompaktes Pill-Select rechts unter dem Zweck. */
	.overview-status {
		display: flex;
		align-items: center;
		gap: var(--z-ds-space-8);
	}
	.overview-status__label {
		font-size: var(--ds-text-xs);
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
		background: var(--ds-surface-inset);
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

	/* ── Hinweis je Token (Delta 6): mono-Name + Inline-Input je Zeile ── */
	.token-hint-row {
		display: flex;
		align-items: center;
		gap: var(--z-ds-space-s);
		border-bottom: 1px solid var(--ds-border-soft);
	}
	.token-hint-row__name {
		flex: 0 1 16rem;
		min-width: 0;
		font-family: var(--ds-font-mono);
		font-size: var(--ds-text-xs);
		color: var(--ds-text-muted);
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}
	.token-hint-row__input {
		flex: 1;
		min-width: 0;
		background: transparent;
		border: none;
		padding: var(--z-ds-space-6) var(--z-ds-space-6);
	}
	.token-hint-row__input:focus-visible {
		outline: 2px solid var(--ds-focus-ring);
		outline-offset: -2px;
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
	/* Icon-only Mini-Pill am Zeilenanfang (Delta 4): runde Tint-Fläche NUR mit Icon.
	   blau = Maschine (⇣), grün = Redaktion (✎). */
	.mini-pill {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		width: 1.15rem;
		height: 1.15rem;
		flex: none;
		border-radius: 999px;
	}
	.mini-pill--machine {
		color: var(--ds-tint-info-text);
		background: var(--ds-tint-info-strong);
	}
	.mini-pill--editorial {
		color: var(--ds-tint-positive-text);
		background: var(--ds-tint-positive-strong);
	}
	/* Read-only Maschinen-Zeile in gemischter Liste: gedämpft, „nicht editierbar". */
	.row--machine {
		color: var(--ds-text-body);
	}
	.row__static {
		flex: 1;
		min-width: 0;
		font-size: var(--ds-text-sm);
		padding: var(--z-ds-space-6) var(--z-ds-space-6);
	}
	.row__static--key {
		flex: 0 1 11rem;
		color: var(--ds-text);
	}
	.row__prov {
		flex: none;
		margin-left: auto;
		font-size: var(--ds-text-xs);
		color: var(--ds-text-muted);
	}
	/* Status als kompaktes Select im Pill-Look (Mockup „pass ▾"). */
	.status-select {
		flex: none;
		width: auto;
		font-size: var(--ds-text-xs);
		font-weight: 600;
		border-radius: 999px;
		padding: var(--z-ds-space-4) var(--z-ds-space-8);
		border: 1px solid transparent;
		background: var(--ds-surface-sunken);
		color: var(--ds-text-body);
		cursor: pointer;
	}
	.status-select--pass {
		color: var(--ds-tint-positive-text);
		background: var(--ds-tint-positive-surface);
	}
	.status-select--warn {
		color: var(--ds-tint-warning-text);
		background: var(--ds-tint-warning-surface);
	}
	.status-select:focus-visible {
		outline: 2px solid var(--ds-focus-ring);
		outline-offset: 1px;
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
		border-radius: var(--ds-radius);
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
