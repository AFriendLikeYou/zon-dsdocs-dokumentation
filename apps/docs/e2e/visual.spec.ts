import { test, expect, type Page } from '@playwright/test';
import { prepare, gotoStable, PAGES, type ThemeName } from './support/stabilize';

/**
 * C1 — Visuelle Regression (Screenshot-Snapshots).
 *
 * Ersetzt das „ich schau mal, ob sich die Optik geändert hat" von Hand: jede
 * Kernseite wird in **hell und dunkel** gegen einen committeten Referenz-Shot
 * verglichen. Die Snapshots unter `e2e/__screenshots__/` SIND der Vergleichsstand
 * und gehören ins Repo.
 *
 * Beabsichtigte Optik-Änderung? → `npx playwright test e2e/visual.spec.ts
 * --update-snapshots`, Bilder im Diff sichten, mitcommitten. Siehe e2e/README.md.
 *
 * Stabilität geht vor Vollständigkeit — Details in e2e/support/stabilize.ts.
 */

const THEMES: ThemeName[] = ['light', 'dark'];

/**
 * Regionen, die sich legitim von Lauf zu Lauf ändern können, werden maskiert
 * (Playwright malt sie rosa zu) statt den ganzen Shot instabil zu machen.
 */
function masksFor(page: Page) {
	return [
		// Zufällige contentId in der MachineZone der CMS-Seite (mz-xxxxxx) —
		// nur ein Attribut, aber der aria-controls-Wert taucht in DevTools-Shots auf.
		// Zusätzlich: Zeitstempel-Zeilen im CMS.
		page.locator('[data-volatile]'),
		page.locator('.machine-zone__meta')
	];
}

/** Ein Shot mit einheitlichen Optionen. */
async function shoot(page: Page, name: string, fullPage = true) {
	await expect(page).toHaveScreenshot(`${name}.png`, {
		fullPage,
		mask: masksFor(page),
		// Playwright wartet intern, bis zwei aufeinanderfolgende Frames identisch
		// sind — zusammen mit den Vorbereitungen in stabilize.ts reicht das.
		timeout: 30_000
	});
}

for (const theme of THEMES) {
	test.describe(`Visuelle Regression — ${theme}`, () => {
		for (const { name, path } of PAGES) {
			test(`${name} (${theme})`, async ({ page }) => {
				await prepare(page, theme);
				await gotoStable(page, path, theme);
				await shoot(page, `${name}--${theme}`);
			});
		}

		// Sonderfall Landing: der Header ist oben transparent (`navbar--transparent`,
		// gebunden an scrollY <= 40) und wird beim Scrollen opak. Beide Zustände
		// prüfen — der Übergang war in dieser Session mehrfach von Hand kontrolliert.
		test(`landing — Header opak nach Scroll (${theme})`, async ({ page }) => {
			await prepare(page, theme);
			await gotoStable(page, '/', theme);

			const navbar = page.locator('header.navbar');
			await expect(navbar).toHaveClass(/navbar--transparent/);

			await page.evaluate(() => window.scrollTo(0, 400));
			await expect(navbar).not.toHaveClass(/navbar--transparent/);
			await page.evaluate(() => new Promise((r) => requestAnimationFrame(() => r(undefined))));

			// Nur der Viewport (kein fullPage): es geht ausschließlich um den Header
			// im gescrollten Zustand.
			await shoot(page, `landing-scrolled--${theme}`, false);
		});
	});
}
