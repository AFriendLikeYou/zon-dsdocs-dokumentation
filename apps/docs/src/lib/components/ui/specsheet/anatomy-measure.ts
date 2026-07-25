// anatomy-measure.ts — reine (DOM-freie) Logik für Anatomy.svelte.
// Alles hier ist ohne Browser testbar; die DOM-Messung (querySelector +
// getBoundingClientRect) bleibt in der Komponente und ruft diese Teile auf.

import type { MasseValue } from '$types/spec';

// Live gemessene Fläche relativ zum Specimen-Slot (Part-Outline / Gap-Streifen).
export type Rect = { left: number; top: number; width: number; height: number };

// Minimales Rechteck-Interface für die Gap-Berechnung — DOMRect erfüllt es 1:1,
// aber so lässt sich die Streifen-Logik auch mit Fixtures testen.
export type RectLike = {
	left: number;
	top: number;
	right: number;
	bottom: number;
	width: number;
	height: number;
};

// Figma-Soll vs. gerendertes Ist (Drift-Befund).
export type Drift = { soll: string; ist: string };

// Artboard-Maße zeigen IMMER px (Blueprint-Konvention + wenig Platz in den Ecken).
export const apx = (m?: MasseValue): string => (m == null ? '' : typeof m === 'string' ? m : m.px);

// Padding-Kasten aus dem px-String parsen („10 · 16" = vertikal · horizontal,
// „t r b l" oder Einzelwert). Gelingt der Parse, zeigt die Maß-Ansicht den
// Innenabstand ALS getönte Streifen IM Specimen — die Redline sitzt damit am
// Ort des Geschehens statt als kontextlose Pille über dem Bauteil.
export function parsePad(px?: string): { t: number; r: number; b: number; l: number } | null {
	if (!px) return null;
	const n = (px.match(/\d+(?:\.\d+)?/g) ?? []).map(Number);
	if (n.length === 1) return { t: n[0], r: n[0], b: n[0], l: n[0] };
	if (n.length === 2) return { t: n[0], r: n[1], b: n[0], l: n[1] };
	if (n.length === 4) return { t: n[0], r: n[1], b: n[2], l: n[3] };
	return null;
}

// Beschriftung „Term — Beschreibung" in Lead + Rest zerlegen (präzisere Legende).
export function splitLabel(text: string): { lead: string; rest: string } {
	const m = text.match(/^(.+?)\s+[—–]\s+(.+)$/);
	return m ? { lead: m[1], rest: m[2] } : { lead: '', rest: text };
}

// Deutsches Label je Callout-Rolle (dezentes Typ-Badge in der Legende).
export const ART_LABEL: Record<string, string> = {
	instance: 'Instanz',
	text: 'Text',
	slot: 'Slot',
	container: 'Container',
	structural: 'Struktur'
};
// Provenance-Badge: nur Abweichungen markieren (gemessen = Normalfall, kein Badge).
export const HERKUNFT_LABEL: Record<string, string> = {
	abgeleitet: '≈ abgeleitet',
	geschätzt: '≈ geschätzt'
};
// Richtungs-Zusatz fürs Label („oben · unten" statt „vertikal" dekodieren müssen).
export const RICHTUNG_LABEL: Record<string, string> = {
	vertikal: 'oben · unten',
	horizontal: 'links · rechts'
};

// ——— Figma ↔ Code Drift-Check ———
// Vergleicht DEKLARIERTE Werte (getComputedStyle: padding/gap/radius — die
// CSS-Absicht) mit dem Figma-Sollwert aus model.json. Bewusst KEINE
// Text-Bounding-Boxen: Line-Box-Metriken unterscheiden sich systematisch
// zwischen Figma und Browser (kein echter Drift). Höhe als einzige
// Box-Messung (Buttons/Cells mit fixem Maß), Toleranz ±1px, erst nach
// document.fonts.ready (Fallback-Font-Metriken würden falsch alarmieren).
export const TOL = 1;

export const num = (s?: string): number | null => {
	const m = s?.match(/\d+(?:\.\d+)?/);
	return m ? Number(m[0]) : null;
};

export function checkDrift(
	key: string,
	soll: number | null,
	ist: number,
	out: Record<string, Drift>
): void {
	if (soll == null) return;
	if (Math.abs(soll - ist) > TOL) out[key] = { soll: String(soll), ist: String(Math.round(ist)) };
}

// Gap-Streifen aus benachbarten Kind-Rects berechnen: für jedes Paar entweder
// ein horizontaler Zwischenraum (b rechts von a) oder ein vertikaler (b unter a).
// Nulldimensionierte Kinder werden ignoriert; die 0.5px-Schwelle filtert
// Rundungsrauschen (nur echte Lücken zählen). Koordinaten relativ zur `base`
// des Specimen-Slots.
export function computeGapStrips(kids: RectLike[], base: { left: number; top: number }): Rect[] {
	const valid = kids.filter((r) => r.width > 0 && r.height > 0);
	const strips: Rect[] = [];
	for (let j = 0; j < valid.length - 1; j++) {
		const a = valid[j];
		const b = valid[j + 1];
		if (b.left - a.right > 0.5) {
			// horizontaler Gap: Streifen zwischen rechter Kante von a und linker von b
			strips.push({
				left: a.right - base.left,
				top: Math.min(a.top, b.top) - base.top,
				width: b.left - a.right,
				height: Math.max(a.bottom, b.bottom) - Math.min(a.top, b.top)
			});
		} else if (b.top - a.bottom > 0.5) {
			strips.push({
				left: Math.min(a.left, b.left) - base.left,
				top: a.bottom - base.top,
				width: Math.max(a.right, b.right) - Math.min(a.left, b.left),
				height: b.top - a.bottom
			});
		}
	}
	return strips;
}
