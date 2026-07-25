/**
 * merge.ts — Maschine + Mensch zu EINEM Spec zusammenführen.
 *
 * Vorher stand in jeder generierten Seite `{ ...generated, ...content }`. Das war
 * bequem und genau deshalb gefährlich: JEDES Feld war stillschweigend
 * überschreibbar. Trug jemand `masse` in die Redaktionsdatei, gewann das
 * kommentarlos — und wenn Figma den Wert später korrigierte, maskierte der alte
 * Eintrag den neuen LAUTLOS. Real passiert beim `text-button`: Figma misst die
 * Zeilenhöhe (18) ohne Padding, dokumentiert waren die gemessenen 34, und nichts
 * im Repo hielt fest, dass hier überhaupt widersprochen wurde.
 *
 * Seit PR 7 (MIGRATIONSPLAN §2.3) gilt:
 *   ① MASCHINE (masse, tokens, varianten …) — nur über einen `overrides`-Eintrag
 *      mit `grund`, `belegt` und `maschinenwert` überschreibbar.
 *   ② MENSCH (zweck, doDont, a11y …)        — content gewinnt wie bisher.
 *   ③ STAMM (name, figma, code …)           — gar nicht überschreibbar.
 *
 * Diese Funktion ist REIN: sie mutiert weder `generated` (das ist ein importiertes
 * Modul-Objekt!) noch `content`, und sie wirft nie — eine kaputte Redaktionsdatei
 * darf keine Seite abschießen. Befunde meldet stattdessen `tooling/check-content.mjs`
 * im Gate.
 */
import type { ComponentSpec, Overrides } from '$types/spec';
import { CONTENT_FELDER_SET, pfadIstMaschinenfeld } from './feldklassen';

type Unbekannt = Record<string, unknown>;

const istObjekt = (v: unknown): v is Unbekannt =>
	v !== null && typeof v === 'object' && !Array.isArray(v);

/**
 * Wert an einem Punkt-Pfad setzen — nicht-mutierend entlang des Pfads: jede
 * berührte Ebene wird flach kopiert, alles andere bleibt geteilt. Zeigt der Pfad
 * ins Leere (fehlendes Zwischenobjekt, oder ein String da, wo ein Objekt stehen
 * müsste), passiert NICHTS: ein Override darf keine Struktur erfinden.
 *
 * @returns true, wenn gesetzt wurde.
 */
export function setzePfadWert(ziel: Unbekannt, pfad: string, wert: unknown): boolean {
	const segmente = pfad.split('.');
	const blatt = segmente.pop();
	if (!blatt) return false;
	let cur: Unbekannt = ziel;
	for (const seg of segmente) {
		const naechste = cur[seg];
		if (!istObjekt(naechste) && !Array.isArray(naechste)) return false;
		const kopie = Array.isArray(naechste) ? [...naechste] : { ...(naechste as Unbekannt) };
		cur[seg] = kopie;
		cur = kopie as Unbekannt;
	}
	// Nur EXISTIERENDE Blätter überschreiben — sonst legte ein Tippfehler im Pfad
	// stillschweigend ein neues Feld an, das nie jemand rendert.
	if (!(blatt in cur)) return false;
	cur[blatt] = wert;
	return true;
}

/**
 * Führt Maschinen-Spec und Redaktion zusammen.
 *
 * @param generated `spec.generated.ts` — der Maschinen-Anteil (nie mutiert).
 * @param content   `content/components/<slug>.json` — die Redaktion.
 */
export function mergeSpec(generated: unknown, content: unknown): ComponentSpec {
	const basis: Unbekannt = istObjekt(generated) ? { ...generated } : {};
	if (!istObjekt(content)) return basis as ComponentSpec;

	// ② Klasse-2-Felder: content gewinnt, wie eh und je. Alles andere wird
	// IGNORIERT — ein einredigiertes `masse` kippt keinen Maschinenwert mehr.
	for (const [key, value] of Object.entries(content)) {
		if (key === 'overrides') continue;
		if (CONTENT_FELDER_SET.has(key)) basis[key] = value;
	}

	// ① Begründete Widersprüche anwenden.
	const overrides = istObjekt(content.overrides) ? (content.overrides as Overrides) : null;
	if (overrides) {
		for (const [pfad, eintrag] of Object.entries(overrides)) {
			if (!istObjekt(eintrag) || eintrag.wert === undefined) continue;
			// Overrides gelten NUR für Maschinen-Felder. Ein Widerspruch gegen ein
			// redaktionelles Feld wäre sinnlos (dort gewinnt content ohnehin), einer
			// gegen ein Stammdatum verboten.
			if (!pfadIstMaschinenfeld(pfad)) continue;
			setzePfadWert(basis, pfad, eintrag.wert);
		}
		// Die Widersprüche bleiben am Spec stehen: die Seite soll einen bestrittenen
		// Wert AUSWEISEN können, statt ihn wie einen Messwert auszugeben.
		basis.overrides = overrides;
	}

	return basis as ComponentSpec;
}
