<script lang="ts">
	import { untrack } from 'svelte';
	import { enhance } from '$app/forms';
	import type { SubmitFunction } from '@sveltejs/kit';
	import { getToastState } from '$stores/toast-state.svelte';
	import { iconFor, CMS_CATEGORIES } from '../core/cms-components';
	import FieldsPanel from '../editor/FieldsPanel.svelte';
	import MediaPicker from '../editor/MediaPicker.svelte';
	import { Icon } from '$lib/icons/cms';
	import BlockPreview from '../editor/BlockPreview.svelte';
	import ProseEditor from '../editor/ProseEditor.svelte';
	import InsertMenu from '../editor/InsertMenu.svelte';
	import { Button } from '$components/ui/button';
	import { ButtonGroup } from '$components/ui/button-group';
	import { IconActionButton } from '$components/ui/icon-action-button';
	import { Field, Select } from '$components/ui/field';
	import { Dialog } from '$components/ui/dialog';
	import SlashMenu from '../editor/SlashMenu.svelte';
	import { validateValues, countErrors } from '../core/validation';
	import { readSlash } from '../core/slash';
	import { caretPixel } from '../core/caret';
	import { matchesMedia, MOBILE_QUERY } from '../core/media.svelte';
	import { cycleIndex } from '../core/cycle';
	import { blockDnd, blockDropEnd } from '../core/actions';
	import {
		createUidGen,
		itemFromSegment,
		newItem,
		cloneItem,
		serializeBlocks,
		imgSrc,
		imgAlt,
		withImgAttr,
		type Def,
		type ChildItem,
		type Item
	} from '../core/block-model';
	import { EditorHistory } from '../core/editor-history.svelte';

	let { data }: import('./$types').PageProps = $props();

	const toast = getToastState();

	let fieldState = $state(data.fields.map((f) => ({ ...f })));

	// Palette: Pseudo-Typ „Bild" (bare img-natural) + die registrierten Komponenten.
	// Typen (Def/ChildItem/Item) + Block-Logik leben in ../core/block-model.
	const IMAGE_DEF: Def = {
		name: 'Image',
		label: 'Bild (img-natural)',
		category: 'Medien',
		props: [
			{ key: 'src', label: 'Bild', type: 'media', default: '', mediaKind: 'image' },
			{ key: 'alt', label: 'Alt-Text', type: 'text', default: 'Bild' }
		]
	};
	const paletteDefs: Def[] = [IMAGE_DEF, ...data.components];
	const defByName = (name: string) => paletteDefs.find((d) => d.name === name);

	// Stabile uid-Vergabe für Blöcke/Kinder (überlebt Snapshot-Restore via ensureAbove).
	const uids = createUidGen();

	let items = $state<Item[]>(data.segments.map((s) => itemFromSegment(s, uids.next)));
	// Ohne <script>-Block lassen sich nur Bilder einfügen (Komponenten brauchen einen Import).
	const insertableDefs = data.hasScript
		? paletteDefs
		: paletteDefs.filter((d) => d.name === 'Image');
	// Einträge fürs Notion-artige Insert-Menü. „Prosa" (Text/Absatz) immer verfügbar
	// (braucht keinen Import); Einträge nach Kategorie gruppiert (V2).
	const paletteItems = [
		{ name: 'Prose', label: 'Text / Absatz', icon: 'text', category: 'Text' },
		...insertableDefs.map((d) => ({
			name: d.name,
			label: d.label,
			icon: iconFor(d.name),
			category: d.category ?? 'Komponenten'
		}))
	].sort((a, b) => {
		const order = CMS_CATEGORIES as readonly string[];
		return order.indexOf(a.category) - order.indexOf(b.category);
	});

	function insertType(name: string) {
		const it = newItem(name, defByName, uids.next);
		if (it) items = [...items, it];
	}
	function insertAfterWith(uid: number, name: string) {
		const it = newItem(name, defByName, uids.next);
		if (!it) return;
		const i = items.findIndex((x) => x.uid === uid);
		items = [...items.slice(0, i + 1), it, ...items.slice(i + 1)];
	}

	// ── Slash-Command ─────────────────────────────────────────────────────────
	// „/" im Prosa-Textarea öffnet das Insert-Menü am Cursor; Tippen filtert,
	// Pfeiltasten/Enter wählen, Auswahl entfernt das „/…" und fügt den Block dahinter
	// ein. Auf Mobile erscheint es als Bottom-Sheet. Editor.js dient nur als Vorbild.
	const mobile = matchesMedia(MOBILE_QUERY);
	let slashOpen = $state(false);
	let slashUid = $state<number | null>(null);
	let slashQuery = $state('');
	let slashActive = $state(0);
	let slashX = $state(0);
	let slashY = $state(0);
	let slashEl: HTMLTextAreaElement | null = null;
	let slashStart = 0;

	const slashFiltered = $derived(
		slashOpen
			? paletteItems.filter((i) => i.label.toLowerCase().includes(slashQuery.trim().toLowerCase()))
			: []
	);

	function closeSlash() {
		slashOpen = false;
		slashUid = null;
		slashEl = null;
		slashQuery = '';
		slashActive = 0;
	}
	function updateSlash(it: Item, el: HTMLTextAreaElement) {
		const caret = el.selectionStart ?? 0;
		const hit = readSlash(el.value, caret);
		if (hit) {
			slashUid = it.uid;
			slashEl = el;
			slashStart = hit.start;
			slashQuery = hit.query;
			slashActive = 0;
			if (!mobile.value) {
				const c = caretPixel(el, caret);
				slashX = c.left;
				slashY = c.top + c.height + 4;
			}
			slashOpen = true;
		} else if (slashUid === it.uid) {
			closeSlash();
		}
	}
	function onProseKeydown(it: Item, e: KeyboardEvent) {
		if (!slashOpen || slashUid !== it.uid) return;
		const n = slashFiltered.length;
		if (e.key === 'ArrowDown') {
			e.preventDefault();
			slashActive = cycleIndex(slashActive, n, 1);
		} else if (e.key === 'ArrowUp') {
			e.preventDefault();
			slashActive = cycleIndex(slashActive, n, -1);
		} else if (e.key === 'Enter') {
			if (n) {
				e.preventDefault();
				pickSlash(slashFiltered[slashActive].name);
			}
		} else if (e.key === 'Escape') {
			e.preventDefault();
			closeSlash();
		} else if (
			e.key === 'ArrowLeft' ||
			e.key === 'ArrowRight' ||
			e.key === 'Home' ||
			e.key === 'End'
		) {
			closeSlash();
		}
	}
	function pickSlash(name: string) {
		const el = slashEl;
		const uid = slashUid;
		if (el && uid !== null) {
			const it = items.find((x) => x.uid === uid);
			const caret = el.selectionStart ?? el.value.length;
			if (it) setProse(it, el.value.slice(0, slashStart) + el.value.slice(caret));
			insertAfterWith(uid, name);
		}
		closeSlash();
	}
	function scheduleCloseSlash() {
		// Verzögert schließen, damit ein Klick aufs Menü noch greift (Blur außerhalb).
		setTimeout(() => closeSlash(), 120);
	}
	function remove(uid: number) {
		const i = items.findIndex((x) => x.uid === uid);
		if (i < 0) return;
		const removed = items[i];
		items = items.filter((x) => x.uid !== uid);
		toast?.add('Element gelöscht', removed.label, 6000, {
			label: 'Rückgängig',
			run: () => {
				const at = Math.min(i, items.length);
				items = [...items.slice(0, at), removed, ...items.slice(at)];
			}
		});
	}
	const canMoveUp = (i: number) => i > 0 && items[i].movable && items[i - 1].movable;
	const canMoveDown = (i: number) =>
		i < items.length - 1 && items[i].movable && items[i + 1].movable;
	function move(i: number, dir: -1 | 1) {
		const j = i + dir;
		if (j < 0 || j >= items.length || !items[i].movable || !items[j].movable) return;
		const next = [...items];
		[next[i], next[j]] = [next[j], next[i]];
		items = next;
	}

	// ── Drag & Drop (native HTML5, via use:blockDnd). ↑/↓ bleibt Tastatur-/A11y-Weg. ──
	// Die Mechanik (dragstart/over/drop + Positions-Mathematik) lebt in der Action;
	// hier bleiben nur Anzeige-State (Drop-Linie via class:) + die Datenmutation.
	let dragUid = $state<number | null>(null);
	let dragOverUid = $state<number | null>(null);
	let dragPos = $state<'before' | 'after'>('before');
	let dragOverEnd = $state(false);
	function reorder(fromUid: number, toUid: number, pos: 'before' | 'after') {
		if (fromUid === toUid) return;
		const from = items.findIndex((x) => x.uid === fromUid);
		const to = items.findIndex((x) => x.uid === toUid);
		// Nur bewegliche Blöcke tauschen; Struktur-Inseln (gepinnt) bleiben unberührt.
		if (from < 0 || to < 0 || !items[from].movable || !items[to].movable) return;
		const next = [...items];
		const [moved] = next.splice(from, 1);
		let at = next.findIndex((x) => x.uid === toUid);
		if (pos === 'after') at += 1;
		next.splice(at, 0, moved);
		items = next;
	}
	function dropAtEnd() {
		if (dragUid === null) return;
		const from = items.findIndex((x) => x.uid === dragUid);
		if (from >= 0 && items[from].movable) {
			const next = [...items];
			const [moved] = next.splice(from, 1);
			next.push(moved);
			items = next;
		}
	}

	// P5: Block duplizieren — die Kopie ist immer ein „neuer" Block hinter dem Original.
	const canDuplicate = (it: Item) => it.blockKind !== 'structural' && it.blockKind !== 'protected';
	function duplicate(uid: number) {
		const i = items.findIndex((x) => x.uid === uid);
		if (i < 0) return;
		const copy = cloneItem(items[i], defByName, uids.next);
		if (!copy) return;
		items = [...items.slice(0, i + 1), copy, ...items.slice(i + 1)];
	}
	function setComp(it: Item, key: string, value: string | boolean) {
		it.compValues = { ...it.compValues, [key]: value };
		it.touched = true;
	}
	function setProse(it: Item, value: string) {
		it.prose = value;
		it.touched = true;
	}

	// Der Body-H1 vieler Bestandsseiten ist `# {title}` — er interpoliert das
	// (editierbare) Frontmatter-Feld `title`. Meist ist die Zeile in den
	// strukturellen Kopf-Block geglued (svelte:head + script + `# {title}`),
	// selten ein eigener Block. Beide Male wirkt sie gesperrt, obwohl ihr Inhalt
	// oben im Frontmatter bearbeitbar ist — wir weisen darauf hin. Matcht die
	// Zeile IRGENDWO im Block-Inhalt (Kopf-Block) wie auch alleinstehend.
	const TITLE_HEADING = /(^|\n)\s*#{1,6}\s+\{\s*title\s*\}\s*(\n|$)/;
	// Rohe `<img>`-Insel bearbeiten: nur das eine Attribut im Tag ersetzen/ergänzen,
	// den Rest des Tags verbatim lassen (round-trip-sicher, bleibt `<img>`).
	function setImgAttr(it: Item, attr: 'src' | 'alt', value: string) {
		it.content = withImgAttr(it.content ?? '', attr, value);
		it.touched = true;
	}

	// ── Container-Kinder ──────────────────────────────────────────────────────
	function addChild(it: Item) {
		const def = defByName(it.childPick ?? '');
		if (!def) return;
		const values: Record<string, string | boolean> = {};
		for (const p of def.props) values[p.key] = p.default;
		const child: ChildItem = {
			uid: uids.next(),
			name: def.name,
			label: def.label,
			props: def.props,
			values,
			fieldsOpen: true
		};
		it.children = [...(it.children ?? []), child];
		it.touched = true;
	}
	function removeChild(it: Item, cuid: number) {
		const kids = it.children ?? [];
		const ci = kids.findIndex((c) => c.uid === cuid);
		if (ci < 0) return;
		const removed = kids[ci];
		it.children = kids.filter((c) => c.uid !== cuid);
		it.touched = true;
		toast?.add('Element gelöscht', removed.label, 6000, {
			label: 'Rückgängig',
			run: () => {
				const cur = it.children ?? [];
				const at = Math.min(ci, cur.length);
				it.children = [...cur.slice(0, at), removed, ...cur.slice(at)];
				it.touched = true;
			}
		});
	}
	function moveChild(it: Item, ci: number, dir: -1 | 1) {
		const kids = [...(it.children ?? [])];
		const j = ci + dir;
		if (j < 0 || j >= kids.length) return;
		[kids[ci], kids[j]] = [kids[j], kids[ci]];
		it.children = kids;
		it.touched = true;
	}
	function setChildProp(it: Item, cuid: number, key: string, value: string | boolean) {
		it.children = (it.children ?? []).map((c) =>
			c.uid === cuid ? { ...c, values: { ...c.values, [key]: value } } : c
		);
		it.touched = true;
	}

	const payload = $derived(
		JSON.stringify({
			fields: Object.fromEntries(fieldState.map((f) => [f.key, f.value])),
			blocks: serializeBlocks(items)
		})
	);

	// Save-Feedback über die vorhandene Toast-Message. Nach Erfolg den Client-State
	// aus dem frischen Server-Stand neu aufbauen (frische Segment-Indizes; eingefügte
	// Blöcke sind dann „existing" → kein Doppel-Insert beim nächsten Speichern).
	// ── V1: Validierung — Fehler je Block/Kind, Summe blockiert das Speichern. ──
	const tokens = $derived((data.colorTokens ?? []) as string[]);
	function itemErrors(it: Item): Record<string, string> {
		if (it.blockKind !== 'component' && it.blockKind !== 'container') return {};
		return validateValues(it.compProps ?? [], it.compValues ?? {}, tokens);
	}
	function childErrors(c: ChildItem): Record<string, string> {
		return validateValues(c.props, c.values, tokens);
	}
	const errorCount = $derived(
		items.reduce(
			(n, it) =>
				n +
				countErrors(itemErrors(it)) +
				(it.children ?? []).reduce((m, c) => m + countErrors(childErrors(c)), 0),
			0
		)
	);

	// Start-Zustand der Eigenschaften-Panels: Blöcke/Kinder mit Validierungsfehlern
	// klappen auf, der Rest bleibt zu — danach entscheidet ALLEIN der Nutzer
	// (bind:open). Vorher war `open` berechnet: Das Panel klappte mitten im Tippen
	// zu, sobald der letzte Fehler behoben war.
	function initFieldsOpen(list: Item[]) {
		for (const it of list) {
			if (countErrors(itemErrors(it)) > 0) it.fieldsOpen = true;
			for (const c of it.children ?? []) if (countErrors(childErrors(c)) > 0) c.fieldsOpen = true;
		}
	}
	initFieldsOpen(untrack(() => items));

	const handleSubmit: SubmitFunction = ({ cancel }) => {
		if (errorCount > 0) {
			cancel();
			toast?.add(
				'Nicht gespeichert',
				`${errorCount} ${errorCount === 1 ? 'Feld ist' : 'Felder sind'} ungültig — bitte die rot markierten Felder prüfen.`
			);
			return;
		}
		return async ({ result, update }) => {
			await update({ reset: false });
			if (result.type === 'success') {
				toast?.add('Gespeichert', 'Die Änderungen wurden übernommen.');
				items = data.segments.map((s) => itemFromSegment(s, uids.next));
				initFieldsOpen(items);
				fieldState = data.fields.map((f) => ({ ...f }));
				savedPayload = payload;
				history.clearDraft();
			} else if (result.type === 'failure') {
				const msg = (result.data as { message?: string } | undefined)?.message;
				toast?.add('Nicht gespeichert', msg ?? 'Unbekannter Fehler.');
			} else if (result.type === 'error') {
				toast?.add('Fehler', result.error?.message ?? 'Speichern fehlgeschlagen.');
			}
		};
	};

	// ── P4: Dirty-Tracking + Save-Bar ─────────────────────────────────────────
	// `payload` ist die kanonische Beschreibung des Editor-Stands; ein Snapshot beim
	// Laden/Speichern macht „dirty" zu einem einfachen String-Vergleich (fängt auch
	// reine Umsortierung). Der Zähler daneben ist die menschenlesbare Näherung.
	let formEl = $state<HTMLFormElement | null>(null);
	let savedPayload = $state(untrack(() => payload));
	const dirty = $derived(payload !== savedPayload);
	const dirtyCount = $derived(
		items.filter((x) => x.touched || x.source === 'new').length +
			Math.max(0, data.segments.length - items.filter((x) => x.source === 'existing').length) +
			fieldState.filter((f, fi) => f.value !== data.fields[fi]?.value).length
	);
	function discard() {
		items = data.segments.map((s) => itemFromSegment(s, uids.next));
		initFieldsOpen(items);
		fieldState = data.fields.map((f) => ({ ...f }));
		closeSlash();
		history.clearDraft();
	}
	function onGlobalKeydown(e: KeyboardEvent) {
		const key = e.key.toLowerCase();
		const inField = (e.target as HTMLElement | null)?.matches?.(
			'input, textarea, select, [contenteditable]'
		);
		// ⌘S liegt jetzt im <Dialog shortcut="cmd+s"> (ein window-Listener dort) —
		// hier bleiben nur die block-spezifischen Shortcuts.
		// ⌘Z/⇧⌘Z: Block-History — in Textfeldern gilt weiter das native Text-Undo.
		if ((e.metaKey || e.ctrlKey) && key === 'z' && !inField) {
			e.preventDefault();
			if (e.shiftKey) history.redo();
			else history.undo();
			return;
		}
		// ⇧⌘D: fokussierten Block duplizieren (statt Browser-Bookmark).
		if ((e.metaKey || e.ctrlKey) && e.shiftKey && key === 'd') {
			if (activeUid !== null) {
				e.preventDefault();
				duplicate(activeUid);
			}
			return;
		}
		// ⌥⇧↑/↓: fokussierten Block verschieben.
		if (e.altKey && e.shiftKey && (e.key === 'ArrowUp' || e.key === 'ArrowDown')) {
			const i = items.findIndex((x) => x.uid === activeUid);
			if (i >= 0) {
				e.preventDefault();
				move(i, e.key === 'ArrowUp' ? -1 : 1);
			}
		}
	}
	function onBeforeUnload(e: BeforeUnloadEvent) {
		if (!dirty) return;
		e.preventDefault();
	}

	// ── Undo/Redo + lokaler Entwurf → ../core/editor-history ──────────────────
	// Debounced Snapshots des gesamten Editor-Stands (Blöcke + Frontmatter): ⌘Z
	// läuft über den Stack; parallel wandert derselbe Snapshot als Entwurf in
	// localStorage und überlebt Tab-Crash/Schließen. Ein Entwurf gilt nur, solange
	// die Datei unverändert ist (base === savedPayload) — sonst verfällt er still.
	// Stacks/Timer/Draft-Storage kapselt EditorHistory; hier bleibt nur der
	// Snapshot-Bauer + der host-spezifische Apply-Callback (Items/Frontmatter setzen).
	type Snapshot = { items: Item[]; fields: { key: string; value: string }[] };
	const snap = (): Snapshot =>
		$state.snapshot({ items, fields: fieldState }) as unknown as Snapshot;
	let activeUid = $state<number | null>(null);

	const history = new EditorHistory<Snapshot>({
		draftKey: `brand-cms-draft:${data.url}`,
		apply: (s) => {
			// $state.snapshot löst Reactive-Proxies — structuredClone allein würde daran
			// mit DataCloneError scheitern; die Kombination liefert eine frische Kopie.
			const plain = structuredClone($state.snapshot(s)) as unknown as Snapshot;
			items = plain.items;
			fieldState = plain.fields;
			// uid-Kollisionen mit künftigen Einfügungen vermeiden (Entwurf aus früherer Session).
			const maxUid = Math.max(
				0,
				...plain.items.flatMap((it) => [it.uid, ...(it.children ?? []).map((c) => c.uid)])
			);
			uids.ensureAbove(maxUid);
			closeSlash();
		}
	});
	history.seed(snap());

	// Fokus-Tracking für Block-Shortcuts (⇧⌘D, ⌥⇧↑/↓): merkt sich den Block,
	// in dem zuletzt ein Feld/Button fokussiert war.
	function onBlocksFocusin(e: FocusEvent) {
		const li = (e.target as HTMLElement).closest('[data-uid]');
		activeUid = li ? Number(li.getAttribute('data-uid')) : null;
	}

	// Jede inhaltliche Änderung debounced auf den Undo-Stack + als Entwurf sichern.
	$effect(() => {
		void payload; // Abhängigkeit: jede inhaltliche Änderung
		history.schedule(snap, { dirty, base: savedPayload });
	});

	// Einmalig beim Laden: passenden Entwurf anbieten (nur wenn Datei unverändert).
	$effect(() => {
		history.offerDraft(
			untrack(() => savedPayload),
			untrack(snap)
		);
	});
</script>

<svelte:head><title>{data.title} bearbeiten – Admin</title></svelte:head>
<svelte:window onkeydown={onGlobalKeydown} onbeforeunload={onBeforeUnload} />

{#snippet errorChip()}
	<span class="savebar-err">{errorCount} {errorCount === 1 ? 'Feld' : 'Felder'} prüfen</span>
{/snippet}

<div class="edit">
	<nav class="crumb"><a href={data.backHref}>← {data.backLabel}</a></nav>
	<h1>
		{data.title}{#if !data.writable}<span class="ro-chip">Nur lesen</span>{/if}
	</h1>
	<p class="sub">
		Bearbeitet <code>{data.url}/+page.svx</code>. Frontmatter &amp; Markdown-Prosa sind editierbar;
		Svelte-Inseln sind geschützt.
	</p>

	<!-- Save-/Fehler-Rückmeldung läuft über die Toast-Message (siehe handleSubmit). -->
	{#if !data.writable}
		<p class="flash flash--warn">
			Nur-Lese-Vorschau: Schreiben ist im Prod-Modus deaktiviert (Phase 2b: GitHub-PR).
		</p>
	{/if}
	{#if data.bodyLocked}
		<p class="flash flash--warn">
			Konservativer Modus: Der Body dieser Seite ließ sich nicht sicher in Prosa/Inseln zerlegen —
			daher ist nur das Frontmatter editierbar, der Body bleibt komplett geschützt.
		</p>
	{/if}

	{#if history.draft}
		<div class="flash flash--draft" role="status">
			<span
				>Ungespeicherter Entwurf von {new Date(history.draft.at).toLocaleTimeString('de-DE', {
					hour: '2-digit',
					minute: '2-digit'
				})}&nbsp;Uhr gefunden.</span
			>
			<Button size="sm" variant="ghost" onclick={() => history.applyDraft()}
				>Wiederherstellen</Button
			>
			<Button size="sm" variant="quiet" onclick={() => history.dismissDraft()}>Verwerfen</Button>
		</div>
	{/if}

	<form method="POST" action="?/save" bind:this={formEl} use:enhance={handleSubmit}>
		<input type="hidden" name="payload" value={payload} />

		{#if fieldState.length}
			<section class="block">
				<h2 class="block-title">Frontmatter</h2>
				{#each fieldState as field (field.key)}
					<label class="frontmatter-field">
						<span class="frontmatter-field__label">{field.key}</span>
						<Field density="compact" bind:value={field.value} />
					</label>
				{/each}
			</section>
		{/if}

		<section class="block">
			<h2 class="block-title">Inhalt</h2>

			{#if data.bodyLocked}
				<p class="media-hint">
					Body im konservativen Modus geschützt — nur Frontmatter editierbar.
				</p>
			{:else}
				{#if !data.hasScript}
					<p class="media-hint">
						Kein <code>&lt;script&gt;</code>-Block — es lassen sich nur Bilder einfügen (Komponenten
						brauchen einen Import).
					</p>
				{/if}

				{#snippet blockTools(i: number, it: Item)}
					<div class="block-card__tools">
						<ButtonGroup attached label="Reihenfolge">
							<IconActionButton
								subtle
								disabled={!canMoveUp(i)}
								onclick={() => move(i, -1)}
								ariaLabel="nach oben"
								title="nach oben"><Icon name="arrow-up" /></IconActionButton
							>
							<IconActionButton
								subtle
								disabled={!canMoveDown(i)}
								onclick={() => move(i, 1)}
								ariaLabel="nach unten"
								title="nach unten"><Icon name="arrow-down" /></IconActionButton
							>
						</ButtonGroup>
						{#if canDuplicate(it)}
							<IconActionButton
								subtle
								onclick={() => duplicate(it.uid)}
								ariaLabel="Duplizieren"
								title="Duplizieren"><Icon name="duplicate" /></IconActionButton
							>
						{/if}
						{#if it.deletable}
							<IconActionButton
								subtle
								tone="danger"
								onclick={() => remove(it.uid)}
								ariaLabel="Löschen"
								title="Löschen"><Icon name="trash" /></IconActionButton
							>
						{/if}
					</div>
				{/snippet}

				<!-- svelte-ignore a11y_no_noninteractive_element_interactions — focusin ist passives Tracking für Shortcuts -->
				<!-- use:blockDnd bündelt die native Drag-Mechanik (Reorder bleibt hier);
				     die Drop-Linie rendert der Host über die class:-Bindungen unten. -->
				<ol
					class="blocks"
					onfocusin={onBlocksFocusin}
					use:blockDnd={{
						onMove: reorder,
						onDrag: (u) => (dragUid = u),
						onOver: (u, p) => {
							dragOverUid = u;
							dragPos = p;
						}
					}}
				>
					{#each items as it, i (it.uid)}
						{@const errs = itemErrors(it)}
						{@const errTotal =
							countErrors(errs) +
							(it.children ?? []).reduce((m, c) => m + countErrors(childErrors(c)), 0)}
						<li
							class="block-card block-card--{it.blockKind}"
							data-uid={it.uid}
							data-movable={it.movable}
							class:block-card--invalid={errTotal > 0}
							class:block-card--dragover-before={dragOverUid === it.uid &&
								dragUid !== it.uid &&
								dragPos === 'before'}
							class:block-card--dragover-after={dragOverUid === it.uid &&
								dragUid !== it.uid &&
								dragPos === 'after'}
							class:block-card--dragging={dragUid === it.uid}
						>
							<!-- Linke Gutter-Spalte (Notion/TipTap-Stil): „+" (einfügen danach) und der
							     Drag-Griff erscheinen bei Hover; gezogen wird am Griff (data-drag-handle).
							     Barrierefreier Reorder bleibt über die ↑/↓-Buttons im Kopf. -->
							<div class="block-card__gutter">
								{#if it.blockKind !== 'structural'}
									<InsertMenu
										items={paletteItems}
										onpick={(name) => insertAfterWith(it.uid, name)}
										compact
									/>
								{/if}
								{#if it.movable}
									<!-- Griff als IconActionButton (subtle). Bewusst `aria-hidden` +
									     `tabindex={-1}`: der barrierefreie Reorder-Weg sind die ↑/↓-Buttons
									     im Kopf — ein fokussierbarer Griff wäre ein toter Fokus-Stop, da
									     HTML5-Drag per Tastatur nicht bedienbar ist. `title` läuft trotzdem
									     über das Tooltip-Prop: der Hover-Tooltip bleibt sichtbar, der
									     Fokus-Pfad entfällt mangels Fokussierbarkeit. -->
									<IconActionButton
										subtle
										class="drag-handle"
										draggable="true"
										data-drag-handle
										title="Ziehen zum Sortieren"
										tabindex={-1}
										aria-hidden="true"><Icon name="grip" /></IconActionButton
									>
								{/if}
							</div>

							<div class="block-card__main">
								<div class="block-card__head">
									<span class="block-card__label"
										>{it.label}{it.source === 'new' ? ' · neu' : ''}</span
									>
									{#if it.blockKind === 'structural'}
										<span class="tech-chip">automatisch verwaltet</span>
									{/if}
									{#if errTotal > 0}
										<span class="err-chip" title="Ungültige Felder">{errTotal} Fehler</span>
									{/if}
									{#if it.blockKind !== 'structural'}
										{@render blockTools(i, it)}
									{/if}
								</div>
								<div class="block-card__body">
									{#if it.blockKind === 'prosa'}
										<ProseEditor
											value={it.prose}
											oninput={(v, el) => {
												setProse(it, v);
												updateSlash(it, el);
											}}
											onkeydown={(e) => onProseKeydown(it, e)}
											onblur={scheduleCloseSlash}
										/>
									{:else if it.blockKind === 'component'}
										<BlockPreview
											name={it.compName ?? ''}
											values={it.compValues ?? {}}
											props={it.compProps ?? []}
										/>
										<FieldsPanel
											props={it.compProps ?? []}
											values={it.compValues ?? {}}
											errors={errs}
											media={data.media}
											uploadable={data.writable}
											{tokens}
											open={it.fieldsOpen}
											onToggle={(o) => (it.fieldsOpen = o)}
											set={(key, v) => setComp(it, key, v)}
										/>
									{:else if it.blockKind === 'container'}
										<BlockPreview
											name={it.compName ?? ''}
											values={it.compValues ?? {}}
											props={it.compProps ?? []}
											childCount={(it.children ?? []).length}
										/>
										{#if (it.compProps ?? []).length}
											<FieldsPanel
												label="Einstellungen"
												props={it.compProps ?? []}
												values={it.compValues ?? {}}
												errors={errs}
												media={data.media}
												uploadable={data.writable}
												{tokens}
												open={it.fieldsOpen}
												onToggle={(o) => (it.fieldsOpen = o)}
												set={(key, v) => setComp(it, key, v)}
											/>
										{/if}
										<div class="children">
											<span class="children-lbl">Elemente</span>
											{#each it.children ?? [] as child, ci (child.uid)}
												{@const cerrs = childErrors(child)}
												<div class="child" class:child--invalid={countErrors(cerrs) > 0}>
													<div class="child-bar">
														<span class="block-card__ico block-card__ico--sm"
															><Icon name={iconFor(child.name)} /></span
														>
														<span class="child-label">{child.label}</span>
														<div class="block-card__tools">
															<ButtonGroup attached label="Reihenfolge">
																<IconActionButton
																	subtle
																	disabled={ci === 0}
																	onclick={() => moveChild(it, ci, -1)}
																	ariaLabel="nach oben"
																	title="nach oben"><Icon name="arrow-up" /></IconActionButton
																>
																<IconActionButton
																	subtle
																	disabled={ci === (it.children?.length ?? 0) - 1}
																	onclick={() => moveChild(it, ci, 1)}
																	ariaLabel="nach unten"
																	title="nach unten"><Icon name="arrow-down" /></IconActionButton
																>
															</ButtonGroup>
															<IconActionButton
																subtle
																tone="danger"
																onclick={() => removeChild(it, child.uid)}
																ariaLabel="Löschen"
																title="Löschen"><Icon name="trash" /></IconActionButton
															>
														</div>
													</div>
													<div class="child-body">
														<BlockPreview
															name={child.name}
															values={child.values}
															props={child.props}
														/>
														<FieldsPanel
															props={child.props}
															values={child.values}
															errors={cerrs}
															media={data.media}
															uploadable={data.writable}
															{tokens}
															open={child.fieldsOpen}
															onToggle={(o) => (child.fieldsOpen = o)}
															set={(key, v) => setChildProp(it, child.uid, key, v)}
														/>
													</div>
												</div>
											{/each}
											{#if (it.childTypes ?? []).length}
												<div class="add-child">
													<Select
														class="add-child__select"
														density="compact"
														bind:value={it.childPick}
														aria-label="Element-Typ"
													>
														{#each it.childTypes ?? [] as ct (ct)}
															<option value={ct}>{defByName(ct)?.label ?? ct}</option>
														{/each}
													</Select>
													<Button dashed size="sm" onclick={() => addChild(it)}>+ Element</Button>
												</div>
											{/if}
										</div>
									{:else if it.blockKind === 'img'}
										<!-- Rohe <img>-Insel: Bild via MediaPicker wechseln + Alt-Text
										     bearbeiten. Bleibt beim Speichern ein <img>-Tag (kein Umbau zur
										     Image-Komponente); unverändert ist der Rebuild byte-identisch. -->
										<div class="block-card__image-fields">
											<label class="block-card__image-field">
												<span class="block-card__image-label">Bild</span>
												<MediaPicker
													value={imgSrc(it.content ?? '')}
													media={data.media}
													kind="image"
													uploadable={data.writable}
													set={(v) => setImgAttr(it, 'src', v)}
												/>
											</label>
											<label class="block-card__image-field">
												<span class="block-card__image-label">Alt-Text</span>
												<Field
													class="block-card__image-alt"
													density="compact"
													value={imgAlt(it.content ?? '')}
													placeholder="Bildbeschreibung eingeben …"
													oninput={(e) => setImgAttr(it, 'alt', e.currentTarget.value)}
												/>
											</label>
										</div>
									{:else}
										{#if it.blockKind === 'structural'}
											<p class="tech-hint">
												Technischer Seitenkopf — wird vom System gepflegt.{#if TITLE_HEADING.test(it.content ?? '')}{' '}Die
													sichtbare Seiten-Überschrift kommt aus dem <strong>Titel</strong>-Feld
													oben im
													<strong>Frontmatter</strong>.{:else}{' '}Erscheint nicht als Inhalt auf
													der Seite.{/if}
											</p>
										{:else if TITLE_HEADING.test(it.content ?? '')}
											<p class="tech-hint">
												Überschrift der Seite — wird oben im Abschnitt <strong>Frontmatter</strong>
												über das <strong>Titel</strong>-Feld bearbeitet.
											</p>
										{/if}
										<details class="block-card__details">
											<summary class="block-card__summary">Code anzeigen</summary>
											<pre class="block-card__code"><code>{it.content}</code></pre>
										</details>
									{/if}
								</div>
							</div>
						</li>
					{/each}
				</ol>

				{#if dragUid !== null}
					<div
						class="drop-end"
						class:drop-end--over={dragOverEnd}
						role="presentation"
						use:blockDropEnd={{ onOver: (a) => (dragOverEnd = a), onDrop: dropAtEnd }}
					>
						ans Ende
					</div>
				{/if}

				{#if items.every((x) => x.blockKind === 'structural' || x.blockKind === 'protected')}
					<!-- „Leer" heißt: keine editierbaren Inhalts-Blöcke (Struktur-Inseln wie
					     der Head zählen nicht — sonst erschiene der Empty-State nie). -->
					<div class="empty-state">
						<p class="empty-title">Noch keine Inhalte auf dieser Seite.</p>
						<p class="empty-hint">
							Starte mit einem Textblock (dort fügt „/" weitere Blöcke ein) — oder wähle direkt eine
							Komponente.
						</p>
						<div class="empty-actions">
							<Button variant="ghost" onclick={() => insertType('Prose')}>Textblock beginnen</Button
							>
							<InsertMenu items={paletteItems} onpick={insertType} label="Element einfügen" />
						</div>
					</div>
				{/if}
			{/if}
		</section>

		<Dialog
			open={dirty}
			message={dirtyCount > 0
				? `${dirtyCount} ungespeicherte Änderung${dirtyCount === 1 ? '' : 'en'}`
				: 'Reihenfolge geändert'}
			extra={errorCount > 0 ? errorChip : undefined}
			primaryDisabled={!data.writable || errorCount > 0}
			primaryTitle="Bitte zuerst die rot markierten Felder korrigieren"
			onprimary={() => formEl?.requestSubmit()}
			onsecondary={discard}
			shortcut="cmd+s"
		/>
	</form>

	{#if slashOpen}
		<SlashMenu
			items={slashFiltered}
			activeIndex={slashActive}
			x={slashX}
			y={slashY}
			onpick={pickSlash}
			onhover={(i) => (slashActive = i)}
			onclose={closeSlash}
		/>
	{/if}
</div>

<style>
	.edit {
		max-width: 52rem;
		margin: 0 auto;
		/* unten Luft für die schwebende Save-Bar */
		padding: var(--z-ds-space-xl) var(--z-ds-space-l) 7rem;
	}
	.crumb {
		margin-bottom: var(--z-ds-space-m);
	}
	.crumb a {
		color: var(--ds-text-muted);
		text-decoration: none;
		font-size: var(--ds-text-sm);
	}
	.sub {
		color: var(--ds-text-muted);
		margin-bottom: var(--z-ds-space-l);
	}
	.flash {
		padding: var(--z-ds-space-s) var(--z-ds-space-m);
		border-radius: var(--ds-radius-sm);
		margin-bottom: var(--z-ds-space-l);
		font-size: var(--ds-text-sm);
	}
	.flash--warn {
		background: rgb(from var(--ds-warning) r g b / 0.15);
		color: var(--ds-text);
	}
	/* Entwurf-Banner (localStorage-Autosave): Wiederherstellen/Verwerfen. */
	.flash--draft {
		display: flex;
		align-items: center;
		gap: var(--z-ds-space-s);
		flex-wrap: wrap;
		background: rgb(from var(--ds-accent) r g b / 0.1);
		color: var(--ds-text);
	}
	.block {
		margin-bottom: var(--z-ds-space-xl);
	}
	.block-title {
		font-size: var(--ds-text-sm);
		text-transform: uppercase;
		letter-spacing: var(--ds-label-tracking);
		color: var(--ds-text-muted);
		border-bottom: 1px solid var(--ds-border-soft);
		padding-bottom: var(--z-ds-space-xs);
		margin-bottom: var(--z-ds-space-m);
	}
	/* Frontmatter-Zeile: Label über dem Field-Atom. Die Klasse darf NICHT `.field`
	   heißen — `field-base.css` definiert `.field` global (Rahmen/Fläche/Fokus-Ring),
	   das Label bekäme sonst eine zweite Feld-Box um die eigentliche. */
	.frontmatter-field {
		display: block;
		margin: 0 0 var(--z-ds-space-l);
	}
	.frontmatter-field__label {
		display: block;
		font-size: var(--ds-label-size);
		text-transform: uppercase;
		letter-spacing: var(--ds-label-tracking);
		font-weight: 600;
		color: var(--ds-text-muted);
		margin-bottom: var(--z-ds-space-xs);
	}
	.media-lbl {
		margin: 0;
	}
	.media-hint {
		font-size: var(--ds-text-xs);
		color: var(--ds-text-muted);
		margin: 0 0 var(--z-ds-space-l);
	}
	/* Rohe <img>-Insel: gestapelte Editierfelder (Bild-Picker + Alt-Text), Optik wie
	   die übrigen Block-Card-Felder (Label 12px muted oben, Control volle Breite). */
	.block-card__image-fields {
		display: flex;
		flex-direction: column;
		gap: var(--z-ds-space-s);
	}
	.block-card__image-field {
		display: flex;
		flex-direction: column;
		gap: var(--z-ds-space-4, 4px);
		margin: 0;
	}
	.block-card__image-label {
		font-size: var(--ds-text-xs);
		color: var(--ds-text-muted);
		line-height: 1.3;
	}
	/* P3: Kind-Karten — Vorschau + Aufklapp-Felder wie auf Top-Level. */
	.child-body {
		display: flex;
		flex-direction: column;
		gap: var(--z-ds-space-6);
		padding: var(--z-ds-space-8) var(--z-ds-space-8) var(--z-ds-space-8);
	}
	.block-card__ico--sm {
		width: 1.25rem;
		height: 1.25rem;
		font-size: 0.8rem;
	}
	/* P4: schwebende Save-Bar → ui/dialog (Dialog variant="bar"); Optik lebt dort.
	   Der Fehler-Chip (.savebar-err) wird als `extra`-Snippet in den Dialog gereicht
	   und bleibt darum hier gestylt (Snippet-Markup = Eltern-Scope). */
	.ro-chip {
		display: inline-block;
		vertical-align: middle;
		margin-left: var(--z-ds-space-s);
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

	/* Block-Liste (WYSIWYG) */
	.blocks {
		list-style: none;
		margin: 0;
		padding: 0;
		display: flex;
		flex-direction: column;
		gap: 14px; /* Blockabstand aus der Figma-Vorlage */
	}
	/* Notion/TipTap-Stil: Blöcke bündig mit dem Content-Container; die Gutter-
	   Controls (+/Griff) schweben links AUSSERHALB und erscheinen bei Hover. */
	.block-card {
		position: relative;
		display: block;
		border-radius: var(--ds-radius-sm);
	}
	.block-card--protected {
		opacity: 0.8;
	}
	/* Struktur-Blöcke (z. B. Head): technisch, nicht editierbar — bewusst anders als
	   die Inhalts-Karten: gestrichelte Kontur statt Fläche, Chip + Erklärtext. */
	.block-card--structural > .block-card__main {
		border: 1px dashed var(--ds-border);
		border-radius: var(--ds-radius, 8px);
		padding: 8px 12px;
	}
	.block-card--structural .block-card__head {
		min-height: 0;
	}
	.tech-chip {
		font-size: var(--ds-text-xs);
		color: var(--ds-text-muted);
		border: 1px solid var(--ds-border-soft);
		border-radius: 999px;
		padding: 1px var(--z-ds-space-8);
		white-space: nowrap;
	}
	.tech-hint {
		margin: var(--z-ds-space-6) 0 0;
		font-size: var(--ds-text-xs);
		color: var(--ds-text-muted);
	}
	.empty-actions {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: var(--z-ds-space-s);
	}
	/* Drag & Drop: gezogener Block gedimmt, Drop-Ziel mit deutlicher Accent-Linie
	   in der Lücke ober- bzw. unterhalb (Position folgt der Cursor-Hälfte). */
	.block-card--dragging {
		opacity: 0.35;
	}
	.block-card--dragover-before::before,
	.block-card--dragover-after::after {
		content: '';
		position: absolute;
		left: 0;
		right: 0;
		height: 3px;
		border-radius: 999px;
		background: var(--ds-accent);
		box-shadow: 0 0 0 3px rgb(from var(--ds-accent) r g b / 0.22);
		pointer-events: none;
	}
	.block-card--dragover-before::before {
		top: -8.5px;
	}
	.block-card--dragover-after::after {
		bottom: -8.5px;
	}
	/* P5: „ans Ende"-Zone, nur während eines Drags sichtbar. */
	.drop-end {
		margin-top: var(--z-ds-space-m);
		padding: var(--z-ds-space-8);
		border: 1px dashed var(--ds-border);
		border-radius: var(--ds-radius-sm);
		text-align: center;
		font-size: var(--ds-text-xs);
		color: var(--ds-text-muted);
	}
	.drop-end--over {
		border-color: var(--ds-accent);
		color: var(--ds-accent);
		background: rgb(from var(--ds-accent) r g b / 0.06);
	}
	/* P5: Empty-State für Seiten ohne Blöcke. */
	.empty-state {
		padding: var(--z-ds-space-xl) var(--z-ds-space-m);
		border: 1px dashed var(--ds-border);
		border-radius: var(--ds-radius, 8px);
		text-align: center;
	}
	.empty-title {
		margin: 0 0 var(--z-ds-space-xs);
		font-weight: 600;
		color: var(--ds-text);
	}
	.empty-hint {
		margin: 0 0 var(--z-ds-space-m);
		font-size: var(--ds-text-sm);
		color: var(--ds-text-muted);
	}
	/* Prosa: gleiche Karten-Behandlung wie die Komponenten (Wunsch 2026-07-10). */

	/* Gutter-Controls (Figma: 24px-Icon-Buttons, radius 4, auf Kopfhöhe der Karte):
	   absolut links AUSSERHALB des Containers, bei Hover/Fokus eingeblendet. */
	.block-card__gutter {
		position: absolute;
		top: 10px;
		left: -3.75rem;
		width: 3.5rem;
		display: inline-flex;
		align-items: center;
		justify-content: flex-end;
		gap: 4px;
		padding-right: 8px;
		opacity: 0;
		transition: opacity var(--ds-dur, 0.15s) var(--ds-ease-out, ease-out);
	}
	@media (max-width: 64rem) {
		.block-card__gutter {
			left: -2.75rem;
			width: 2.5rem;
		}
	}
	.block-card:hover .block-card__gutter,
	.block-card:focus-within .block-card__gutter {
		opacity: 1;
	}
	/* Griff = IconActionButton(subtle); Maß/Hover-Tint kommen aus dem Atom. Hier
	   bleibt nur die Greif-Affordanz — die Klasse hängt am Kind-<button>, darum
	   :global (Muster aus Paket 3/K5). */
	:global(.drag-handle) {
		cursor: grab;
		user-select: none;
	}
	/* Kein :active-Scale am Griff: der Druck-Impuls des Atoms würde in das
	   Drag-Ghost-Bild einfrieren (Snapshot entsteht nach dem mousedown). */
	:global(.drag-handle.drag-handle:active:not(:disabled)) {
		cursor: grabbing;
		transform: none;
	}

	/* Kopfzeile: Typ-Label links, Move/Delete-Tools rechts (bei Hover eingeblendet). */
	.block-card__main {
		min-width: 0;
	}
	.block-card__head {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: var(--z-ds-space-m);
		min-height: 1.4rem;
	}
	.block-card__label {
		font-size: var(--ds-text-xs);
		text-transform: uppercase;
		letter-spacing: var(--ds-label-tracking);
		font-weight: 600;
		color: var(--ds-text-muted);
	}
	.block-card__tools {
		display: flex;
		gap: var(--z-ds-space-6);
		opacity: 0;
		transition: opacity var(--ds-dur, 0.15s) var(--ds-ease-out, ease-out);
	}
	.block-card:hover .block-card__tools,
	.block-card:focus-within .block-card__tools {
		opacity: 1;
	}
	/* Die Werkzeuge sind jetzt ui/IconActionButton (subtle + tone="danger"): Maß,
	   Hover-Tint, disabled-Opacity und Fokus-Ring kommen aus dem Atom, das ↑/↓-Paar
	   fasst ui/ButtonGroup(attached). Hier bleibt nur das Reveal-Layout oben. */
	.block-card__body {
		padding: 2px 0 var(--z-ds-space-s);
	}
	.block-card__code {
		margin: var(--z-ds-space-s) 0 0;
		overflow-x: auto;
		font-size: var(--ds-text-sm);
		color: var(--ds-text-muted);
	}
	/* Ausklappbarer Code-/Head-Block */
	.block-card__details {
		font-size: var(--ds-text-sm);
	}
	.block-card__summary {
		cursor: pointer;
		list-style: none;
		display: inline-flex;
		align-items: center;
		gap: var(--z-ds-space-6);
		font-size: var(--ds-text-xs);
		color: var(--ds-text-muted);
		user-select: none;
	}
	.block-card__summary::-webkit-details-marker {
		display: none;
	}
	.block-card__summary::before {
		content: '▸';
		display: inline-block;
		transition: transform var(--ds-dur, 0.15s) var(--ds-ease-out, ease-out);
	}
	.block-card__details[open] .block-card__summary::before {
		transform: rotate(90deg);
	}
	.block-card__summary:focus-visible {
		outline: 2px solid var(--ds-focus-ring);
		outline-offset: 2px;
	}
	/* „+"-Trigger in der Gutter-Spalte als 24px-Icon-Button (wie der Griff). */
	.block-card__gutter :global(.insert-menu) {
		display: inline-flex;
	}
	.block-card__gutter :global(.trigger) {
		width: 1.5rem;
		height: 1.5rem;
		justify-content: center;
		padding: 0;
		border: none;
		background: none;
		color: var(--ds-text-muted);
		border-radius: var(--ds-radius-sm);
	}
	.block-card__gutter :global(.trigger:hover) {
		background: rgb(from var(--ds-text) r g b / 0.08);
		color: var(--ds-text);
	}
	.block-card__gutter :global(.trigger .plus) {
		font-size: var(--ds-text-md, 1rem);
	}

	/* Container-Kinder (verschachtelte Block-Liste) */
	.children {
		margin-top: var(--z-ds-space-m);
		padding: var(--z-ds-space-s) var(--z-ds-space-m) var(--z-ds-space-m);
		border-left: 2px solid var(--ds-border-soft);
		display: flex;
		flex-direction: column;
		gap: var(--z-ds-space-m);
	}
	.children-lbl {
		font-size: var(--ds-text-xs);
		text-transform: uppercase;
		letter-spacing: var(--ds-label-tracking);
		font-weight: 600;
		color: var(--ds-text-muted);
	}
	.child {
		border: 1px solid var(--ds-border-soft);
		border-radius: var(--ds-radius-sm);
		background: var(--ds-surface);
	}
	.child-bar {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: var(--z-ds-space-s);
		padding: var(--z-ds-space-6) var(--z-ds-space-8);
		border-bottom: 1px solid var(--ds-border-soft);
	}
	.child-label {
		font-size: var(--ds-text-xs);
		font-weight: 600;
		color: var(--ds-text-muted);
	}
	.add-child {
		display: flex;
		gap: var(--z-ds-space-s);
		align-items: center;
	}
	/* Der Typ-Select (Kind-Komponente) wächst, der dashed-Button bleibt schmal. */
	.add-child :global(.add-child__select) {
		flex: 1 1 auto;
		min-width: 0;
	}

	/* ── Karten nach Figma 689:11510: Fläche raised, radius 8, padding 12; Kopf mit
	   Border-bottom (Label 12 bold uppercase, muted) + Tools; Body gestapelte Felder.
	   Kein overflow:hidden — Popover (Media/Token) müssen herausragen dürfen. */
	.block-card--component > .block-card__main,
	.block-card--container > .block-card__main,
	.block-card--img > .block-card__main,
	.block-card--prosa > .block-card__main {
		background: var(--ds-surface-raised, var(--ds-surface));
		border-radius: var(--ds-radius, 8px);
		padding: 12px;
	}
	.block-card--component > .block-card__main > .block-card__head,
	.block-card--container > .block-card__main > .block-card__head,
	.block-card--img > .block-card__main > .block-card__head,
	.block-card--prosa > .block-card__main > .block-card__head {
		justify-content: flex-start;
		gap: var(--z-ds-space-8);
		padding: 0 0 8px;
		border-bottom: 1px solid var(--ds-border);
	}
	/* Tools im Karten-Header dauerhaft sichtbar (klarer als reines Hover). */
	.block-card--component > .block-card__main > .block-card__head .block-card__tools,
	.block-card--container > .block-card__main > .block-card__head .block-card__tools,
	.block-card--img > .block-card__main > .block-card__head .block-card__tools,
	.block-card--prosa > .block-card__main > .block-card__head .block-card__tools {
		opacity: 1;
		margin-left: auto;
	}
	.block-card--component > .block-card__main > .block-card__body,
	.block-card--container > .block-card__main > .block-card__body,
	.block-card--img > .block-card__main > .block-card__body,
	.block-card--prosa > .block-card__main > .block-card__body {
		display: flex;
		flex-direction: column;
		gap: var(--z-ds-space-s);
		padding: 8px 0 0;
	}
	.block-card__ico {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		width: 1.5rem;
		height: 1.5rem;
		flex: none;
		font-size: 0.95rem;
		border-radius: var(--ds-radius-sm);
		background: var(--ds-surface-sunken, var(--ds-surface));
		border: 1px solid var(--ds-border-soft);
	}

	/* Aufklapp-Felder („Eigenschaften bearbeiten") → FieldsPanel.svelte */

	/* V1: Fehler-Zustände — Karte, Kopf-Chip, Zähler-Badge, Save-Bar. */
	.block-card--invalid > .block-card__main {
		box-shadow: inset 0 0 0 1px rgb(from var(--ds-negative, #b91109) r g b / 0.5);
	}
	.err-chip {
		font-size: var(--ds-text-xs);
		font-weight: 600;
		color: var(--ds-negative, #b91109);
		background: rgb(from var(--ds-negative, #b91109) r g b / 0.1);
		border-radius: 999px;
		padding: 1px var(--z-ds-space-8);
		white-space: nowrap;
	}
	.child--invalid {
		border-color: rgb(from var(--ds-negative, #b91109) r g b / 0.5);
	}
	.savebar-err {
		font-size: var(--ds-text-xs);
		font-weight: 600;
		color: var(--ds-negative, #b91109);
		background: rgb(from var(--ds-negative, #b91109) r g b / 0.1);
		border-radius: 999px;
		padding: 2px var(--z-ds-space-s);
		white-space: nowrap;
	}
</style>
