<script lang="ts">
	import { onMount, tick, untrack } from 'svelte';
	import { enhance } from '$app/forms';
	import type { SubmitFunction } from '@sveltejs/kit';
	import { getToastState } from '$stores/toast-state.svelte';
	import { ImportIcon, PencilIcon } from '$lib/icons';
	import { resolveCssVar } from '$lib/utils';
	import { AdminFlash, Pill } from '../../../ui';
	import MachineZone from './MachineZone.svelte';
	import StringListField from './StringListField.svelte';
	import RowListField from './RowListField.svelte';
	import RelatedField from './RelatedField.svelte';
	import SnippetOverridesField from './SnippetOverridesField.svelte';
	import SaveBar from './SaveBar.svelte';
	import CodeExamplesField from './CodeExamplesField.svelte';
	import LegendPopover from './LegendPopover.svelte';
	import EditorialCard from './EditorialCard.svelte';
	import SpecTable from './SpecTable.svelte';
	import AnchorBar from './AnchorBar.svelte';
	import DriftBanner from './DriftBanner.svelte';

	let { data }: import('./$types').PageProps = $props();
	const toast = getToastState();

	// ── Re-Import ist bewusst ein CLI-Schritt: der Button kopiert nur den fertigen
	// Befehl (Muster wie CopyButton → Toast-Feedback), er führt nichts aus. ────────
	const reImportCommand = $derived(
		data.figmaUrl ? `node tooling/zeit-de-exporter/import.mjs '${data.figmaUrl}' ${data.slug}` : ''
	);
	async function copyReImport() {
		if (!reImportCommand) {
			toast?.add('Kein Re-Import möglich', 'Im model.json ist keine Figma-URL hinterlegt.');
			return;
		}
		try {
			await navigator.clipboard?.writeText(reImportCommand);
			toast?.add(
				'Befehl kopiert',
				'Re-Import-Befehl in der Zwischenablage — im Terminal ausführen.'
			);
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

	// Spalten-Schemata für den gemeinsamen RowListField (Wording · A11y): definieren den
	// leeren Ghost-Entwurf + die Leerprüfung; die Inputs selbst liefern die row-Snippets.
	const WORDING_COLUMNS = [{ key: 'schlecht' }, { key: 'gut' }, { key: 'hinweis' }] as const;
	const A11Y_COLUMNS = [
		{ key: 'label' },
		{ key: 'wert' },
		{ key: 'status', type: 'select', options: A11Y_STATUS_OPTIONS }
	] as const;

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

	// Abschnitt aufklappen; danach wandert der Fokus in die erste Ghost-Zeile bzw. das
	// erste Feld des Abschnitts. Wording/A11y/Verwandt legen NICHTS vorab an — dort
	// übernimmt die Ghost-Zeile (RowListField) bzw. das Hinzufügen-Select das Anlegen.
	// Der Fokus wartet auf das Animationsende (Ghost ↔ Karte), damit er nicht ruckelt.
	async function reveal(key: string) {
		expanded[key] = true;
		if (key === 'codeBeispiele' && model.codeBeispiele.length === 0)
			model.codeBeispiele.push({ label: '', sprache: 'svelte', code: '', hinweis: '' });
		await tick();
		const focusFirst = () => {
			const sec = document.getElementById(`sec-${key}`);
			sec?.querySelector<HTMLElement>('.string-list__ghost, input, textarea, select')?.focus();
		};
		const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
		if (reduce) focusFirst();
		else setTimeout(focusFirst, REVEAL_MS);
	}

	// Abschnitt ENTFERNEN (Gegenstück zur Ghost-Karte): leert die Felder des Abschnitts
	// im State (Arrays → [], Strings → '') und klappt zur Ghost-Karte zurück. Kein
	// Confirm — die Save-Bar schützt: nichts ist persistiert, bis gespeichert wird. Der
	// leere State fällt im payload raus (delete-when-absent) → content.json bleibt schlank.
	// Für die Override-Abschnitte (tokenHinweise/snippets) mit „leer = Maschine gewinnt"-
	// Semantik heißt Entfernen konsequenterweise: alle Override-Inputs leeren.
	async function removeSection(key: string, label: string) {
		switch (key) {
			case 'verwendung':
				model.verwendung.nutzen = [];
				model.verwendung.nichtNutzen = [];
				break;
			case 'doDont':
				model.doDont.do = [];
				model.doDont.dont = [];
				break;
			case 'wording':
				model.wording = [];
				break;
			case 'a11y':
				model.a11y = [];
				break;
			case 'komposition':
				model.komposition = [];
				break;
			case 'verwandt':
				model.verwandt = [];
				break;
			case 'codeBeispiele':
				model.codeBeispiele = [];
				break;
			case 'tokenHinweise':
				for (const name of Object.keys(model.tokenHinweise)) model.tokenHinweise[name] = '';
				break;
			case 'snippets':
				model.codeSvelte = '';
				model.repoCodeSvelte = '';
				model.codeNote = '';
				model.repoNote = '';
				break;
		}
		expanded[key] = false;
		toast?.add('Abschnitt geleert', `${label} — Speichern übernimmt es.`);
		// Fokus zurück auf die Ghost-Karte (A11y: kein verwaister Fokus).
		await tick();
		document.getElementById(`ghost-${key}`)?.focus();
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

	type SpacingRow = { label: string; px: string; token?: string; herkunft: Herkunft };
	const spacingRows = $derived.by<SpacingRow[]>(() =>
		(
			data.machine.spacing as { label?: string; px?: string; token?: string; herkunft?: Herkunft }[]
		).map((s) => ({
			label: s.label ?? '',
			px: s.px ?? '',
			token: s.token,
			herkunft: s.herkunft ?? 'gemessen'
		}))
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
		if (varianten.length)
			parts.push(`${varianten.length} ${varianten.length === 1 ? 'Achse' : 'Achsen'}`);
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

	// Dauer der Ghost↔Karte-Animation (≈ --ds-dur-slow) — steuert den Fokus-Delay in
	// reveal() (Fokus erst nach dem Aufklappen) und die Karten-Transition.
	const REVEAL_MS = 260;

	// ── Deep-Links aus der /admin-Übersicht (Delta B2) ───────────────────────────
	// Landet die Seite mit #sec-<key> (Doku-Lücken-Chip), wird ein zugehöriger Ghost-
	// Abschnitt automatisch aufgeklappt und sauber unter die Sticky-Navbar gescrollt.
	onMount(async () => {
		const hash = location.hash.slice(1);
		if (!hash) return;
		const key = hash.startsWith('sec-') ? hash.slice(4) : null;
		if (key && key in expanded && !expanded[key]) {
			expanded[key] = true;
			await tick();
		}
		const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
		document
			.getElementById(hash)
			?.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' });
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

{#snippet miniPill(variant: 'machine' | 'editorial')}
	<span class="mini-pill mini-pill--{variant}" aria-hidden="true">
		{#if variant === 'machine'}<ImportIcon width={11} height={11} />{:else}<PencilIcon
				width={11}
				height={11}
			/>{/if}
	</span>
{/snippet}

{#snippet clusterEyebrow(id: string, label: string)}
	<div class="cluster-eyebrow" {id}>{label}</div>
{/snippet}

<!-- Zeilen-Snippets für den gemeinsamen RowListField (Wording · Barrierefreiheit).
     Das Zeilen-Objekt ist flach getippt (Record<string, string>) — passend zum
     generischen Feld; die Feld-Keys entsprechen den Spalten-Schemata. -->
{#snippet wordingRow(entry: Record<string, string>)}
	<input
		class="row__input"
		bind:value={entry.schlecht}
		placeholder="Schlecht"
		aria-label="Schlecht"
	/>
	<span class="row__arrow" aria-hidden="true">→</span>
	<input class="row__input" bind:value={entry.gut} placeholder="Gut" aria-label="Gut" />
	<input
		class="row__input row__input--hint"
		bind:value={entry.hinweis}
		placeholder="Hinweis (optional)"
		aria-label="Hinweis"
	/>
{/snippet}
{#snippet a11yRow(entry: Record<string, string>)}
	{@render miniPill('editorial')}
	<input
		class="row__input row__input--key"
		bind:value={entry.label}
		placeholder="Label"
		aria-label="Label"
	/>
	<input class="row__input" bind:value={entry.wert} placeholder="Wert" aria-label="Wert" />
	<select
		class="status-select status-select--{entry.status}"
		bind:value={entry.status}
		aria-label="Status"
	>
		{#each A11Y_STATUS_OPTIONS as o (o.value)}
			<option value={o.value}>{o.label}</option>
		{/each}
	</select>
{/snippet}

<!-- Drift-Banner-Inhalte: Text + Aktionen kennen den Re-Import-Befehl (Seiten-Scope). -->
{#snippet driftText()}
	Die Figma-Roh-Daten (<code>figma-raw.json</code>) sind neuer als das
	<code>model.json</code>. Maße, Tokens und Varianten unten könnten veraltet sein. Der Re-Import ist
	bewusst ein manueller CLI-Schritt — die Doku rät nie.
{/snippet}
{#snippet driftActions()}
	<button type="button" class="drift__btn" onclick={copyReImport}>
		<ImportIcon width={13} height={13} /> Re-Import-Befehl kopieren
	</button>
	<a class="drift__btn" href={data.importGuideHref} target="_blank" rel="noreferrer"
		>Zur Anleitung ↗</a
	>
{/snippet}

<!-- „gemischt"-Meta der Barrierefreiheit-Karte (nur wenn Maschinen-Zeilen dabei sind). -->
{#snippet a11yHeadExtra()}
	{#if machineA11yUnedited.length}
		<span class="card-head__meta" title="Maschinen- und Redaktions-Zeilen gemischt">gemischt</span>
	{/if}
{/snippet}

<div class="spec-edit">
	<nav class="crumb"><a href="/admin">← Alle Komponenten</a></nav>

	{#if !data.writable}
		<AdminFlash tone="warn">
			Nur-Lese-Vorschau: Schreiben ist im Prod-Modus deaktiviert (Prod öffnet später einen
			GitHub-PR).
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
		<AnchorBar items={ANCHORS} />

		<div class="editor-card__body">
			<!-- Drift-Banner (nur wenn figma-raw.json neuer als model.json) — Delta 7. -->
			{#if data.figmaRawNeuerAlsModel}
				<DriftBanner
					title="Design hat sich seit dem letzten Import geändert"
					text={driftText}
					actions={driftActions}
				/>
			{/if}

			<form method="POST" bind:this={formEl} use:enhance={handleSubmit}>
				<input type="hidden" name="payload" value={payload} />

				<!-- ① Übersicht (V4): Zweck + Status in EINER Karte; erste Karte = Anker. -->
				<EditorialCard
					title="Übersicht"
					subline="Zweck & Status in einer Karte"
					id="cluster-overview"
				>
					<textarea bind:value={model.zweck} rows="3" placeholder="Wozu dient die Komponente? …"
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
				</EditorialCard>

				<!-- ═══ DESIGN ═══ -->
				{@render clusterEyebrow('cluster-design', 'Design')}

				<!-- ② Maße & Spacing (offen) -->
				{#if masseRows.length || spacingRows.length}
					<MachineZone
						title="Maße & Spacing"
						subline="Werte aus dem Figma-Import — Änderung in Figma, dann Re-Import."
					>
						{#if masseRows.length}
							<SpecTable variant="measure" rows={masseRows} />
						{/if}
						{#if spacingRows.length}
							<SpecTable variant="measure" rows={spacingRows} subhead="Abstände" />
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
						persistKey="{data.slug}:tokens"
					>
						<SpecTable variant="tokens" groups={tokenView} />
					</MachineZone>
				{/if}

				<!-- „Hinweis je Token" DIREKT unter den Tokens, leicht eingerückt (zugehörig). -->
				{#if flatTokens.length}
					<EditorialCard
						title="Hinweis je Token"
						subline="Direkt bei den Tokens — leer = Maschinen-Hinweis gewinnt"
						id="sec-tokenHinweise"
						attached
						expanded={expanded.tokenHinweise}
						ghostLabel="Hinweis je Token ergänzen"
						ghostId="ghost-tokenHinweise"
						onexpand={() => reveal('tokenHinweise')}
						onremove={() => removeSection('tokenHinweise', 'Token-Hinweise geleert')}
					>
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
					</EditorialCard>
				{/if}

				<!-- ④ Varianten & Zustände (eingeklappt) -->
				{#if varianten.length || zustaende.length}
					<MachineZone
						title="Varianten & Zustände"
						collapsible
						summary={variantSummary}
						defaultOpen={false}
						persistKey="{data.slug}:varianten"
					>
						{#if varianten.length}
							<div class="mz-chips">
								{#each varianten as axis (axis.prop)}
									<div class="mz-chips__row">
										<span class="mz-chips__label">{axis.prop}</span>
										{#each axis.werte as w (w.label)}
											<span class="mz-chip"
												>{w.label}{#if w.default}
													·default{/if}</span
											>
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
										{z.vorhanden ? '✓' : '–'}
										{z.label}
									</span>
								{/each}
							</div>
						{/if}
					</MachineZone>
				{/if}

				<!-- ═══ INHALT ═══ -->
				{@render clusterEyebrow('cluster-inhalt', 'Inhalt')}

				<!-- ⑤ Verwendung -->
				<EditorialCard
					title="Verwendung"
					subline="Wann nutzen · wann nicht"
					id="sec-verwendung"
					expanded={expanded.verwendung}
					ghostLabel="Verwendung ergänzen"
					ghostId="ghost-verwendung"
					onexpand={() => reveal('verwendung')}
					onremove={() => removeSection('verwendung', 'Verwendung geleert')}
				>
					<div class="sublist">
						<span class="sublist__label">Wann nutzen</span>
						<StringListField list={model.verwendung.nutzen} />
					</div>
					<div class="sublist">
						<span class="sublist__label">Wann nicht</span>
						<StringListField list={model.verwendung.nichtNutzen} />
					</div>
				</EditorialCard>

				<!-- ⑥ Do & Don't -->
				<EditorialCard
					title="Do & Don't"
					id="sec-doDont"
					expanded={expanded.doDont}
					ghostLabel="Do & Don't ergänzen"
					ghostId="ghost-doDont"
					onexpand={() => reveal('doDont')}
					onremove={() => removeSection('doDont', "Do & Don't geleert")}
				>
					<div class="sublist">
						<span class="sublist__label">Do</span>
						<StringListField list={model.doDont.do} />
					</div>
					<div class="sublist">
						<span class="sublist__label">Don't</span>
						<StringListField list={model.doDont.dont} />
					</div>
				</EditorialCard>

				<!-- ⑦ Wording -->
				<EditorialCard
					title="Wording"
					subline="Schlecht → Gut · Hinweis"
					id="sec-wording"
					expanded={expanded.wording}
					ghostLabel="Wording-Regeln ergänzen"
					ghostId="ghost-wording"
					onexpand={() => reveal('wording')}
					onremove={() => removeSection('wording', 'Wording geleert')}
				>
					<RowListField
						list={model.wording}
						columns={WORDING_COLUMNS}
						row={wordingRow}
						addLabel="Wording-Regel ergänzen"
					/>
				</EditorialCard>

				<!-- ═══ BARRIEREFREIHEIT ═══ -->
				{@render clusterEyebrow('cluster-a11y', 'Barrierefreiheit')}

				<!-- ⑧ Barrierefreiheit (gemischt) -->
				<EditorialCard
					title="Barrierefreiheit"
					subline="Label · Wert · Status"
					id="sec-a11y"
					expanded={expanded.a11y}
					ghostLabel="Barrierefreiheit ergänzen"
					ghostId="ghost-a11y"
					onexpand={() => reveal('a11y')}
					onremove={() => removeSection('a11y', 'Barrierefreiheit geleert')}
					headExtra={a11yHeadExtra}
				>
					{#each machineA11yUnedited as m (m.label)}
						<div class="row row--machine">
							{@render miniPill('machine')}
							<span class="row__static row__static--key">{m.label}</span>
							<span class="row__static">{m.wert}</span>
							<span class="row__prov">nicht editierbar</span>
						</div>
					{/each}
					<RowListField
						list={model.a11y}
						columns={A11Y_COLUMNS}
						row={a11yRow}
						addLabel="Barrierefreiheits-Eintrag ergänzen"
					/>
				</EditorialCard>

				<!-- ⑨ Komposition -->
				<EditorialCard
					title="Komposition"
					subline="Hinweise für Agenten & Devs"
					id="sec-komposition"
					expanded={expanded.komposition}
					ghostLabel="Komposition ergänzen"
					ghostId="ghost-komposition"
					onexpand={() => reveal('komposition')}
					onremove={() => removeSection('komposition', 'Komposition geleert')}
				>
					<StringListField
						list={model.komposition}
						addLabel="+ Hinweis ergänzen"
						placeholder="z. B. In Formularen mit Input und Label kombinieren."
					/>
				</EditorialCard>

				<!-- ⑩ Verwandte Komponenten -->
				<EditorialCard
					title="Verwandte Komponenten"
					subline="Katalog-Slugs"
					id="sec-verwandt"
					expanded={expanded.verwandt}
					ghostLabel="Verwandte Komponenten ergänzen"
					ghostId="ghost-verwandt"
					onexpand={() => reveal('verwandt')}
					onremove={() => removeSection('verwandt', 'Verwandte Komponenten geleert')}
				>
					<RelatedField
						list={model.verwandt}
						slugs={data.slugs}
						validSlugs={data.validSlugs}
						names={data.slugNames}
					/>
				</EditorialCard>

				<!-- ═══ DEVELOP ═══ -->
				{@render clusterEyebrow('cluster-develop', 'Develop')}

				<!-- ⑪ Code-Beispiele -->
				<EditorialCard
					title="Code-Beispiele"
					subline="Develop-Tab · zeit.de-Repo"
					id="sec-codeBeispiele"
					expanded={expanded.codeBeispiele}
					ghostLabel="Code-Beispiel ergänzen"
					ghostId="ghost-codeBeispiele"
					onexpand={() => reveal('codeBeispiele')}
					onremove={() => removeSection('codeBeispiele', 'Code-Beispiele geleert')}
				>
					<p class="hint">
						Redaktionelle Snippets fürs zeit.de-Repo — erscheinen im Develop-Tab unter den
						maschinellen Code-Sektionen. Reiner Text, nie ausgeführt.
					</p>
					<CodeExamplesField list={model.codeBeispiele} />
				</EditorialCard>

				<!-- Snippets überschreiben -->
				<EditorialCard
					title="Snippets überschreiben"
					subline="Feldweise über die Maschinen-Werte"
					id="sec-snippets"
					expanded={expanded.snippets}
					ghostLabel="Snippets überschreiben"
					ghostId="ghost-snippets"
					onexpand={() => reveal('snippets')}
					onremove={() => removeSection('snippets', 'Snippet-Overrides geleert')}
				>
					<p class="hint">
						Überschreibt die maschinellen Code-Snippets feldweise. Leer lassen = der Maschinen-Wert
						(aus Figma/<code>render</code>) gewinnt; er steht als Platzhalter.
					</p>
					<SnippetOverridesField {model} machine={data.machineSnippets} />
				</EditorialCard>

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
						persistKey="{data.slug}:weitere"
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
					<SaveBar writable={data.writable} ondiscard={discard} />
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

	/* ── Cluster-Eyebrow (V5): gedämpfte Letterspacing-Überschrift + Anker-Ziel ── */
	.cluster-eyebrow {
		margin: var(--z-ds-space-l) 0 var(--z-ds-space-8);
		font-size: var(--ds-text-xs);
		font-weight: 600;
		text-transform: uppercase;
		letter-spacing: 0.08em;
		color: var(--ds-text-faint);
		/* Deep-Link-Ziel (z. B. #cluster-design aus einem Doku-Lücken-Chip): unter der
		   Sticky-Navbar landen, nicht darunter verschwinden. */
		scroll-margin-top: calc(var(--header-height, 4rem) + var(--z-ds-space-m));
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

	/* „gemischt"-Meta im Kopf der Barrierefreiheit-Karte (Kopf-Zusatz-Snippet). */
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
</style>
