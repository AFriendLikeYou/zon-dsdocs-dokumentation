// Brand-Editor — Undo/Redo-Historie + lokaler Entwurf (localStorage-Autosave).
//
// Kapselt zwei zusammengehörige Aufgaben, die vorher im Editor-Host verstreut
// lagen:
//   1. Undo/Redo-Stacks über Snapshots des gesamten Editor-Stands.
//   2. Debounced Autosave desselben Snapshots als Entwurf in localStorage — er
//      überlebt Tab-Crash/Schließen und gilt nur, solange die Datei unverändert
//      ist (`base === savedPayload`), sonst verfällt er still.
//
// Die Klasse besitzt beide Timer (Push-Debounce + Reset des Applying-Flags) und
// ruft zum Anwenden eines Snapshots den vom Host gereichten `apply`-Callback
// (der setzt Items/Frontmatter + räumt Editor-UI auf). Reines TS mit Runes →
// isoliert unit-testbar (localStorage/Timers mockbar).

export interface EditorHistoryOptions<S> {
	/** localStorage-Schlüssel des Entwurfs (pro Datei). */
	draftKey: string;
	/** Wendet einen Snapshot auf den Editor-Stand an (Host: Items/Frontmatter setzen). */
	apply: (snapshot: S) => void;
	/** Max. Tiefe des Undo-Stacks (älteste fallen raus). */
	limit?: number;
	/** Verzögerung des Push-/Autosave-Debounce (ms). */
	pushDelay?: number;
	/** Sperrdauer des Applying-Flags nach einem Apply (ms). */
	applyLockMs?: number;
}

export class EditorHistory<S> {
	#undo: S[] = [];
	#redo: S[] = [];
	#limit: number;
	#pushDelay: number;
	#applyLockMs: number;
	#draftKey: string;
	#apply: (snapshot: S) => void;
	#pushTimer: ReturnType<typeof setTimeout> | null = null;
	#lockTimer: ReturnType<typeof setTimeout> | null = null;

	/** Läuft gerade ein Apply (Undo/Redo/Restore)? Blockiert das Nach-Pushen. */
	applying = $state(false);
	/** Angebotener Entwurf (Banner „Wiederherstellen/Verwerfen"), sonst null. */
	draft = $state<{ at: number; snapshot: S } | null>(null);

	constructor(opts: EditorHistoryOptions<S>) {
		this.#draftKey = opts.draftKey;
		this.#apply = opts.apply;
		this.#limit = opts.limit ?? 100;
		this.#pushDelay = opts.pushDelay ?? 350;
		this.#applyLockMs = opts.applyLockMs ?? 450;
	}

	/** Startzustand: erster Snapshot bildet die Basis des Undo-Stacks. */
	seed(snapshot: S): void {
		this.#undo = [snapshot];
		this.#redo = [];
	}

	get canUndo(): boolean {
		return this.#undo.length > 1;
	}
	get canRedo(): boolean {
		return this.#redo.length > 0;
	}

	/**
	 * Snapshot auf den Undo-Stack legen. Ist er identisch zum Kopf (kein echter
	 * Diff), passiert nichts und es wird `false` gemeldet. Ein echter Push kappt
	 * den Stack auf `limit` und leert den Redo-Stack.
	 */
	push(snapshot: S): boolean {
		const top = this.#undo[this.#undo.length - 1];
		if (top !== undefined && JSON.stringify(top) === JSON.stringify(snapshot)) return false;
		this.#undo.push(snapshot);
		if (this.#undo.length > this.#limit) this.#undo.shift();
		this.#redo = [];
		return true;
	}

	undo(): void {
		if (!this.canUndo) return;
		this.#redo.push(this.#undo.pop()!);
		this.#runApply(this.#undo[this.#undo.length - 1]);
	}

	redo(): void {
		const s = this.#redo.pop();
		if (s === undefined) return;
		this.#undo.push(s);
		this.#runApply(s);
	}

	/**
	 * Debounced: schnappt den aktuellen Stand, pusht ihn (bei echtem Diff) und
	 * spiegelt ihn — wenn `dirty` — als Entwurf nach localStorage, sonst löscht er
	 * den Entwurf. Während eines laufenden Apply passiert nichts (kein Echo-Push).
	 */
	schedule(getSnapshot: () => S, meta: { dirty: boolean; base: string }): void {
		if (this.applying) return;
		if (this.#pushTimer) clearTimeout(this.#pushTimer);
		this.#pushTimer = setTimeout(() => {
			const s = getSnapshot();
			if (!this.push(s)) return;
			if (meta.dirty) this.saveDraft(meta.base, s);
			else this.clearDraft();
		}, this.#pushDelay);
	}

	/** Entwurf schreiben (fehlertolerant — Speicher voll/blockiert ist nur ein Bonus). */
	saveDraft(base: string, snapshot: S): void {
		try {
			localStorage.setItem(this.#draftKey, JSON.stringify({ base, snapshot, at: Date.now() }));
		} catch {
			/* Speicher voll/blockiert — Entwurf ist nur ein Bonus */
		}
	}

	/** Entwurf löschen (fehlertolerant). */
	clearDraft(): void {
		try {
			localStorage.removeItem(this.#draftKey);
		} catch {
			/* unkritisch */
		}
	}

	/**
	 * Gespeicherten Entwurf einlesen und ggf. anbieten (`this.draft`): nur wenn die
	 * Datei seither unverändert ist (`base` passt) und der Entwurf vom aktuellen
	 * Stand abweicht. Andernfalls wird ein verwaister Entwurf still verworfen.
	 */
	offerDraft(base: string, current: S): void {
		try {
			const raw = localStorage.getItem(this.#draftKey);
			if (!raw) return;
			const d = JSON.parse(raw) as { base: string; snapshot: S; at: number };
			if (d.base !== base) {
				this.clearDraft();
				return;
			}
			if (JSON.stringify(d.snapshot) === JSON.stringify(current)) return;
			this.draft = { at: d.at, snapshot: d.snapshot };
		} catch {
			/* kaputter Entwurf → ignorieren */
		}
	}

	/** Angebotenen Entwurf anwenden (und Angebot schließen). */
	applyDraft(): void {
		if (!this.draft) return;
		this.#runApply(this.draft.snapshot);
		this.draft = null;
	}

	/** Angebotenen Entwurf verwerfen (aus Storage löschen + Angebot schließen). */
	dismissDraft(): void {
		this.clearDraft();
		this.draft = null;
	}

	#runApply(snapshot: S): void {
		this.applying = true;
		// Ein noch schwebender Push-Debounce würde sonst den gerade ersetzten Stand
		// nachträglich einreihen — abbrechen.
		if (this.#pushTimer) clearTimeout(this.#pushTimer);
		if (this.#lockTimer) clearTimeout(this.#lockTimer);
		this.#apply(snapshot);
		this.#lockTimer = setTimeout(() => (this.applying = false), this.#applyLockMs);
	}
}
