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
 *   2. apps/docs/src/lib/server/registry.ts — beantwortet damit die CLI-Anfragen.
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
 * Artefakt-Liste einer Komponente: ausschließlich das, was der `code`-Block des
 * Modells DEKLARIERT. Leere Liste = die Komponente ist (noch) nicht über die CLI
 * beziehbar — dann darf weder die Registry noch die Doku-Seite einen `zds add`-
 * Befehl versprechen.
 *
 * **Kein Fallback mehr** (MIGRATIONSPLAN §4, Ausnahme 3): Früher galt implizit
 * „Pattern-CSS vorhanden ⇒ html-css/kanonisch". Bequem, aber still — eine
 * Komponente konnte ausgeliefert werden, ohne dass irgendwo stünde, WAS sie
 * ausliefert, und eine gelöschte/umbenannte Datei fiel niemandem auf. Seit PR 4
 * deklariert jede Komponente ihre Artefakte selbst; `code` ist im
 * `model.schema.json` PFLICHT, der Export bricht sonst ab. Aus einer stillen
 * Annahme ist damit eine laute Zusage geworden.
 *
 * @param {{ artefakte?: CodeArtefakt[] } | null | undefined} code — `spec.code` aus dem Doku-Modell.
 * @returns {CodeArtefakt[]}
 */
export function resolveArtefakte(code) {
	return code?.artefakte ?? [];
}
