/**
 * artefakte.mjs — EINE Regel dafür, welche Code-Artefakte eine Komponente hat.
 *
 * Die Registry (`/api/registry`, src/lib/server/registry.ts) und die Bezugs-Sektion
 * „Komponente holen" auf der Doku-Seite müssen dieselben Formate nennen — sonst
 * verspricht die Seite ein Format, das `zds add` nicht liefert. Damit es keine
 * zweite Datenquelle gibt, lebt die Regel hier und wird von BEIDEN Seiten benutzt:
 *
 *   1. tooling/zeit-de-exporter/export.mjs — schreibt das Ergebnis als `code`-Block
 *      in spec.generated.ts (die Doku-Seite liest `spec.code.artefakte`).
 *   2. src/lib/server/registry.ts          — beantwortet damit die CLI-Anfragen.
 *
 * Dasselbe Muster wie tooling/content-validation.mjs (geteilter Kern zwischen
 * Gate-Skript und SvelteKit-Server): ein Node-.mjs ohne Repo-Abhängigkeiten, das
 * `src/` importieren darf — nicht umgekehrt.
 */

/**
 * @typedef {'html-css' | 'web-component' | 'svelte'} CodeFormat
 * @typedef {'kanonisch' | 'portiert' | 'entwurf'} CodeStatus
 * @typedef {{ format: CodeFormat, dateien: string[], status: CodeStatus }} CodeArtefakt
 */

/**
 * Das implizite Artefakt jeder Bestandskomponente: das unscoped Pattern-CSS ist
 * die kanonische Quelle des ZEIT-Designsystems. So sind alle Komponenten ohne
 * Änderung an ihrem model.json Registry-fähig.
 * @type {CodeArtefakt}
 */
export const PATTERN_ARTEFAKT = {
	format: 'html-css',
	dateien: ['pattern.css'],
	status: 'kanonisch'
};

/**
 * Artefakt-Liste einer Komponente: der deklarierte `code`-Block gewinnt, sonst
 * greift der pattern.css-Fallback. Leere Liste = die Komponente ist (noch) nicht
 * über die CLI beziehbar — dann darf weder die Registry noch die Doku-Seite einen
 * `zds add`-Befehl versprechen.
 *
 * @param {{ artefakte?: CodeArtefakt[] } | null | undefined} code — `spec.code` aus dem Doku-Modell.
 * @param {boolean} hatPatternCss — existiert eine pattern.css im Komponenten-Ordner?
 * @returns {CodeArtefakt[]}
 */
export function resolveArtefakte(code, hatPatternCss) {
	const deklariert = code?.artefakte;
	if (deklariert?.length) return deklariert;
	return hatPatternCss ? [PATTERN_ARTEFAKT] : [];
}
