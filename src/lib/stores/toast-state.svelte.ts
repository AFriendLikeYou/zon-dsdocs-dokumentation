import { getContext, onDestroy, setContext } from 'svelte';
import type { ToastType } from '$types/global';

/** Maximal gleichzeitig sichtbare Toasts — ein vierter verdrängt den ältesten. */
const MAX_VISIBLE = 3;
/** Standard-Anzeigedauer, bis ein Toast sich selbst entfernt. */
const DEFAULT_DURATION_MS = 5000;

export class ToastState {
	toasts = $state<ToastType[]>([]);
	/** Auto-Dismiss-Timer je Toast-ID. */
	timeouts = new Map<string, ReturnType<typeof setTimeout>>();

	constructor() {
		// onDestroy braucht Komponenten-Kontext; im Unit-Test wird die Klasse ohne
		// diesen instanziiert → dann still überspringen, Cleanup läuft via dispose().
		try {
			onDestroy(() => this.dispose());
		} catch {
			// außerhalb einer Komponente (Tests) — kein Lifecycle zu registrieren.
		}
	}

	add(
		title: string,
		message: string,
		durationMs = DEFAULT_DURATION_MS,
		action?: ToastType['action']
	) {
		// Dedupe: identischer Titel+Text bereits sichtbar → nur Zähler hoch und
		// Timer neu starten, statt einen weiteren Toast zu stapeln.
		const existing = this.toasts.find((t) => t.title === title && t.message === message);
		if (existing) {
			existing.count += 1;
			this.startTimer(existing.id, durationMs);
			return;
		}

		const id = crypto.randomUUID();
		this.toasts.push({ id, title, message, count: 1, action });

		// Kappung: ältesten (vordersten) Toast verdrängen, wenn das Limit reißt.
		while (this.toasts.length > MAX_VISIBLE) {
			this.remove(this.toasts[0].id);
		}

		this.startTimer(id, durationMs);
	}

	remove(id: string) {
		this.clearTimer(id);
		this.toasts = this.toasts.filter((toast) => toast.id !== id);
	}

	/** Setzt den Auto-Dismiss-Timer eines Toasts neu (löscht den alten zuerst). */
	private startTimer(id: string, durationMs: number) {
		this.clearTimer(id);
		this.timeouts.set(
			id,
			setTimeout(() => this.remove(id), durationMs)
		);
	}

	private clearTimer(id: string) {
		const timeout = this.timeouts.get(id);
		if (timeout) {
			clearTimeout(timeout);
			this.timeouts.delete(id);
		}
	}

	/** Alle Timer stoppen — bei Komponenten-Zerstörung und im Test. */
	dispose() {
		for (const timeout of this.timeouts.values()) {
			clearTimeout(timeout);
		}
		this.timeouts.clear();
	}
}

const TOAST_KEY = Symbol('TOAST');

export function setToastState() {
	return setContext(TOAST_KEY, new ToastState());
}

export function getToastState() {
	return getContext<ReturnType<typeof setToastState>>(TOAST_KEY);
}
