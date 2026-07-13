<script lang="ts">
	import { untrack } from 'svelte';
	import { enhance } from '$app/forms';
	import type { SubmitFunction } from '@sveltejs/kit';
	import { getToastState } from '$stores/toast-state.svelte';
	import { iconFor, CMS_CATEGORIES, type CmsPropDef } from '../core/cms-components';
	import FieldsPanel from '../editor/FieldsPanel.svelte';
	import { Icon } from '$lib/icons/cms';
	import BlockPreview from '../editor/BlockPreview.svelte';
	import ProseEditor from '../editor/ProseEditor.svelte';
	import InsertMenu from '../editor/InsertMenu.svelte';
	import SlashMenu from '../editor/SlashMenu.svelte';
	import { validateValues, countErrors } from '../core/validation';
	import { readSlash } from '../core/slash';
	import { caretPixel } from '../core/caret';
	import { matchesMedia, MOBILE_QUERY } from '../core/media.svelte';
	import { cycleIndex } from '../core/cycle';

	let { data }: import('./$types').PageProps = $props();

	const toast = getToastState();

	let fieldState = $state(data.fields.map((f) => ({ ...f })));

	// Palette: Pseudo-Typ „Bild" (bare img-natural) + die registrierten Komponenten.
	type Def = {
		name: string;
		label: string;
		props: CmsPropDef[];
		container?: boolean;
		childTypes?: string[];
		category?: string;
	};
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

	// Ein Container-Kind (registrierte Leaf-Komponente) mit stabiler uid.
	interface ChildItem {
		uid: number;
		name: string;
		label: string;
		props: CmsPropDef[];
		values: Record<string, string | boolean>;
		/** Eigenschaften-Panel auf/zu — nutzerkontrolliert (bind:open). */
		fieldsOpen?: boolean;
	}

	// WYSIWYG-Block-Liste: jeder Body-Block ist ein Item mit stabiler uid. Reihenfolge,
	// Einfügen, Löschen, Editieren passieren auf dieser Liste; der Payload beschreibt
	// den kompletten Body als `blocks` (der Server baut ihn daraus neu + synct Imports).
	interface Item {
		uid: number;
		source: 'existing' | 'new';
		index?: number;
		blockKind: 'prosa' | 'component' | 'container' | 'img' | 'structural' | 'protected';
		label: string;
		movable: boolean;
		deletable: boolean;
		content?: string;
		prose?: string;
		compName?: string;
		compProps?: CmsPropDef[];
		compValues?: Record<string, string | boolean>; // Leaf-Werte bzw. Container-Attribute
		children?: ChildItem[];
		childTypes?: string[];
		childPick?: string; // aktuell im Add-Kind-Dropdown gewählter Typ
		touched?: boolean;
		/** Eigenschaften-Panel auf/zu — nutzerkontrolliert (bind:open). */
		fieldsOpen?: boolean;
	}

	let nextUid = 1;
	function itemFromSegment(s: (typeof data.segments)[number]): Item {
		const base = {
			uid: nextUid++,
			source: 'existing' as const,
			index: s.index,
			blockKind: s.kind,
			label: s.label,
			movable: s.movable,
			deletable: s.deletable
		};
		if (s.kind === 'prosa') return { ...base, prose: s.content };
		if (s.kind === 'component' && s.component)
			return {
				...base,
				compName: s.component.name,
				compProps: s.component.props,
				compValues: { ...s.component.values }
			};
		if (s.kind === 'container' && s.container)
			return {
				...base,
				compName: s.container.name,
				compProps: s.container.props,
				compValues: { ...s.container.values },
				childTypes: s.container.childTypes,
				childPick: s.container.childTypes[0],
				children: s.container.children.map((c) => ({
					uid: nextUid++,
					name: c.name,
					label: c.label,
					props: c.props,
					values: { ...c.values }
				}))
			};
		return { ...base, content: s.content };
	}

	let items = $state<Item[]>(data.segments.map(itemFromSegment));
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

	function newItem(name: string): Item | null {
		if (name === 'Prose')
			return {
				uid: nextUid++,
				source: 'new',
				blockKind: 'prosa',
				label: 'Text',
				movable: true,
				deletable: true,
				prose: ''
			};
		const def = defByName(name);
		if (!def) return null;
		const values: Record<string, string | boolean> = {};
		for (const p of def.props) values[p.key] = p.default;
		const base = {
			uid: nextUid++,
			source: 'new' as const,
			label: def.label,
			movable: true,
			deletable: true,
			compName: def.name,
			compProps: def.props,
			compValues: values,
			// Neue Blöcke starten mit offenem Eigenschaften-Panel (leer → ausfüllen).
			fieldsOpen: true
		};
		if (def.container)
			return {
				...base,
				blockKind: 'container',
				children: [],
				childTypes: def.childTypes ?? [],
				childPick: def.childTypes?.[0]
			};
		return { ...base, blockKind: 'component' };
	}
	function insertType(name: string) {
		const it = newItem(name);
		if (it) items = [...items, it];
	}
	function insertAfterWith(uid: number, name: string) {
		const it = newItem(name);
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

	// ── Drag & Drop (dependency-frei, native HTML5). ↑/↓ bleibt Tastatur-/A11y-Weg. ──
	let dragUid = $state<number | null>(null);
	let dragOverUid = $state<number | null>(null);
	// P5: Drop-Position (obere/untere Hälfte des Ziels) + „ans Ende"-Zone.
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
	function onDrop(uid: number) {
		if (dragUid !== null) reorder(dragUid, uid, dragPos);
		dragUid = null;
		dragOverUid = null;
		dragOverEnd = false;
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
		dragUid = null;
		dragOverUid = null;
		dragOverEnd = false;
	}

	// P5: Block duplizieren — die Kopie ist immer ein „neuer" Block hinter dem Original.
	const canDuplicate = (it: Item) => it.blockKind !== 'structural' && it.blockKind !== 'protected';
	function duplicate(uid: number) {
		const i = items.findIndex((x) => x.uid === uid);
		if (i < 0) return;
		const src = items[i];
		let copy: Item | null = null;
		if (src.blockKind === 'prosa') {
			copy = {
				uid: nextUid++,
				source: 'new',
				blockKind: 'prosa',
				label: 'Text',
				movable: true,
				deletable: true,
				prose: src.prose ?? ''
			};
		} else if (src.blockKind === 'component' || src.blockKind === 'container') {
			copy = {
				uid: nextUid++,
				source: 'new',
				blockKind: src.blockKind,
				label: src.label,
				movable: true,
				deletable: true,
				compName: src.compName,
				compProps: src.compProps,
				compValues: { ...(src.compValues ?? {}) }
			};
			if (src.blockKind === 'container') {
				copy.children = (src.children ?? []).map((c) => ({
					...c,
					uid: nextUid++,
					values: { ...c.values },
					fieldsOpen: false
				}));
				copy.childTypes = src.childTypes;
				copy.childPick = src.childPick;
			}
		} else if (src.blockKind === 'img') {
			// Bare <img>-Insel → Kopie als Image-Pseudo-Block (src/alt aus dem Tag).
			const img = newItem('Image');
			if (img) {
				img.compValues = {
					...(img.compValues ?? {}),
					src: imgSrc(src.content ?? ''),
					alt: (src.content ?? '').match(/\balt="([^"]*)"/i)?.[1] ?? ''
				};
				copy = img;
			}
		}
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

	// ── Container-Kinder ──────────────────────────────────────────────────────
	function addChild(it: Item) {
		const def = defByName(it.childPick ?? '');
		if (!def) return;
		const values: Record<string, string | boolean> = {};
		for (const p of def.props) values[p.key] = p.default;
		const child: ChildItem = {
			uid: nextUid++,
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
			blocks: items.map((it) => {
				const kids = (it.children ?? []).map((c) => ({ name: c.name, values: c.values }));
				if (it.source === 'new')
					return it.blockKind === 'prosa'
						? { insertProse: it.prose ?? '' }
						: it.blockKind === 'container'
							? { insertContainer: it.compName, attrs: it.compValues, children: kids }
							: { insert: it.compName, values: it.compValues };
				if (it.blockKind === 'container' && it.touched)
					return { keep: it.index, container: { attrs: it.compValues, children: kids } };
				if (it.blockKind === 'component' && it.touched)
					return { keep: it.index, component: it.compValues };
				if (it.blockKind === 'prosa' && it.touched) return { keep: it.index, prose: it.prose };
				return { keep: it.index };
			})
		})
	);

	const imgSrc = (t: string) => t?.match(/\bsrc="([^"]*)"/i)?.[1] ?? '';

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
				items = data.segments.map(itemFromSegment);
				initFieldsOpen(items);
				fieldState = data.fields.map((f) => ({ ...f }));
				savedPayload = payload;
				try {
					localStorage.removeItem(DRAFT_KEY);
				} catch {
					/* unkritisch */
				}
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
		items = data.segments.map(itemFromSegment);
		initFieldsOpen(items);
		fieldState = data.fields.map((f) => ({ ...f }));
		closeSlash();
		try {
			localStorage.removeItem(DRAFT_KEY);
		} catch {
			/* unkritisch */
		}
	}
	function onGlobalKeydown(e: KeyboardEvent) {
		const key = e.key.toLowerCase();
		const inField = (e.target as HTMLElement | null)?.matches?.(
			'input, textarea, select, [contenteditable]'
		);
		if ((e.metaKey || e.ctrlKey) && key === 's') {
			e.preventDefault();
			if (dirty && data.writable) formEl?.requestSubmit();
			return;
		}
		// ⌘Z/⇧⌘Z: Block-History — in Textfeldern gilt weiter das native Text-Undo.
		if ((e.metaKey || e.ctrlKey) && key === 'z' && !inField) {
			e.preventDefault();
			if (e.shiftKey) redoEdit();
			else undoEdit();
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

	// ── Undo/Redo + lokaler Entwurf ───────────────────────────────────────────
	// Debounced Snapshots des gesamten Editor-Stands (Blöcke + Frontmatter): ⌘Z
	// läuft über den Stack; parallel wandert derselbe Snapshot als Entwurf in
	// localStorage und überlebt Tab-Crash/Schließen. Ein Entwurf gilt nur, solange
	// die Datei unverändert ist (base === savedPayload) — sonst verfällt er still.
	type Snapshot = { items: Item[]; fields: { key: string; value: string }[] };
	const snap = (): Snapshot =>
		$state.snapshot({ items, fields: fieldState }) as unknown as Snapshot;
	const DRAFT_KEY = `brand-cms-draft:${data.url}`;
	let undoStack: Snapshot[] = [snap()];
	let redoStack: Snapshot[] = [];
	let applyingHistory = false;
	let histTimer: ReturnType<typeof setTimeout> | null = null;
	let activeUid = $state<number | null>(null);
	let draftInfo = $state<{ at: number; snapshot: Snapshot } | null>(null);

	// Fokus-Tracking für Block-Shortcuts (⇧⌘D, ⌥⇧↑/↓): merkt sich den Block,
	// in dem zuletzt ein Feld/Button fokussiert war.
	function onBlocksFocusin(e: FocusEvent) {
		const li = (e.target as HTMLElement).closest('[data-uid]');
		activeUid = li ? Number(li.getAttribute('data-uid')) : null;
	}

	function applySnapshot(s: Snapshot) {
		applyingHistory = true;
		if (histTimer) clearTimeout(histTimer);
		// $state.snapshot löst Reactive-Proxies (z. B. draftInfo) — structuredClone
		// allein würde daran mit DataCloneError scheitern; die Kombination liefert
		// garantiert eine frische, teilbare Kopie (Stack-Einträge bleiben unberührt).
		const plain = structuredClone($state.snapshot(s)) as unknown as Snapshot;
		items = plain.items;
		fieldState = plain.fields;
		// uid-Kollisionen mit künftigen Einfügungen vermeiden (Entwurf aus früherer Session).
		const maxUid = Math.max(
			0,
			...plain.items.flatMap((it) => [it.uid, ...(it.children ?? []).map((c) => c.uid)])
		);
		if (maxUid >= nextUid) nextUid = maxUid + 1;
		closeSlash();
		setTimeout(() => (applyingHistory = false), 450);
	}
	function undoEdit() {
		if (undoStack.length < 2) return;
		redoStack.push(undoStack.pop()!);
		applySnapshot(undoStack[undoStack.length - 1]);
	}
	function redoEdit() {
		const s = redoStack.pop();
		if (!s) return;
		undoStack.push(s);
		applySnapshot(s);
	}

	$effect(() => {
		void payload; // Abhängigkeit: jede inhaltliche Änderung
		if (applyingHistory) return;
		if (histTimer) clearTimeout(histTimer);
		histTimer = setTimeout(() => {
			const s = snap();
			if (JSON.stringify(undoStack[undoStack.length - 1]) === JSON.stringify(s)) return;
			undoStack.push(s);
			if (undoStack.length > 100) undoStack.shift();
			redoStack = [];
			try {
				if (dirty)
					localStorage.setItem(
						DRAFT_KEY,
						JSON.stringify({ base: savedPayload, snapshot: s, at: Date.now() })
					);
				else localStorage.removeItem(DRAFT_KEY);
			} catch {
				/* Speicher voll/blockiert — Entwurf ist nur ein Bonus */
			}
		}, 350);
	});

	// Einmalig beim Laden: passenden Entwurf anbieten (nur wenn Datei unverändert).
	$effect(() => {
		try {
			const raw = localStorage.getItem(DRAFT_KEY);
			if (!raw) return;
			const d = JSON.parse(raw) as { base: string; snapshot: Snapshot; at: number };
			if (d.base !== untrack(() => savedPayload)) {
				localStorage.removeItem(DRAFT_KEY);
				return;
			}
			if (JSON.stringify(d.snapshot) === JSON.stringify(untrack(snap))) return;
			draftInfo = { at: d.at, snapshot: d.snapshot };
		} catch {
			/* kaputter Entwurf → ignorieren */
		}
	});
</script>

<svelte:head><title>{data.title} bearbeiten – Admin</title></svelte:head>
<svelte:window onkeydown={onGlobalKeydown} onbeforeunload={onBeforeUnload} />

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

	{#if draftInfo}
		<div class="flash flash--draft" role="status">
			<span
				>Ungespeicherter Entwurf von {new Date(draftInfo.at).toLocaleTimeString('de-DE', {
					hour: '2-digit',
					minute: '2-digit'
				})}&nbsp;Uhr gefunden.</span
			>
			<button
				type="button"
				class="draft-btn"
				onclick={() => {
					if (draftInfo) applySnapshot(draftInfo.snapshot);
					draftInfo = null;
				}}>Wiederherstellen</button
			>
			<button
				type="button"
				class="draft-btn draft-btn--ghost"
				onclick={() => {
					try {
						localStorage.removeItem(DRAFT_KEY);
					} catch {
						/* unkritisch */
					}
					draftInfo = null;
				}}>Verwerfen</button
			>
		</div>
	{/if}

	<form method="POST" action="?/save" bind:this={formEl} use:enhance={handleSubmit}>
		<input type="hidden" name="payload" value={payload} />

		{#if fieldState.length}
			<section class="block">
				<h2 class="block-title">Frontmatter</h2>
				{#each fieldState as field (field.key)}
					<label class="field">
						<span class="lbl">{field.key}</span>
						<input bind:value={field.value} />
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
					<div class="blk-tools">
						<button
							type="button"
							class="blk-btn"
							disabled={!canMoveUp(i)}
							onclick={() => move(i, -1)}
							aria-label="nach oben"
							title="nach oben"><Icon name="arrow-up" /></button
						>
						<button
							type="button"
							class="blk-btn"
							disabled={!canMoveDown(i)}
							onclick={() => move(i, 1)}
							aria-label="nach unten"
							title="nach unten"><Icon name="arrow-down" /></button
						>
						{#if canDuplicate(it)}
							<button
								type="button"
								class="blk-btn"
								onclick={() => duplicate(it.uid)}
								aria-label="Duplizieren"
								title="Duplizieren"><Icon name="duplicate" /></button
							>
						{/if}
						{#if it.deletable}
							<button
								type="button"
								class="blk-btn blk-btn--del"
								onclick={() => remove(it.uid)}
								aria-label="Löschen"
								title="Löschen"><Icon name="trash" /></button
							>
						{/if}
					</div>
				{/snippet}

				<!-- svelte-ignore a11y_no_noninteractive_element_interactions — focusin ist passives Tracking für Shortcuts -->
				<ol class="blocks" onfocusin={onBlocksFocusin}>
					{#each items as it, i (it.uid)}
						{@const errs = itemErrors(it)}
						{@const errTotal =
							countErrors(errs) +
							(it.children ?? []).reduce((m, c) => m + countErrors(childErrors(c)), 0)}
						<li
							class="blk blk--{it.blockKind}"
							data-uid={it.uid}
							class:blk--invalid={errTotal > 0}
							class:blk--dragover-before={dragOverUid === it.uid &&
								dragUid !== it.uid &&
								dragPos === 'before'}
							class:blk--dragover-after={dragOverUid === it.uid &&
								dragUid !== it.uid &&
								dragPos === 'after'}
							class:blk--dragging={dragUid === it.uid}
							ondragover={(e) => {
								if (dragUid !== null && it.movable) {
									e.preventDefault();
									dragOverUid = it.uid;
									const r = e.currentTarget.getBoundingClientRect();
									dragPos = e.clientY > r.top + r.height / 2 ? 'after' : 'before';
								}
							}}
							ondrop={(e) => {
								e.preventDefault();
								onDrop(it.uid);
							}}
						>
							<!-- Linke Gutter-Spalte (Notion/TipTap-Stil): „+" (einfügen danach) und der
							     Drag-Griff erscheinen bei Hover; gezogen wird am Griff. Barrierefreier
							     Reorder bleibt über die ↑/↓-Buttons im Kopf. -->
							<div class="blk-gutter">
								{#if it.blockKind !== 'structural'}
									<InsertMenu
										items={paletteItems}
										onpick={(name) => insertAfterWith(it.uid, name)}
										compact
									/>
								{/if}
								{#if it.movable}
									<span
										class="drag-handle"
										draggable="true"
										ondragstart={() => (dragUid = it.uid)}
										ondragend={() => {
											dragUid = null;
											dragOverUid = null;
										}}
										title="Ziehen zum Sortieren"
										aria-hidden="true"><Icon name="grip" /></span
									>
								{/if}
							</div>

							<div class="blk-main">
								<div class="blk-head">
									<span class="blk-label">{it.label}{it.source === 'new' ? ' · neu' : ''}</span>
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
								<div class="blk-body">
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
														<span class="blk-ico blk-ico--sm"
															><Icon name={iconFor(child.name)} /></span
														>
														<span class="child-label">{child.label}</span>
														<div class="blk-tools">
															<button
																type="button"
																class="blk-btn"
																disabled={ci === 0}
																onclick={() => moveChild(it, ci, -1)}
																aria-label="nach oben"
																title="nach oben"><Icon name="arrow-up" /></button
															>
															<button
																type="button"
																class="blk-btn"
																disabled={ci === (it.children?.length ?? 0) - 1}
																onclick={() => moveChild(it, ci, 1)}
																aria-label="nach unten"
																title="nach unten"><Icon name="arrow-down" /></button
															>
															<button
																type="button"
																class="blk-btn blk-btn--del"
																onclick={() => removeChild(it, child.uid)}
																aria-label="Löschen"
																title="Löschen"><Icon name="trash" /></button
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
													<select bind:value={it.childPick} aria-label="Element-Typ">
														{#each it.childTypes ?? [] as ct (ct)}
															<option value={ct}>{defByName(ct)?.label ?? ct}</option>
														{/each}
													</select>
													<button type="button" class="ins-btn" onclick={() => addChild(it)}>
														+ Element
													</button>
												</div>
											{/if}
										</div>
									{:else if it.blockKind === 'img'}
										<div class="blk-img">
											<img class="insel-thumb" src={imgSrc(it.content ?? '')} alt="" />
											<code class="insel-src">{imgSrc(it.content ?? '')}</code>
										</div>
									{:else}
										{#if it.blockKind === 'structural'}
											<p class="tech-hint">
												Technischer Seitenkopf — wird vom System gepflegt und erscheint nicht als
												Inhalt auf der Seite.
											</p>
										{/if}
										<details class="blk-details">
											<summary class="blk-summary">Code anzeigen</summary>
											<pre class="blk-code"><code>{it.content}</code></pre>
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
						ondragover={(e) => {
							e.preventDefault();
							dragOverEnd = true;
						}}
						ondragleave={() => (dragOverEnd = false)}
						ondrop={(e) => {
							e.preventDefault();
							dropAtEnd();
						}}
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
							<button type="button" class="empty-cta" onclick={() => insertType('Prose')}
								>Textblock beginnen</button
							>
							<InsertMenu items={paletteItems} onpick={insertType} label="Element einfügen" />
						</div>
					</div>
				{/if}
			{/if}
		</section>

		{#if dirty}
			<div class="savebar" role="status">
				<span class="savebar-info"
					>{dirtyCount > 0
						? `${dirtyCount} ungespeicherte Änderung${dirtyCount === 1 ? '' : 'en'}`
						: 'Reihenfolge geändert'}</span
				>
				{#if errorCount > 0}
					<span class="savebar-err">{errorCount} {errorCount === 1 ? 'Feld' : 'Felder'} prüfen</span
					>
				{/if}
				<button type="button" class="savebar-discard" onclick={discard}>Verwerfen</button>
				<button
					type="submit"
					class="save"
					disabled={!data.writable || errorCount > 0}
					title={errorCount > 0 ? 'Bitte zuerst die rot markierten Felder korrigieren' : undefined}
					>Speichern <kbd>⌘S</kbd></button
				>
			</div>
		{/if}
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
	.draft-btn {
		border: 1px solid var(--ds-border);
		background: var(--ds-surface);
		font: inherit;
		font-size: var(--ds-text-xs);
		color: var(--ds-text);
		border-radius: 999px;
		padding: 2px var(--z-ds-space-s);
		cursor: pointer;
	}
	.draft-btn:hover {
		border-color: var(--ds-accent);
	}
	.draft-btn:focus-visible {
		outline: 2px solid var(--ds-focus-ring);
		outline-offset: 1px;
	}
	.draft-btn--ghost {
		border-color: transparent;
		background: none;
		color: var(--ds-text-muted);
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
	.field {
		display: block;
		margin: 0 0 var(--z-ds-space-l);
	}
	.lbl {
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
	.ins-btn {
		border: 1px dashed var(--ds-border);
		background: none;
		border-radius: var(--ds-radius-sm);
		padding: 2px var(--z-ds-space-s);
		font-size: var(--ds-text-xs);
		color: var(--ds-text-body);
		cursor: pointer;
	}
	.ins-btn:focus-visible {
		outline: 2px solid var(--ds-focus-ring);
		outline-offset: 2px;
	}
	input,
	select {
		width: 100%;
		font: inherit;
		font-size: var(--ds-text-sm);
		color: var(--ds-text);
		background: var(--ds-surface);
		border: 1px solid var(--ds-border);
		border-radius: var(--ds-radius-sm);
		padding: var(--z-ds-space-6) var(--z-ds-space-8);
	}
	input:focus-visible {
		outline: 2px solid var(--ds-focus-ring);
		outline-offset: 1px;
	}
	.insel-thumb {
		width: 4rem;
		height: 4rem;
		flex: none;
		object-fit: cover;
		border-radius: var(--ds-radius-sm);
		background: var(--ds-surface);
		border: 1px solid var(--ds-border-soft);
	}
	.insel-src {
		font-family: var(--z-ds-font-mono, monospace);
		font-size: var(--ds-text-xs);
		color: var(--ds-text-muted);
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}
	/* P3: Kind-Karten — Vorschau + Aufklapp-Felder wie auf Top-Level. */
	.child-body {
		display: flex;
		flex-direction: column;
		gap: var(--z-ds-space-6);
		padding: var(--z-ds-space-8) var(--z-ds-space-8) var(--z-ds-space-8);
	}
	.blk-ico--sm {
		width: 1.25rem;
		height: 1.25rem;
		font-size: 0.8rem;
	}
	/* P4: schwebende Save-Bar bei offenen Änderungen (+ Platz, damit sie nichts verdeckt) */
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
	.savebar-discard:focus-visible {
		outline: 2px solid var(--ds-focus-ring);
		outline-offset: 2px;
	}
	.savebar .save {
		padding: var(--z-ds-space-8) var(--z-ds-space-l);
	}
	.savebar kbd {
		font-family: var(--z-ds-font-mono, monospace);
		font-size: 0.72em;
		opacity: 0.75;
		margin-left: 0.3em;
		background: rgb(from var(--ds-static-white) r g b / 0.18);
		padding: 1px 5px;
		border-radius: 4px;
	}
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
	@media (prefers-reduced-motion: reduce) {
		.savebar {
			animation: none;
		}
	}
	.save {
		background: var(--ds-accent);
		color: var(--ds-static-white);
		border: none;
		border-radius: 999px;
		padding: var(--z-ds-space-10) var(--z-ds-space-xl);
		font-weight: 600;
		cursor: pointer;
		transition: opacity var(--ds-dur) var(--ds-ease-out);
	}
	.save:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}
	.save:focus-visible {
		outline: 2px solid var(--ds-focus-ring);
		outline-offset: 2px;
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
	.blk {
		position: relative;
		display: block;
		border-radius: var(--ds-radius-sm);
	}
	.blk--protected {
		opacity: 0.8;
	}
	/* Struktur-Blöcke (z. B. Head): technisch, nicht editierbar — bewusst anders als
	   die Inhalts-Karten: gestrichelte Kontur statt Fläche, Chip + Erklärtext. */
	.blk--structural > .blk-main {
		border: 1px dashed var(--ds-border);
		border-radius: var(--ds-radius, 8px);
		padding: 8px 12px;
	}
	.blk--structural .blk-head {
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
	.blk--dragging {
		opacity: 0.35;
	}
	.blk--dragover-before::before,
	.blk--dragover-after::after {
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
	.blk--dragover-before::before {
		top: -8.5px;
	}
	.blk--dragover-after::after {
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
	.empty-cta {
		border: 1px solid var(--ds-border);
		background: var(--ds-surface-raised, var(--ds-surface));
		font: inherit;
		font-size: var(--ds-text-sm);
		color: var(--ds-text);
		border-radius: 999px;
		padding: var(--z-ds-space-6) var(--z-ds-space-l);
		cursor: pointer;
		transition: border-color var(--ds-dur, 0.15s) var(--ds-ease-out, ease-out);
	}
	.empty-cta:hover {
		border-color: var(--ds-accent);
	}
	.empty-cta:focus-visible {
		outline: 2px solid var(--ds-focus-ring);
		outline-offset: 2px;
	}
	/* Prosa: gleiche Karten-Behandlung wie die Komponenten (Wunsch 2026-07-10). */

	/* Gutter-Controls (Figma: 24px-Icon-Buttons, radius 4, auf Kopfhöhe der Karte):
	   absolut links AUSSERHALB des Containers, bei Hover/Fokus eingeblendet. */
	.blk-gutter {
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
		.blk-gutter {
			left: -2.75rem;
			width: 2.5rem;
		}
	}
	.blk:hover .blk-gutter,
	.blk:focus-within .blk-gutter {
		opacity: 1;
	}
	.drag-handle {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		width: 1.5rem;
		height: 1.5rem;
		flex: none;
		color: var(--ds-text-muted);
		cursor: grab;
		user-select: none;
		border-radius: var(--ds-radius-sm);
		transition: background var(--ds-dur, 0.15s) var(--ds-ease-out, ease-out);
	}
	.drag-handle:hover {
		background: rgb(from var(--ds-text) r g b / 0.08);
		color: var(--ds-text);
	}
	.drag-handle:active {
		cursor: grabbing;
	}

	/* Kopfzeile: Typ-Label links, Move/Delete-Tools rechts (bei Hover eingeblendet). */
	.blk-main {
		min-width: 0;
	}
	.blk-head {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: var(--z-ds-space-m);
		min-height: 1.4rem;
	}
	.blk-label {
		font-size: var(--ds-text-xs);
		text-transform: uppercase;
		letter-spacing: var(--ds-label-tracking);
		font-weight: 600;
		color: var(--ds-text-muted);
	}
	.blk-tools {
		display: flex;
		gap: var(--z-ds-space-6);
		opacity: 0;
		transition: opacity var(--ds-dur, 0.15s) var(--ds-ease-out, ease-out);
	}
	.blk:hover .blk-tools,
	.blk:focus-within .blk-tools {
		opacity: 1;
	}
	/* Icon-Button-Standard (CMS): 16×16-Icon in 24×24-Quadrat, radius 4,
	   Hover = dezente Text-Tönung. Gleiches Muster in ProseEditor/MediaPicker. */
	.blk-btn {
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
		font-size: var(--ds-text-xs);
		color: var(--ds-text-muted);
		cursor: pointer;
		line-height: 1;
		transition:
			background var(--ds-dur, 0.15s) var(--ds-ease-out, ease-out),
			color var(--ds-dur, 0.15s) var(--ds-ease-out, ease-out);
	}
	.blk-btn:hover:not(:disabled) {
		background: rgb(from var(--ds-text) r g b / 0.08);
		color: var(--ds-text);
	}
	.blk-btn:disabled {
		opacity: 0.35;
		cursor: not-allowed;
	}
	.blk-btn--del:hover:not(:disabled) {
		color: var(--ds-negative, var(--ds-text));
		background: rgb(from var(--ds-negative, var(--ds-text)) r g b / 0.1);
	}
	.blk-btn:focus-visible {
		outline: 2px solid var(--ds-focus-ring);
		outline-offset: 1px;
	}
	.blk-body {
		padding: 2px 0 var(--z-ds-space-s);
	}
	.blk-code {
		margin: var(--z-ds-space-s) 0 0;
		overflow-x: auto;
		font-size: var(--ds-text-sm);
		color: var(--ds-text-muted);
	}
	/* Ausklappbarer Code-/Head-Block */
	.blk-details {
		font-size: var(--ds-text-sm);
	}
	.blk-summary {
		cursor: pointer;
		list-style: none;
		display: inline-flex;
		align-items: center;
		gap: var(--z-ds-space-6);
		font-size: var(--ds-text-xs);
		color: var(--ds-text-muted);
		user-select: none;
	}
	.blk-summary::-webkit-details-marker {
		display: none;
	}
	.blk-summary::before {
		content: '▸';
		display: inline-block;
		transition: transform var(--ds-dur, 0.15s) var(--ds-ease-out, ease-out);
	}
	.blk-details[open] .blk-summary::before {
		transform: rotate(90deg);
	}
	.blk-summary:focus-visible {
		outline: 2px solid var(--ds-focus-ring);
		outline-offset: 2px;
	}
	.blk-img {
		display: flex;
		align-items: center;
		gap: var(--z-ds-space-m);
	}
	/* „+"-Trigger in der Gutter-Spalte als 24px-Icon-Button (wie der Griff). */
	.blk-gutter :global(.insert-menu) {
		display: inline-flex;
	}
	.blk-gutter :global(.trigger) {
		width: 1.5rem;
		height: 1.5rem;
		justify-content: center;
		padding: 0;
		border: none;
		background: none;
		color: var(--ds-text-muted);
		border-radius: var(--ds-radius-sm);
	}
	.blk-gutter :global(.trigger:hover) {
		background: rgb(from var(--ds-text) r g b / 0.08);
		color: var(--ds-text);
	}
	.blk-gutter :global(.trigger .plus) {
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
	.add-child select {
		flex: 1 1 auto;
		min-width: 0;
	}

	/* ── Karten nach Figma 689:11510: Fläche raised, radius 8, padding 12; Kopf mit
	   Border-bottom (Label 12 bold uppercase, muted) + Tools; Body gestapelte Felder.
	   Kein overflow:hidden — Popover (Media/Token) müssen herausragen dürfen. */
	.blk--component > .blk-main,
	.blk--container > .blk-main,
	.blk--img > .blk-main,
	.blk--prosa > .blk-main {
		background: var(--ds-surface-raised, var(--ds-surface));
		border-radius: var(--ds-radius, 8px);
		padding: 12px;
	}
	.blk--component > .blk-main > .blk-head,
	.blk--container > .blk-main > .blk-head,
	.blk--img > .blk-main > .blk-head,
	.blk--prosa > .blk-main > .blk-head {
		justify-content: flex-start;
		gap: var(--z-ds-space-8);
		padding: 0 0 8px;
		border-bottom: 1px solid var(--ds-border);
	}
	/* Tools im Karten-Header dauerhaft sichtbar (klarer als reines Hover). */
	.blk--component > .blk-main > .blk-head .blk-tools,
	.blk--container > .blk-main > .blk-head .blk-tools,
	.blk--img > .blk-main > .blk-head .blk-tools,
	.blk--prosa > .blk-main > .blk-head .blk-tools {
		opacity: 1;
		margin-left: auto;
	}
	.blk--component > .blk-main > .blk-body,
	.blk--container > .blk-main > .blk-body,
	.blk--img > .blk-main > .blk-body,
	.blk--prosa > .blk-main > .blk-body {
		display: flex;
		flex-direction: column;
		gap: var(--z-ds-space-s);
		padding: 8px 0 0;
	}
	.blk-ico {
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
	.blk--invalid > .blk-main {
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
