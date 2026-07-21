/**
 * Kern des Startseiten-Editors: Normalisieren, Validieren, byte-stabil Schreiben.
 *
 * Bewusst FREI von Node-/SvelteKit-Importen — derselbe Code läuft im Save
 * (+page.server.ts) und im Test. Muster: `tooling/content-validation.mjs` für die
 * Component-`content.json`, hier nur auf ein festes, kleines Schema gemünzt.
 *
 * Byte-Stabilität ist die zentrale Invariante: Laden → Speichern OHNE Änderung
 * muss die Datei unverändert lassen (kein Diff-Rauschen in PRs). Dafür sorgen
 * (a) die kanonische Schlüsselreihenfolge in `serializeLandingContent` und
 * (b) das Format der Exporter-Stubs (Tabs + Schluss-Newline).
 */
import type { LandingContent, LandingWelt } from '$types/landing';

/** Pfad der redaktionellen Datei, relativ zum Repo-Root (cwd des Servers). */
export const LANDING_CONTENT_PATH = 'src/routes/landing.content.json';

/** Obergrenzen — reine REDAKTIONS-Hinweise, keine technischen Limits. Sie halten
 *  die Startseite in ihrer gestalteten Form (Überschrift bricht, Lead passt in
 *  die 42ch-Spalte, CTA-Beschriftung sprengt den Button nicht). */
export const LIMITS = {
	seitentitel: 70,
	eyebrow: 48,
	ueberschriftZeile: 40,
	lead: 160,
	cta: 28,
	komponentenLabel: 24,
	fakt: 24,
	weltTitel: 32,
	weltBeschreibung: 220,
	wasIstNeuTitel: 32,
	alleAenderungen: 32,
	standPrefix: 16
} as const;

const str = (v: unknown, fallback = ''): string => (typeof v === 'string' ? v : fallback);

const strList = (v: unknown): string[] =>
	Array.isArray(v) ? v.filter((e): e is string => typeof e === 'string') : [];

function welt(v: unknown): LandingWelt {
	const o = (v ?? {}) as Record<string, unknown>;
	return { titel: str(o.titel), beschreibung: str(o.beschreibung), cta: str(o.cta) };
}

/**
 * Beliebiges JSON → vollständiges Modell. Unbekannte Schlüssel fallen weg
 * (das Schema ist geschlossen), fehlende werden zu Leerstrings/-Listen.
 */
export function normalizeLandingContent(raw: unknown): LandingContent {
	const o = (raw ?? {}) as Record<string, unknown>;
	const hero = (o.hero ?? {}) as Record<string, unknown>;
	const welten = (o.welten ?? {}) as Record<string, unknown>;
	const neu = (o.wasIstNeu ?? {}) as Record<string, unknown>;
	return {
		seitentitel: str(o.seitentitel),
		hero: {
			eyebrow: str(hero.eyebrow),
			ueberschriftZeilen: strList(hero.ueberschriftZeilen),
			lead: str(hero.lead),
			primaerCta: str(hero.primaerCta),
			sekundaerCta: str(hero.sekundaerCta),
			komponentenLabel: str(hero.komponentenLabel),
			fakten: strList(hero.fakten)
		},
		welten: { brandhub: welt(welten.brandhub), designSystem: welt(welten.designSystem) },
		wasIstNeu: {
			titel: str(neu.titel),
			alleAenderungen: str(neu.alleAenderungen),
			standPrefix: str(neu.standPrefix)
		}
	};
}

/**
 * Kanonische Serialisierung: feste Schlüsselreihenfolge (durch die Literal-
 * Reihenfolge in `normalizeLandingContent` gesetzt), Tabs, Schluss-Newline.
 * `normalize → serialize` ist idempotent und für die unveränderte Repo-Datei
 * byte-identisch (Test: landing-content.test.ts).
 */
export function serializeLandingContent(content: LandingContent): string {
	return JSON.stringify(normalizeLandingContent(content), null, '\t') + '\n';
}

/** Ein Validierungs-Befund: an welchem Feld, was ist los. */
export type LandingIssue = { feld: string; text: string };

function pflicht(out: LandingIssue[], feld: string, label: string, wert: string, max: number) {
	if (wert.trim() === '') out.push({ feld, text: `${label} darf nicht leer sein.` });
	else if (wert.length > max)
		out.push({ feld, text: `${label}: ${wert.length} Zeichen — empfohlen sind höchstens ${max}.` });
}

/**
 * Pflichtfelder + Längenhinweise. Beide Arten von Befund sperren das Speichern
 * (die Save-Bar zeigt die Zahl) — die Startseite ist gestaltet, ein 300-Zeichen-
 * Lead würde sie sichtbar brechen.
 */
export function validateLandingContent(content: LandingContent): LandingIssue[] {
	const out: LandingIssue[] = [];
	const c = normalizeLandingContent(content);

	pflicht(out, 'seitentitel', 'Seitentitel', c.seitentitel, LIMITS.seitentitel);

	pflicht(out, 'hero.eyebrow', 'Eyebrow', c.hero.eyebrow, LIMITS.eyebrow);
	if (c.hero.ueberschriftZeilen.length === 0)
		out.push({ feld: 'hero.ueberschriftZeilen', text: 'Die Überschrift braucht mindestens eine Zeile.' });
	c.hero.ueberschriftZeilen.forEach((zeile, i) =>
		pflicht(
			out,
			`hero.ueberschriftZeilen.${i}`,
			`Überschrift Zeile ${i + 1}`,
			zeile,
			LIMITS.ueberschriftZeile
		)
	);
	pflicht(out, 'hero.lead', 'Lead', c.hero.lead, LIMITS.lead);
	pflicht(out, 'hero.primaerCta', 'Primärer CTA', c.hero.primaerCta, LIMITS.cta);
	pflicht(out, 'hero.sekundaerCta', 'Sekundärer CTA', c.hero.sekundaerCta, LIMITS.cta);
	pflicht(
		out,
		'hero.komponentenLabel',
		'Label der Komponenten-Zahl',
		c.hero.komponentenLabel,
		LIMITS.komponentenLabel
	);
	c.hero.fakten.forEach((fakt, i) =>
		pflicht(out, `hero.fakten.${i}`, `Stichwort ${i + 1}`, fakt, LIMITS.fakt)
	);

	for (const [key, label] of [
		['brandhub', 'Brandhub'],
		['designSystem', 'Design-System']
	] as const) {
		const w = c.welten[key];
		pflicht(out, `welten.${key}.titel`, `${label} — Titel`, w.titel, LIMITS.weltTitel);
		pflicht(
			out,
			`welten.${key}.beschreibung`,
			`${label} — Beschreibung`,
			w.beschreibung,
			LIMITS.weltBeschreibung
		);
		pflicht(out, `welten.${key}.cta`, `${label} — CTA`, w.cta, LIMITS.cta);
	}

	pflicht(out, 'wasIstNeu.titel', '„Was ist neu" — Titel', c.wasIstNeu.titel, LIMITS.wasIstNeuTitel);
	pflicht(
		out,
		'wasIstNeu.alleAenderungen',
		'„Was ist neu" — Link-Beschriftung',
		c.wasIstNeu.alleAenderungen,
		LIMITS.alleAenderungen
	);
	pflicht(
		out,
		'wasIstNeu.standPrefix',
		'„Was ist neu" — Vorspann der Datumszeile',
		c.wasIstNeu.standPrefix,
		LIMITS.standPrefix
	);

	return out;
}
