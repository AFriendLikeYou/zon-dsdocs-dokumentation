/**
 * contrast.ts — reine WCAG-2.1-Kontrast-Berechnung.
 *
 * Bewusst render- und framework-unabhängig (keine DOM-/Svelte-Abhängigkeit),
 * damit die Logik testbar bleibt und die Komponente sie nur noch mit live
 * aufgelösten Werten füttert. Farbwerte kommen aus getComputedStyle und können
 * daher `#rgb`, `#rrggbb`, `rgb(...)` oder `rgba(...)` (mit Alpha) sein.
 */

/** Farbe mit optionalem Alpha-Kanal (0–1). Vollflächig opak = a: 1. */
export type Rgba = { r: number; g: number; b: number; a: number };

/**
 * Parst einen CSS-Farbstring zu {r,g,b,a}. Unterstützt Hex (#rgb/#rrggbb/#rrggbbaa),
 * rgb()/rgba() (mit Komma- oder Space-Syntax). Gibt null zurück, wenn nicht parsebar
 * (z. B. leerer String, weil ein Token nicht existiert).
 */
export function parseColor(input: string): Rgba | null {
	if (!input) return null;
	const str = input.trim();

	// Hex: #rgb, #rgba, #rrggbb, #rrggbbaa
	if (str.startsWith('#')) {
		let hex = str.slice(1);
		if (hex.length === 3 || hex.length === 4) {
			hex = hex
				.split('')
				.map((c) => c + c)
				.join('');
		}
		if (hex.length !== 6 && hex.length !== 8) return null;
		const r = parseInt(hex.slice(0, 2), 16);
		const g = parseInt(hex.slice(2, 4), 16);
		const b = parseInt(hex.slice(4, 6), 16);
		const a = hex.length === 8 ? parseInt(hex.slice(6, 8), 16) / 255 : 1;
		if ([r, g, b].some((n) => Number.isNaN(n))) return null;
		return { r, g, b, a };
	}

	// rgb()/rgba() — Komma- oder moderne Space/Slash-Syntax
	const match = str.match(/^rgba?\(([^)]+)\)$/i);
	if (match) {
		const parts = match[1]
			.split(/[,/]/)
			.map((p) => p.trim())
			.filter(Boolean);
		if (parts.length < 3) return null;
		const chan = (v: string) =>
			v.endsWith('%') ? Math.round((parseFloat(v) / 100) * 255) : parseFloat(v);
		const r = chan(parts[0]);
		const g = chan(parts[1]);
		const b = chan(parts[2]);
		let a = 1;
		if (parts[3] != null) {
			a = parts[3].endsWith('%') ? parseFloat(parts[3]) / 100 : parseFloat(parts[3]);
		}
		if ([r, g, b, a].some((n) => Number.isNaN(n))) return null;
		return { r, g, b, a };
	}

	return null;
}

/**
 * Compositet eine (evtl. teil-transparente) Vordergrundfarbe über eine als
 * opak angenommene Hintergrundfarbe (Standard-„source-over"-Alpha-Blending).
 * Ergebnis ist immer opak (a: 1) und für die Luminanz-Rechnung geeignet.
 */
export function composite(fg: Rgba, bgOpaque: Rgba): Rgba {
	const a = fg.a;
	return {
		r: Math.round(fg.r * a + bgOpaque.r * (1 - a)),
		g: Math.round(fg.g * a + bgOpaque.g * (1 - a)),
		b: Math.round(fg.b * a + bgOpaque.b * (1 - a)),
		a: 1
	};
}

/** sRGB-Kanal (0–255) → linearer Wert nach WCAG 2.1. */
function linearize(channel: number): number {
	const c = channel / 255;
	return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
}

/** Relative Luminanz (0–1) einer opaken Farbe nach WCAG 2.1. */
export function relativeLuminance({ r, g, b }: Rgba): number {
	return 0.2126 * linearize(r) + 0.7152 * linearize(g) + 0.0722 * linearize(b);
}

/**
 * WCAG-2.1-Kontrastverhältnis (1–21) zwischen zwei opaken Farben.
 * Reihenfolge egal — die Formel normalisiert heller/dunkler selbst.
 */
export function contrastRatio(a: Rgba, b: Rgba): number {
	const la = relativeLuminance(a);
	const lb = relativeLuminance(b);
	const lighter = Math.max(la, lb);
	const darker = Math.min(la, lb);
	return (lighter + 0.05) / (darker + 0.05);
}

/**
 * Kontrast eines (evtl. transparenten) Text-Werts auf einem Hintergrund-Wert,
 * ausgehend von CSS-Strings. Der Hintergrund wird als opak angenommen; ist er
 * selbst transparent, wird er der Robustheit halber über Weiß gelegt.
 * Gibt null zurück, wenn eine der Farben nicht parsebar ist.
 */
export function contrastForPair(textColor: string, bgColor: string): number | null {
	const text = parseColor(textColor);
	const bg = parseColor(bgColor);
	if (!text || !bg) return null;

	const bgOpaque = bg.a < 1 ? composite(bg, { r: 255, g: 255, b: 255, a: 1 }) : bg;
	const textOpaque = text.a < 1 ? composite(text, bgOpaque) : text;
	return contrastRatio(textOpaque, bgOpaque);
}

export type ContrastLevel = 'AAA' | 'AA' | 'AA Large' | 'Fail';

/** WCAG-Schwellen: 7 = AAA (Fließtext), 4.5 = AA, 3 = AA Large / Nicht-Text. */
export function classifyContrast(ratio: number): ContrastLevel {
	if (ratio >= 7) return 'AAA';
	if (ratio >= 4.5) return 'AA';
	if (ratio >= 3) return 'AA Large';
	return 'Fail';
}

/** Auf eine Nachkommastelle gerundetes Verhältnis, z. B. „12.6:1". */
export function formatRatio(ratio: number): string {
	return `${ratio.toFixed(1)}:1`;
}
