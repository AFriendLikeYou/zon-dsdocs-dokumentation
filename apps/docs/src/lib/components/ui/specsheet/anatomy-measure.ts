// anatomy-measure.ts — reine (DOM-freie) Logik für Anatomy.svelte.
// Alles hier ist ohne Browser testbar; die DOM-Messung (querySelector +
// getBoundingClientRect) bleibt in der Komponente und ruft diese Teile auf.

import type { MasseValue, SpacingStufe } from '$types/spec';

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
/**
 * Provenance-Label eines Werts. Seit PR 7 wird AUCH der Normalfall („gemessen")
 * ausgeschrieben: vorher hieß „kein Label" implizit „gemessen" — das musste man
 * wissen. Eine Doku, die zwischen abgelesenem, gerechnetem und geschätztem Wert
 * unterscheidet, sollte diese Unterscheidung auch zeigen, nicht nur speichern.
 */
export const HERKUNFT_LABEL: Record<string, string> = {
	gemessen: 'gemessen',
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

/**
 * Wie `num`, aber STRENG: nur ein Wert, der aus nichts als einer Zahl besteht,
 * kommt zurück. `num` greift sich die erste Zahl aus einem Text und macht aus
 * „343 (Wide) · Cover 84 (Small 72)" ein sauber aussehendes 343 — für eine
 * Maßlinie, die anschließend behauptet, das Element sei 343 breit, ist das
 * genau die falsche Großzügigkeit. Nachmessen kann man nur einen Zahlenwert;
 * alles andere ist ein Satz und wird nicht als Maß gezeichnet.
 */
export const reineZahl = (s?: string): number | null => {
	const t = s?.trim();
	return t && /^\d+(?:\.\d+)?$/.test(t) ? Number(t) : null;
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

// Auf welcher Achse ein Zwischenraum liegt: 'horizontal' = nebeneinander
// (column-gap), 'vertikal' = gestapelt (row-gap). Ein Grid belegt beide, deshalb
// muss eine Zeile sagen können, welche sie meint.
export type Achse = 'vertikal' | 'horizontal';

// Ein gemessener Zwischenraum: die Fläche, die er einnimmt, plus seine WEITE —
// die Zahl, gegen die der Sollwert antritt. Beides fällt in derselben Messung an;
// sie getrennt zu berechnen wäre die Gelegenheit, dass sie auseinanderlaufen.
export type Zwischenraum = { streifen: Rect; abstand: number; achse: Achse };

// Der Zwischenraum zwischen ZWEI Rechtecken (in beliebiger Reihenfolge). Liegen
// sie neben- UND untereinander versetzt, gewinnt die Achse mit der größeren
// Lücke — bei gestapelten Geschwistern ist die horizontale rechnerisch negativ,
// die Entscheidung fällt also von selbst. Überlappen sie auf beiden Achsen
// (verschachtelt, kollabierter Rand), kommt null: „kein Zwischenraum" ist eine
// Antwort, ein erfundener Streifen wäre keine.
export function paarZwischenraum(
	a: RectLike,
	b: RectLike,
	base: { left: number; top: number }
): Zwischenraum | null {
	if (a.width <= 0 || a.height <= 0 || b.width <= 0 || b.height <= 0) return null;
	const [links, rechts] = a.left <= b.left ? [a, b] : [b, a];
	const [oben, unten] = a.top <= b.top ? [a, b] : [b, a];
	const hLuecke = rechts.left - links.right;
	const vLuecke = unten.top - oben.bottom;
	if (vLuecke > 0.5 && vLuecke >= hLuecke)
		return {
			abstand: vLuecke,
			achse: 'vertikal',
			streifen: {
				left: Math.min(a.left, b.left) - base.left,
				top: oben.bottom - base.top,
				width: Math.max(a.right, b.right) - Math.min(a.left, b.left),
				height: vLuecke
			}
		};
	if (hLuecke > 0.5)
		return {
			abstand: hLuecke,
			achse: 'horizontal',
			streifen: {
				left: links.right - base.left,
				top: Math.min(a.top, b.top) - base.top,
				width: hLuecke,
				height: Math.max(a.bottom, b.bottom) - Math.min(a.top, b.top)
			}
		};
	return null;
}

// Gap-Streifen aus benachbarten Kind-Rects berechnen: für jedes Paar der
// Zwischenraum (siehe `paarZwischenraum`). Nulldimensionierte Kinder werden
// ignoriert; die 0.5px-Schwelle filtert Rundungsrauschen. `achse` grenzt auf
// eine Achse ein — nötig bei Gittern, die column- UND row-gap belegen und für
// jede Achse einen eigenen Wert dokumentieren. Koordinaten relativ zur `base`
// des Specimen-Slots.
export function computeGapStrips(
	kids: RectLike[],
	base: { left: number; top: number },
	achse?: Achse
): Rect[] {
	const valid = kids.filter((r) => r.width > 0 && r.height > 0);
	const strips: Rect[] = [];
	for (let j = 0; j < valid.length - 1; j++) {
		const z = paarZwischenraum(valid[j], valid[j + 1], base);
		if (z && (!achse || z.achse === achse)) strips.push(z.streifen);
	}
	return strips;
}

// Innenabstand eines EINZELNEN Elements als Streifen (nicht der Wurzel — die
// kommt aus `masse.padding`). `richtung` grenzt auf eine Achse ein; fehlt sie,
// werden alle vier Seiten gezeigt. Seiten mit 0 fallen weg: ein Streifen ohne
// Dicke ist kein Abstand.
export function padStreifen(
	el: RectLike,
	pad: { t: number; r: number; b: number; l: number },
	base: { left: number; top: number },
	richtung?: 'vertikal' | 'horizontal'
): Rect[] {
	const links = el.left - base.left;
	const oben = el.top - base.top;
	const out: Rect[] = [];
	if (richtung !== 'horizontal') {
		if (pad.t > 0) out.push({ left: links, top: oben, width: el.width, height: pad.t });
		if (pad.b > 0)
			out.push({ left: links, top: oben + el.height - pad.b, width: el.width, height: pad.b });
	}
	if (richtung !== 'vertikal') {
		const innenOben = oben + (richtung === 'horizontal' ? 0 : pad.t);
		const innenHoehe = el.height - (richtung === 'horizontal' ? 0 : pad.t + pad.b);
		if (pad.l > 0) out.push({ left: links, top: innenOben, width: pad.l, height: innenHoehe });
		if (pad.r > 0)
			out.push({
				left: links + el.width - pad.r,
				top: innenOben,
				width: pad.r,
				height: innenHoehe
			});
	}
	return out;
}

/**
 * Die Stufe, die bei einer gegebenen Container-Breite gilt — die größte, deren
 * `abBreite` erreicht ist. Ohne Stufen (oder wenn keine greift) kommt null, und
 * es bleibt beim Kopfwert der Zeile.
 *
 * Warum überhaupt Stufen: Ein breakpoint-abhängiger Abstand hat nicht EINEN
 * Wert, sondern je Breite einen. Stand nur der breiteste im Modell, meldete die
 * Bühne auf einer schmalen Fläche eine Abweichung — und beschuldigte damit das
 * Pattern für etwas, das genau so dokumentiert ist. Die Alternative wäre, den
 * Breakpoint aus der Beschriftung zu lesen; ein Parser auf Freitext wäre aber
 * genau die Sorte Zusage, die beim ersten umformulierten Label bricht.
 */
export function stufeFuer(stufen: SpacingStufe[] | undefined, breite: number): SpacingStufe | null {
	if (!stufen?.length || !(breite > 0)) return null;
	let treffer: SpacingStufe | null = null;
	for (const s of stufen)
		if (breite >= s.abBreite && (!treffer || s.abBreite > treffer.abBreite)) treffer = s;
	return treffer;
}
