import { test, expect, type Page } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { prepare, gotoStable } from './support/stabilize';

/**
 * Bühnen-Geometrie — misst, ob die Specimens auf den Doku-Bühnen so LIEGEN, wie
 * das Modell es zusagt.
 *
 * ANLASS: Auf der Accordion-Seite standen zwei Aufklapper NEBENEINANDER (je 269px),
 * obwohl eine Liste gemeint war. Die Bühne ist `display: flex; flex-wrap: wrap`,
 * und die volle Breite bekam eine Instanz nur als `:only-child` — eine füllte die
 * Zeile, zwei teilten sie sich. Das Signal lag längst vor (`render.align: "fill"`
 * im Modell, aus dem der Playground seine Bühne korrekt ableitete), der
 * Beispiel-Block bekam es nur nie gereicht. Gemerkt hat das niemand: Es gab keine
 * Prüfung, die Geometrie MISST.
 *
 * WARUM E2E UND NICHT UNIT: Der Fehler saß in einer CSS-Regel
 * (`.example-block__instance:only-child`), nicht in der Verdrahtung. Ein
 * Unit-Test hätte höchstens prüfen können, ob die Prop durchgereicht wird — und
 * wäre grün geblieben, weil es die Prop damals gar nicht gab. jsdom rechnet kein
 * Layout: `getBoundingClientRect()` liefert dort durchweg Nullen. Wer wissen will,
 * wo etwas LIEGT, braucht eine echte Engine. Deshalb Playwright.
 *
 * VIER REGELN, bewusst wenige — jede fängt einen Fehler, den wir schon hatten oder
 * der still bliebe:
 *
 *   R1  Messumgebung plausibel — bricht laut ab, statt Unsinn zu messen.
 *   R2  Kein Specimen ist 0×0 — ein leeres Specimen verschwindet sonst lautlos.
 *   R3  Nichts läuft aus der Bühne heraus — Bühnen mit `overflow: hidden`
 *       schneiden sonst still ab.
 *   R4  `align: "fill"` ⇒ Instanzen STAPELN (keine zwei in einer Zeile)  ← Accordion
 *   R5  `align: "fill"` ⇒ Instanz nimmt die volle Bühnenbreite            ← Accordion
 *
 * Bewusst NICHT geprüft: dass `center`-Instanzen in EINER Zeile stehen. Ob sie
 * umbrechen, hängt legitim von ihrer Anzahl und der Fensterbreite ab — eine Regel
 * darüber wäre bei jeder Textänderung flackerig, und der Umbruch ist dort kein
 * Fehler, sondern der Zweck von `flex-wrap`.
 *
 * Der Katalog (`/product/components`) ist bewusst NICHT dabei: Seine
 * `.catalog-preview` ist ein 16:9-Daumennagel, der absichtlich beschneidet
 * (`overflow: hidden` + `scale(0.9)`, siehe static/global.css). Dort wäre R3 kein
 * Befund, sondern die Absicht.
 */

// ── Die Zusage: `render.align` aus dem kanonischen Modell ────────────────────
// Gelesen wird das PAKET (`packages/components/src/<slug>/model.json`), nicht das
// Generat — die Prüfung soll gegen die Quelle laufen, nicht gegen deren Abbild.
// Fiele der Exporter aus, dürfte die Prüfung das nicht mitmachen.
const PAKET_ORDNER = path.resolve(
	path.dirname(fileURLToPath(import.meta.url)),
	'../../../packages/components/src'
);

type Zusage = { slug: string; align: 'center' | 'fill' };

const ZUSAGEN: Zusage[] = fs
	.readdirSync(PAKET_ORDNER)
	.filter((slug) => fs.existsSync(path.join(PAKET_ORDNER, slug, 'model.json')))
	.map((slug) => {
		const modell = JSON.parse(fs.readFileSync(path.join(PAKET_ORDNER, slug, 'model.json'), 'utf8'));
		return { slug, align: modell.render?.align === 'fill' ? 'fill' : 'center' } as Zusage;
	})
	.sort((a, b) => a.slug.localeCompare(b.slug));

// Ein leerer Katalog wäre der stillste Fehlschlag von allen: Die Suite liefe
// durch, ohne irgendetwas geprüft zu haben.
test('Der Komponenten-Katalog ist nicht leer', () => {
	expect(ZUSAGEN.length).toBeGreaterThan(5);
});

// ── Was gemessen wird ───────────────────────────────────────────────────────
type Kasten = { links: number; rechts: number; oben: number; unten: number; breite: number; hoehe: number };

type Buehne = {
	/** Sprechender Name für die Fehlermeldung. */
	art: 'Beispiel' | 'Playground' | 'Anatomie' | 'Varianten-Raster';
	/** Wievielte Bühne dieser Art auf der Seite (0-basiert) — lokalisiert den Befund. */
	nr: number;
	/** Innenmaß der Bühne ohne Padding — daran misst sich „volle Breite". */
	inhaltLinks: number;
	inhaltRechts: number;
	inhaltBreite: number;
	/** Die Hüllen, die die Bühne dem Specimen zuteilt — ihre Breite verantwortet die Bühne. */
	huellen: Kasten[];
	/** Die tatsächlich gerenderten Specimen-Wurzeln — ihre Breite verantwortet die Komponente. */
	specimen: Kasten[];
};

/**
 * Alle Specimen-Bühnen einer Component-Seite vermessen.
 *
 * Gemessen wird die Specimen-WURZEL (das erste Element in der Hülle), nicht die
 * Hülle selbst: Beim Accordion-Fehler waren beide 269px breit, aber es ist das
 * Specimen, das der Leser sieht — eine Hülle kann volle Breite haben und ihr
 * Inhalt trotzdem zusammenfallen.
 */
async function vermesse(page: Page): Promise<Buehne[]> {
	return page.evaluate(() => {
		const kasten = (el: Element) => {
			const b = el.getBoundingClientRect();
			return {
				links: b.left,
				rechts: b.right,
				oben: b.top,
				unten: b.bottom,
				breite: b.width,
				hoehe: b.height
			};
		};

		const buehnen: {
			art: string;
			nr: number;
			inhaltLinks: number;
			inhaltRechts: number;
			inhaltBreite: number;
			huellen: ReturnType<typeof kasten>[];
			specimen: ReturnType<typeof kasten>[];
		}[] = [];

		const sammle = (art: string, buehnenSel: string, huelleSel: string) => {
			document.querySelectorAll(buehnenSel).forEach((el, nr) => {
				const b = el.getBoundingClientRect();
				const cs = getComputedStyle(el);
				const padL = parseFloat(cs.paddingLeft) || 0;
				const padR = parseFloat(cs.paddingRight) || 0;
				const randL = parseFloat(cs.borderLeftWidth) || 0;
				const randR = parseFloat(cs.borderRightWidth) || 0;
				const huellen = [...el.querySelectorAll(huelleSel)];
				buehnen.push({
					art,
					nr,
					inhaltLinks: b.left + randL + padL,
					inhaltRechts: b.right - randR - padR,
					inhaltBreite: b.width - randL - randR - padL - padR,
					huellen: huellen.map(kasten),
					// Die Wurzel je Hülle. Textknoten zählen nicht — eine Hülle ohne
					// Element-Kind ist genau der Fall „Specimen still verschwunden".
					specimen: huellen
						.map((h) => h.firstElementChild)
						.filter((k): k is Element => k !== null)
						.map(kasten)
				});
			});
		};

		// Die vier Bühnen der Component-Seite. Die Hüllen-Selektoren sind der
		// Vertrag zwischen dieser Prüfung und den Bühnen-Komponenten — ändert sich
		// dort eine Klasse, meldet R2 „keine Specimens gefunden" statt still
		// nichts zu prüfen.
		sammle('Beispiel', '.example-block__stage', ':scope > .example-block__instance');
		sammle('Playground', '.playground__stage', '.pg-preview');
		sammle('Anatomie', '.anatomy-artboard', '.slot');
		sammle('Varianten-Raster', '.sgrid', '.stage');

		return buehnen;
	}) as Promise<Buehne[]>;
}

/** Untergrenze, unterhalb derer eine Bühne nicht gelayoutet, sondern kaputt gemessen ist. */
const BUEHNE_MINDESTBREITE = 200;

/**
 * Warten, bis die Bühnen wirklich gelayoutet sind.
 *
 * `gotoStable` wartet auf networkidle, Fonts und eine konstante Seitenhöhe — das
 * reicht hier nicht. Die Suite läuft gegen den DEV-Server, der jede Seite beim
 * ersten Aufruf kompiliert; in diesem Moment steht die Seite kurz OHNE
 * Sidebar-Breite da und ist dabei völlig ruhig. Die Höhe ist stabil, die Breite
 * falsch — und wer dann misst, misst die Kompilierung.
 *
 * Deshalb: auf die Bedingung warten, statt die Toleranz aufzuweichen. Tritt sie
 * nie ein, läuft die Wartezeit ab und R1 sagt anschließend, was los ist.
 */
async function warteAufBuehnen(page: Page) {
	await page
		.waitForFunction(
			(min) => {
				const el = document.querySelector(
					'.example-block__stage, .playground__stage, .anatomy-artboard, .sgrid'
				);
				return !!el && el.getBoundingClientRect().width > min;
			},
			BUEHNE_MINDESTBREITE,
			{ timeout: 15_000 }
		)
		.catch(() => {
			/* Nicht hier werfen — R1 formuliert den Befund verständlicher. */
		});
}

/** Zwei Kästen teilen sich eine Zeile, wenn sich ihre vertikalen Bereiche überlappen. */
function inGleicherZeile(a: Kasten, b: Kasten): boolean {
	// 1px Spiel: Nachbarn in einer Spalte berühren sich rechnerisch gelegentlich.
	return a.oben < b.unten - 1 && b.oben < a.unten - 1;
}

const px = (n: number) => `${Math.round(n)}px`;

for (const { slug, align } of ZUSAGEN) {
	test(`${slug} — Specimens liegen wie zugesagt (align: ${align})`, async ({ page }) => {
		await prepare(page, 'light');
		await gotoStable(page, `/product/components/${slug}`, 'light');
		await warteAufBuehnen(page);

		const buehnen = await vermesse(page);

		// ── R1 · Messumgebung ───────────────────────────────────────────────
		// Eine Bühne mit Breite 0 ist fast nie ein Layout-Fehler, sondern eine
		// kaputte Messung (Fenster ohne Breite, Seite nicht fertig, falscher
		// Selektor). Das laut zu sagen, spart die Suche am falschen Ende.
		expect(buehnen.length, `${slug}: keine einzige Specimen-Bühne gefunden`).toBeGreaterThan(0);
		for (const b of buehnen) {
			expect(
				b.inhaltBreite,
				`${slug} · ${b.art} #${b.nr}: Bühne ist ${px(b.inhaltBreite)} breit — das ist die Messumgebung, nicht das Layout (Fensterbreite? Seite fertig kompiliert?)`
			).toBeGreaterThan(BUEHNE_MINDESTBREITE);
		}

		// Ab hier `expect.soft`: EIN Lauf soll ALLE Befunde einer Seite zeigen.
		// Bei harten Assertions bricht der Test beim ersten Verstoß ab, und wer ihn
		// behebt, findet den nächsten erst im nächsten Lauf — bei einer Prüfung, die
		// Layout diagnostiziert, ist das die falsche Reihenfolge. R1 oben bleibt
		// hart: Stimmt die Messumgebung nicht, ist alles Weitere Rauschen.
		for (const b of buehnen) {
			// ── R2 · Kein Specimen ist 0×0 ──────────────────────────────────
			expect
				.soft(
					b.specimen.length,
					`${slug} · ${b.art} #${b.nr}: ${b.huellen.length} Hülle(n), aber ${b.specimen.length} Specimen — Markup fehlt oder ist leer`
				)
				.toBe(b.huellen.length);

			for (const [i, s] of b.specimen.entries()) {
				expect
					.soft(
						Math.min(s.breite, s.hoehe),
						`${slug} · ${b.art} #${b.nr}, Specimen ${i + 1}: ${px(s.breite)}×${px(s.hoehe)} — ein Specimen ohne Ausdehnung verschwindet lautlos`
					)
					.toBeGreaterThan(0);

				// ── R3 · Nichts läuft aus der Bühne heraus ──────────────────
				// Geometrisch statt über scrollWidth: Der Playground clippt
				// (`overflow: hidden`), dort bliebe scrollWidth stumm.
				expect
					.soft(
						s.rechts,
						`${slug} · ${b.art} #${b.nr}, Specimen ${i + 1}: ragt ${px(s.rechts - b.inhaltRechts)} über die Bühne hinaus (Specimen endet bei ${px(s.rechts)}, Bühne bei ${px(b.inhaltRechts)}) — sichtbar abgeschnitten`
					)
					.toBeLessThanOrEqual(b.inhaltRechts + 2);
			}
		}

		if (align !== 'fill') return;

		// ── R4/R5 · Die Zusage `align: "fill"` ──────────────────────────────
		// „fill" heißt: Das Specimen hat keine eigene Breite, es nimmt die seines
		// Containers. Auf der Beispiel-Bühne folgt daraus beides — volle Breite
		// UND Stapeln, weil zwei volle Breiten nicht nebeneinander passen.
		//
		// ZWEI VERANTWORTLICHKEITEN, ZWEI MESSPUNKTE — die Trennung hat diese Prüfung
		// beim ersten Lauf selbst erzwungen: Der Standard-Teaser bringt mit
		// `max-width: min(100% - 2 * var(--z-gap), 55.75rem)` seine eigene Rinne mit
		// und sitzt darum bei 702 statt 734px. Das ist kein Bühnen-Fehler, sondern
		// originalgetreues Pattern-CSS. Also:
		//   · Die HÜLLE verantwortet die Bühne → exakt volle Breite.
		//   · Das SPECIMEN verantwortet die Komponente → darf sich einziehen, aber
		//     nicht auf Spaltenmaß zusammenfallen.
		const beispiele = buehnen.filter((b) => b.art === 'Beispiel');
		for (const b of beispiele) {
			for (const [i, h] of b.huellen.entries()) {
				// R5a — die Bühne teilt volle Breite zu.
				expect
					.soft(
						h.breite,
						`${slug} · Beispiel #${b.nr}, Instanz ${i + 1}: Hülle ist ${px(h.breite)} statt der vollen Bühnenbreite ${px(b.inhaltBreite)} — bei align: "fill" stapelt die Bühne, sie reiht nicht`
					)
					.toBeGreaterThanOrEqual(b.inhaltBreite - 2);
			}
			for (const [i, s] of b.specimen.entries()) {
				// R5b — und das Specimen nutzt sie auch. Der Schwellwert ist gemessen,
				// nicht geraten: Heute liegen alle fill-Specimens bei 96–100 % der
				// Bühnenbreite (Teaser 702/734 = 96 %), der Fehlerfall „zwei in einer
				// Zeile" bei (734 − 12) / 2 = 49 %. 60 % trennt beides mit Abstand.
				expect
					.soft(
						s.breite / b.inhaltBreite,
						`${slug} · Beispiel #${b.nr}, Instanz ${i + 1}: Specimen ist nur ${px(s.breite)} auf ${px(b.inhaltBreite)} Bühne — bei align: "fill" darf es sich einziehen, aber nicht auf Spaltenmaß zusammenfallen`
					)
					.toBeGreaterThan(0.6);
			}
			// R4 — der sichtbare Befund von damals: zwei Aufklapper nebeneinander.
			for (let i = 0; i < b.specimen.length; i++) {
				for (let j = i + 1; j < b.specimen.length; j++) {
					expect
						.soft(
							inGleicherZeile(b.specimen[i], b.specimen[j]),
							`${slug} · Beispiel #${b.nr}: Instanz ${i + 1} und ${j + 1} stehen NEBENEINANDER (oben ${px(b.specimen[i].oben)} bzw. ${px(b.specimen[j].oben)}) — eine "fill"-Komponente wird gestapelt gezeigt, nicht gereiht`
						)
						.toBe(false);
				}
			}
		}
	});
}
