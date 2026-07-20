import { describe, it, expect, beforeEach, vi } from 'vitest';
import { EditorHistory } from './editor-history.svelte';

// Snapshots sind für den Test schlichte {n}-Objekte; die Klasse ist generisch.
type Snap = { n: number };

function make(applied: Snap[] = []) {
	const history = new EditorHistory<Snap>({
		draftKey: 'test-draft',
		apply: (s) => applied.push(s),
		applyLockMs: 100,
		pushDelay: 50
	});
	return { history, applied };
}

beforeEach(() => {
	localStorage.clear();
});

describe('push/undo/redo', () => {
	it('canUndo/canRedo spiegeln die Stack-Größe', () => {
		const { history } = make();
		history.seed({ n: 0 });
		expect(history.canUndo).toBe(false);
		expect(history.canRedo).toBe(false);
		history.push({ n: 1 });
		expect(history.canUndo).toBe(true);
	});

	it('push ist idempotent bei identischem Kopf', () => {
		const { history } = make();
		history.seed({ n: 0 });
		expect(history.push({ n: 0 })).toBe(false);
		expect(history.canUndo).toBe(false);
		expect(history.push({ n: 1 })).toBe(true);
	});

	it('undo wendet den vorherigen Snapshot an, redo den nächsten', () => {
		const { history, applied } = make();
		history.seed({ n: 0 });
		history.push({ n: 1 });
		history.push({ n: 2 });

		history.undo();
		expect(applied.at(-1)).toEqual({ n: 1 });
		history.undo();
		expect(applied.at(-1)).toEqual({ n: 0 });
		expect(history.canUndo).toBe(false);

		history.redo();
		expect(applied.at(-1)).toEqual({ n: 1 });
		history.redo();
		expect(applied.at(-1)).toEqual({ n: 2 });
		expect(history.canRedo).toBe(false);
	});

	it('undo an der Grenze tut nichts', () => {
		const { history, applied } = make();
		history.seed({ n: 0 });
		history.undo();
		expect(applied).toHaveLength(0);
	});

	it('ein neuer push nach undo verwirft den redo-Stack', () => {
		const { history } = make();
		history.seed({ n: 0 });
		history.push({ n: 1 });
		history.undo();
		expect(history.canRedo).toBe(true);
		history.push({ n: 9 });
		expect(history.canRedo).toBe(false);
	});

	it('limit kappt den ältesten Eintrag', () => {
		const history = new EditorHistory<Snap>({ draftKey: 'k', apply: () => {}, limit: 3 });
		history.seed({ n: 0 });
		history.push({ n: 1 });
		history.push({ n: 2 });
		history.push({ n: 3 }); // Stack: [1,2,3] nach shift von 0
		// 3× undo möglich? Stack-Länge 3 → canUndo bis Länge 1 → 2 undos
		history.undo();
		history.undo();
		expect(history.canUndo).toBe(false);
	});

	it('setzt applying während des Apply und gibt es nach applyLockMs frei', () => {
		vi.useFakeTimers();
		try {
			const { history } = make();
			history.seed({ n: 0 });
			history.push({ n: 1 });
			history.undo();
			expect(history.applying).toBe(true);
			vi.advanceTimersByTime(100);
			expect(history.applying).toBe(false);
		} finally {
			vi.useRealTimers();
		}
	});
});

describe('schedule (debounced push + Autosave)', () => {
	it('pusht + schreibt Entwurf erst nach pushDelay, wenn dirty', () => {
		vi.useFakeTimers();
		try {
			const { history } = make();
			history.seed({ n: 0 });
			history.schedule(() => ({ n: 1 }), { dirty: true, base: 'BASE' });
			expect(history.canUndo).toBe(false); // noch nicht gefeuert
			vi.advanceTimersByTime(50);
			expect(history.canUndo).toBe(true);
			const raw = JSON.parse(localStorage.getItem('test-draft')!);
			expect(raw).toMatchObject({ base: 'BASE', snapshot: { n: 1 } });
		} finally {
			vi.useRealTimers();
		}
	});

	it('löscht den Entwurf, wenn nicht dirty', () => {
		vi.useFakeTimers();
		try {
			const { history } = make();
			history.seed({ n: 0 });
			history.saveDraft('BASE', { n: 5 });
			history.schedule(() => ({ n: 1 }), { dirty: false, base: 'BASE' });
			vi.advanceTimersByTime(50);
			expect(localStorage.getItem('test-draft')).toBeNull();
		} finally {
			vi.useRealTimers();
		}
	});

	it('während applying wird nichts geplant', () => {
		vi.useFakeTimers();
		try {
			const { history } = make();
			history.seed({ n: 0 });
			history.push({ n: 1 });
			history.undo(); // setzt applying=true
			history.schedule(() => ({ n: 2 }), { dirty: true, base: 'B' });
			vi.advanceTimersByTime(50);
			// kein neuer Push von n:2 (applying blockte die Planung)
			expect(localStorage.getItem('test-draft')).toBeNull();
		} finally {
			vi.useRealTimers();
		}
	});
});

describe('Entwurf-Roundtrip', () => {
	it('saveDraft → offerDraft bietet passenden Entwurf an', () => {
		const { history } = make();
		history.saveDraft('BASE', { n: 42 });
		history.offerDraft('BASE', { n: 0 });
		expect(history.draft).toMatchObject({ snapshot: { n: 42 } });
	});

	it('offerDraft verwirft bei abweichender base', () => {
		const { history } = make();
		history.saveDraft('OLD', { n: 42 });
		history.offerDraft('NEW', { n: 0 });
		expect(history.draft).toBeNull();
		expect(localStorage.getItem('test-draft')).toBeNull();
	});

	it('offerDraft bietet nichts an, wenn Entwurf == aktueller Stand', () => {
		const { history } = make();
		history.saveDraft('BASE', { n: 7 });
		history.offerDraft('BASE', { n: 7 });
		expect(history.draft).toBeNull();
	});

	it('applyDraft wendet den Entwurf an und schließt das Angebot', () => {
		const { history, applied } = make();
		history.saveDraft('BASE', { n: 3 });
		history.offerDraft('BASE', { n: 0 });
		history.applyDraft();
		expect(applied.at(-1)).toEqual({ n: 3 });
		expect(history.draft).toBeNull();
	});

	it('dismissDraft löscht Storage + Angebot', () => {
		const { history } = make();
		history.saveDraft('BASE', { n: 3 });
		history.offerDraft('BASE', { n: 0 });
		history.dismissDraft();
		expect(history.draft).toBeNull();
		expect(localStorage.getItem('test-draft')).toBeNull();
	});
});
