import { test, expect, type Page } from '@playwright/test';

/**
 * C5 — `<z-accordion>` im echten Browser.
 *
 * Warum als E2E und nicht als Unit-Test: Die drei Zusagen dieser Komponente
 * lassen sich in jsdom grundsätzlich nicht prüfen.
 *
 *  1. **Tastatur.** Enter und Leertaste auf einem `<summary>` sind NATIVES
 *     Browserverhalten — jsdom hat es nicht, und über die CDP-Automatisierung des
 *     Browser-Werkzeugs kam es in dieser Session ebenfalls nicht an (auch ein
 *     unberührtes `<details>` reagierte dort nicht). Playwright liefert echte
 *     Tastenereignisse; erst hier ist die Zusage belegt statt behauptet.
 *  2. **Ohne JavaScript bedienbar.** Braucht einen Kontext, in dem man JS
 *     abschalten kann — `test.use({ javaScriptEnabled: false })`.
 *  3. **Kein Layout-Sprung beim Hydrieren.** Braucht echtes SSR plus echte
 *     Hydration; gemessen wird dieselbe Geometrie vor und nach dem Upgrade.
 *
 * Die Seite steht bewusst NICHT in `PAGES` (visual.spec) — sie ist kein
 * Screenshot-Fall, sondern ein Verhaltens-Fall.
 */

const SEITE = '/product/components/accordion';

/** Der erste Aufklapper im Playground — das Specimen, um das es geht. */
const AUFKLAPPER = '.pg-preview z-accordion';

/**
 * Seite laden UND auf das Element-Upgrade warten.
 *
 * Nötig, weil die Seite serverseitig gerendert wird: Bis das Client-Bündel läuft,
 * steht der Aufklapper zwar vollständig da und funktioniert nativ — aber die
 * ARIA-Verdrahtung fehlt noch, sie ist ja gerade das, was das Element beisteuert.
 * Ohne dieses Warten prüfte der Test unter Last (Dev-Server kompiliert die Seite
 * beim ersten Aufruf) den Zustand VOR der Hydration und schlug sporadisch fehl.
 * Genau das ist in dieser Session passiert.
 */
async function ladeUndWarteAufUpgrade(page: Page) {
	await page.goto(SEITE);
	await page.waitForFunction(() => customElements.get('z-accordion') !== undefined);
	// Upgrade ist nicht dasselbe wie „verdrahtet": auf das Ergebnis warten.
	await expect(page.locator(`${AUFKLAPPER} summary`)).toHaveAttribute('aria-expanded', /.+/);
}

test.describe('<z-accordion> — Verhalten im Browser', () => {
	test('klappt per Enter auf und wieder zu', async ({ page }) => {
		await ladeUndWarteAufUpgrade(page);
		const details = page.locator(`${AUFKLAPPER} details`);
		const summary = page.locator(`${AUFKLAPPER} summary`);
		await expect(summary).toHaveAttribute('aria-expanded', 'false');

		await summary.focus();
		await page.keyboard.press('Enter');
		await expect(summary).toHaveAttribute('aria-expanded', 'true');
		await expect(details).toHaveAttribute('open', '');

		await page.keyboard.press('Enter');
		await expect(summary).toHaveAttribute('aria-expanded', 'false');
		// `open` fällt erst, wenn die Zuklapp-Bewegung durch ist — deshalb nicht
		// sofort, sondern mit der üblichen Erwartungs-Wartezeit.
		await expect(details).not.toHaveAttribute('open', '');
	});

	test('klappt per Leertaste auf', async ({ page }) => {
		await ladeUndWarteAufUpgrade(page);
		const summary = page.locator(`${AUFKLAPPER} summary`);
		await summary.focus();
		await page.keyboard.press('Space');
		await expect(summary).toHaveAttribute('aria-expanded', 'true');
	});

	test('ist per Tab erreichbar und zeigt einen sichtbaren Fokus-Ring', async ({ page }) => {
		await ladeUndWarteAufUpgrade(page);
		const summary = page.locator(`${AUFKLAPPER} summary`);
		await summary.focus();

		await expect(summary).toBeFocused();
		// Der Ring ist unsere Ergänzung gegenüber der Produktion (siehe pattern.css).
		const ring = await summary.evaluate((el) => {
			const c = getComputedStyle(el);
			return { stil: c.outlineStyle, breite: c.outlineWidth, farbe: c.outlineColor };
		});
		expect(ring.stil).toBe('solid');
		expect(ring.breite).toBe('2px');
		// --z-ds-color-focus-100 = #005fcc
		expect(ring.farbe).toBe('rgb(0, 95, 204)');
	});

	test('verdrahtet ARIA vollständig', async ({ page }) => {
		await ladeUndWarteAufUpgrade(page);
		const summary = page.locator(`${AUFKLAPPER} summary`);
		const inhalt = page.locator(`${AUFKLAPPER} .z-accordion__content`);

		// Erst nach dem Upgrade lesen — die Verdrahtung ist Aufgabe des Elements,
		// vorher steht sie (bewusst) nicht im Markup.
		await expect(summary).toHaveAttribute('aria-controls', /.+/);

		const panelId = await inhalt.getAttribute('id');
		const triggerId = await summary.getAttribute('id');
		expect(panelId).toBeTruthy();
		expect(triggerId).toBeTruthy();
		await expect(summary).toHaveAttribute('aria-controls', panelId!);
		await expect(inhalt).toHaveAttribute('aria-labelledby', triggerId!);
		await expect(inhalt).toHaveAttribute('role', 'region');
	});

	/**
	 * Kein Layout-Sprung beim Hydrieren — die Zusage, an der die Wahl von
	 * <details> hängt.
	 *
	 * Gemessen wird dieselbe Seite in ZWEI Kontexten: einmal ohne JavaScript (das
	 * Element bleibt ein unaufgewertetes Unbekanntes, den zugeklappten Zustand
	 * führt allein der Browser) und einmal mit (Element aufgewertet). Sind beide
	 * Höhen gleich, kann beim Upgrade nichts springen — es ändert sich nichts, was
	 * Layout kostet. Eine JS-gesteuerte Kollaps-Weiche, wie sie zeit.de heute
	 * benutzt, fiele genau hier durch.
	 *
	 * Zwei Messungen statt einer, weil sie unterschiedlich robust sind:
	 * `ueberschuss` (Höhe des Aufklappers minus Höhe seines Auslösers) vergleicht
	 * INNERHALB eines Ladevorgangs und ist damit unabhängig davon, ob die Webfonts
	 * schon da sind — das ist die eigentliche Zusage („zugeklappt ist genau der
	 * Auslöser, kein Kasten mehr"). Der absolute Höhenvergleich kommt zusätzlich,
	 * braucht dafür aber geladene Schriften; ohne das Warten unten wackelt er.
	 */
	test('springt beim Hydrieren nicht — mit und ohne JavaScript dieselbe Geometrie', async ({
		browser
	}) => {
		const messen = async (javaScriptEnabled: boolean) => {
			const kontext = await browser.newContext({
				javaScriptEnabled,
				viewport: { width: 1280, height: 900 },
				httpCredentials: {
					username: process.env.E2E_USER ?? 'ci',
					password: process.env.E2E_PASS ?? 'ci-only'
				}
			});
			const seite = await kontext.newPage();
			await seite.goto(`http://localhost:${process.env.E2E_PORT ?? 5173}${SEITE}`, {
				waitUntil: 'load'
			});
			if (javaScriptEnabled) {
				await seite.waitForFunction(() => customElements.get('z-accordion') !== undefined);
			}
			// Schriften abwarten — sonst misst der eine Lauf Fallback-Metrik und der
			// andere die echte Schrift, und der Höhenvergleich meldet einen Sprung,
			// den es nicht gibt. (`evaluate` funktioniert auch im Kontext ohne
			// JavaScript: die Sperre gilt für Seiten-Skripte, nicht für den Debugger.)
			await seite.evaluate(() => document.fonts.ready.then(() => undefined));
			const mass = await seite
				.locator(`${AUFKLAPPER} details`)
				.first()
				.evaluate((el) => {
					const summary = el.querySelector('summary')!;
					return {
						hoehe: Math.round(el.getBoundingClientRect().height),
						ueberschuss: Math.round(
							el.getBoundingClientRect().height - summary.getBoundingClientRect().height
						)
					};
				});
			await kontext.close();
			return mass;
		};

		const ohneJs = await messen(false);
		const mitJs = await messen(true);

		expect(ohneJs.hoehe).toBeGreaterThan(0); // die Bühne rendert überhaupt
		// Zugeklappt ist der Aufklapper GENAU sein Auslöser — in beiden Welten.
		expect(ohneJs.ueberschuss).toBe(0);
		expect(mitJs.ueberschuss).toBe(0);
		expect(mitJs.hoehe).toBe(ohneJs.hoehe);
	});
});

test.describe('<z-accordion> — ohne JavaScript', () => {
	test.use({ javaScriptEnabled: false });

	test('bleibt voll bedienbar: Inhalt ist da und lässt sich aufklappen', async ({ page }) => {
		await page.goto(SEITE);

		const details = page.locator(`${AUFKLAPPER} details`).first();
		const summary = details.locator('summary');

		// Das Element ist NICHT aufgewertet — es gibt kein JavaScript.
		await expect(details).not.toHaveAttribute('open', '');

		// Der Inhalt steht trotzdem im ausgelieferten HTML (nicht nachgeladen).
		await expect(details.locator('.z-accordion__content')).toHaveText(/Kündigungsformular/);

		// Und der Aufklapper funktioniert: der Browser führt den Zustand.
		await summary.click();
		await expect(details).toHaveAttribute('open', '');
		await expect(details.locator('.z-accordion__content')).toBeVisible();

		await summary.click();
		await expect(details).not.toHaveAttribute('open', '');
	});
});
