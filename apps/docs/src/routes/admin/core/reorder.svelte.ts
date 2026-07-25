/**
 * reorder.svelte.ts — die gemeinsame Umsortier-Mechanik der CMS-Nav-Übersichten.
 *
 * Vorher lag sie komplett inline in `/admin/brand/+page.svelte` (Arbeits-Baum,
 * Server-Resync, optimistisches Persistieren, ↑/↓-Nudges und natives HTML5-DnD auf
 * zwei Ebenen). Seit die Design-System-Übersicht auf `/admin` dieselbe Bedienung
 * bekommt (ADR-030), lebt sie hier als EINE Quelle — beide Seiten instanziieren
 * `new Reorder(...)` und rendern nur noch ihre eigenen Zeilen.
 *
 * Bewusst native HTML5-DnD (dependency-frei) wie im Block-Editor (`core/actions.ts`
 * `blockDnd`). Anders als dort braucht die Nav ZWEI Ebenen mit getrenntem Scope
 * (Top-Level und Gruppen-Kinder), weshalb die Handler pro Zeile gebunden werden
 * statt delegiert: ein Kind darf nie ins Top-Level rutschen und umgekehrt.
 */
import { deserialize } from '$app/forms';
import { invalidateAll } from '$app/navigation';

/** Minimal-Vertrag eines Config-Knotens: darf Kinder haben (Gruppe). */
export interface ReorderNode {
	items?: unknown[];
}

/** Ziehkontext — Top-Level-Eintrag oder Kind innerhalb einer Gruppe. */
export type DragCtx =
	| { kind: 'top'; index: number }
	| { kind: 'child'; group: number; index: number };

export interface ReorderOptions<T extends ReorderNode> {
	/** Server-Stand beim Mount (aus `data`). */
	initial: T[];
	/** Darf geschrieben werden? (Prod = nur lesen, s. Seiten-Banner.) */
	writable: () => boolean;
	/** Form-Action, die den Baum persistiert. Default `?/reorder`. */
	action?: string;
	/** Rückmeldung an die Nutzer:innen (Toast). */
	notify?: (title: string, body: string) => void;
	/** Nach erfolgreichem Write neu laden. Default `invalidateAll`. */
	revalidate?: () => Promise<void>;
}

export class Reorder<T extends ReorderNode> {
	/** Arbeits-Baum (optimistisch mutiert, dann persistiert). */
	tree = $state<T[]>([]);
	/** Läuft gerade ein Write? (Liste wird solange stillgelegt.) */
	saving = $state(false);
	/** Zeile, über der gerade geschwebt wird (Drop-Indikator). */
	overKey = $state<string | null>(null);

	#drag = $state<DragCtx | null>(null);
	#server: T[];
	#serverSig: string;
	#opts: ReorderOptions<T>;

	constructor(opts: ReorderOptions<T>) {
		this.#opts = opts;
		this.#server = opts.initial;
		this.#serverSig = JSON.stringify(opts.initial);
		this.tree = structuredClone(opts.initial);
	}

	/**
	 * Resync auf den Server-Stand — vom Host in einem `$effect` mit `data.navTree`
	 * aufzurufen. Nötig, weil das Schreiben der Config im Dev einen Vite-HMR-Remount
	 * auslöst und `invalidateAll()` danach frische Daten liefert. Der Signatur-
	 * Vergleich lässt optimistische Edits ungestört, solange der Server nichts Neues
	 * gemeldet hat.
	 */
	sync(server: T[]) {
		const sig = JSON.stringify(server);
		if (sig === this.#serverSig) return;
		this.#serverSig = sig;
		this.#server = server;
		this.tree = structuredClone(server);
	}

	/** Optimistische Änderung verwerfen und auf den Server-Stand zurückfallen. */
	#revert() {
		this.tree = structuredClone(this.#server);
	}

	/**
	 * Persistenz per direktem Action-fetch (kein `use:enhance` — die Liste ist kein
	 * Formular). Nach Erfolg `revalidate()`, damit der Server-Load die Config frisch
	 * von der Platte liest.
	 */
	async persist() {
		if (!this.#opts.writable()) return; // Prod: read-only
		const body = new FormData();
		body.set('tree', JSON.stringify($state.snapshot(this.tree)));
		this.saving = true;
		try {
			const res = await fetch(this.#opts.action ?? '?/reorder', {
				method: 'POST',
				headers: { 'x-sveltekit-action': 'true' },
				body
			});
			const result = deserialize(await res.text());
			if (result.type === 'success') {
				this.#opts.notify?.('Reihenfolge gespeichert', 'Sidebar & Übersicht wurden aktualisiert.');
				await (this.#opts.revalidate ?? invalidateAll)();
			} else {
				const msg =
					result.type === 'failure'
						? (result.data as { message?: string } | undefined)?.message
						: undefined;
				this.#opts.notify?.('Nicht gespeichert', msg ?? 'Speichern fehlgeschlagen.');
				this.#revert();
			}
		} catch (e) {
			this.#opts.notify?.('Fehler', e instanceof Error ? e.message : 'Speichern fehlgeschlagen.');
			this.#revert();
		} finally {
			this.saving = false;
		}
	}

	// ── Move-Operationen (mutieren den Baum an eine ZIEL-Endposition, dann persist) ──

	repositionTop(from: number, final: number) {
		if (final < 0 || final >= this.tree.length || from === final) return;
		const a = this.tree.slice();
		const [item] = a.splice(from, 1);
		a.splice(final, 0, item);
		this.tree = a;
		this.persist();
	}

	repositionChild(group: number, from: number, final: number) {
		const items = this.tree[group]?.items;
		if (!items || final < 0 || final >= items.length || from === final) return;
		const a = items.slice();
		const [item] = a.splice(from, 1);
		a.splice(final, 0, item);
		this.tree[group].items = a;
		this.persist();
	}

	/** ↑/↓ (barrierefreie, präzise Basis — Tastatur/ohne Maus). dir −1 = nach oben. */
	nudgeTop = (i: number, dir: -1 | 1) => this.repositionTop(i, i + dir);
	nudgeChild = (g: number, i: number, dir: -1 | 1) => this.repositionChild(g, i, i + dir);

	// ── Natives HTML5-Drag&Drop, zwei Ebenen, gleicher Scope nötig ────────────────

	/** Drop auf die Anzeige-Zeile „to" = „vor diesem Eintrag einfügen" → Endindex. */
	static dropFinal = (from: number, to: number) => (from < to ? to - 1 : to);

	static keyOf = (c: DragCtx) => (c.kind === 'top' ? `t${c.index}` : `c${c.group}.${c.index}`);

	static #sameScope = (a: DragCtx, b: DragCtx) =>
		a.kind === 'top' ? b.kind === 'top' : b.kind === 'child' && a.group === b.group;

	/** Zeigt diese Zeile gerade den Einfüge-Indikator? */
	isOver(ctx: DragCtx): boolean {
		return this.overKey === Reorder.keyOf(ctx);
	}

	// stopPropagation: Kind-Drags dürfen NICHT zum umschließenden Top-Level-<li>
	// hochblubbern (sonst überschriebe der Gruppen-Kontext den Kind-Kontext).
	onDragStart = (e: DragEvent, ctx: DragCtx) => {
		e.stopPropagation();
		this.#drag = ctx;
		if (e.dataTransfer) e.dataTransfer.effectAllowed = 'move';
	};

	onDragOver = (e: DragEvent, ctx: DragCtx) => {
		const drag = this.#drag;
		if (!drag || !Reorder.#sameScope(drag, ctx)) return;
		e.preventDefault();
		e.stopPropagation();
		if (e.dataTransfer) e.dataTransfer.dropEffect = 'move';
		this.overKey = Reorder.keyOf(ctx);
	};

	onDrop = (e: DragEvent, ctx: DragCtx) => {
		const drag = this.#drag;
		if (!drag || !Reorder.#sameScope(drag, ctx)) return;
		e.preventDefault();
		e.stopPropagation();
		if (drag.kind === 'top' && ctx.kind === 'top')
			this.repositionTop(drag.index, Reorder.dropFinal(drag.index, ctx.index));
		else if (drag.kind === 'child' && ctx.kind === 'child')
			this.repositionChild(ctx.group, drag.index, Reorder.dropFinal(drag.index, ctx.index));
		this.onDragEnd();
	};

	onDragEnd = () => {
		this.#drag = null;
		this.overKey = null;
	};
}
