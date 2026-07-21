import { defineConfig } from '@playwright/test';

/**
 * E2E-Suiten (e2e/): CMS-Smoke, MCP/llms.txt, **visuelle Regression**
 * (Screenshot-Snapshots) und **A11y** (axe-core). Lokal wird ein bereits
 * laufender Dev-Server wiederverwendet; in CI startet `webServer` ihn selbst.
 * Basic-Auth: lokal greift der Dev-Bypass, in CI gelten die committeten Hooks →
 * `httpCredentials` passend zu den Dummy-USERS aus .github/workflows/ci.yml.
 *
 * Port: über `E2E_PORT` überschreibbar (Default 5173), damit parallele lokale
 * Dev-Server nicht kollidieren — z. B. `E2E_PORT=5199 npx playwright test`.
 *
 * Snapshots aktualisieren (nach *beabsichtigten* Optik-Änderungen):
 *   npx playwright test e2e/visual.spec.ts --update-snapshots
 * Siehe e2e/README.md.
 */
const PORT = Number(process.env.E2E_PORT ?? 5173);

export default defineConfig({
	testDir: 'e2e',
	timeout: 60_000,
	// Auch lokal ein Retry: Die Suite läuft gegen den DEV-Server, der Seiten erst
	// beim ersten Aufruf kompiliert. Unter Last (alle Specs am Stück) rückt Layout
	// dadurch gelegentlich nach dem Screenshot noch nach — einzeln laufen dieselben
	// Tests durch. `waitForStableLayout` in e2e/support/stabilize.ts fängt den
	// Großteil ab, der Rest ist Server-Latenz.
	// Saubere Lösung wäre, visual/a11y gegen einen Produktions-Build (vite preview)
	// laufen zu lassen; das geht erst, wenn cms-smoke von den dev-only Schreib-
	// Endpunkten entkoppelt ist — eigener Vorgang.
	retries: 1,
	// In CI zusätzlich einen HTML-Report schreiben — ohne ihn ist ein
	// Snapshot-Fehlschlag (erwartet/aktuell/diff) nicht diagnostizierbar.
	reporter: process.env.CI
		? [['github'], ['html', { outputFolder: 'playwright-report', open: 'never' }]]
		: 'list',
	expect: {
		toHaveScreenshot: {
			// Diese Werte sind GEMESSEN, nicht geraten (siehe e2e/README.md,
			// Abschnitt „Gegenprobe"):
			//
			// `threshold` ist die PRO-PIXEL-Farbtoleranz. Der Playwright-Default 0.2
			// ist hier viel zu grob: eine Radius-Änderung an den Karten (0.5rem → 0)
			// blieb damit komplett unentdeckt, weil Karten- und Seitenfläche farblich
			// nah beieinanderliegen und jeder geänderte Pixel unter der Schwelle
			// blieb. 0.02 fängt genau diesen Fall.
			threshold: 0.02,
			// Bewusst nicht 0, aber knapp: Auf einer fullPage-Aufnahme (teils >10 Mio.
			// Pixel) wäre ein reines Verhältnis zu nachsichtig — 0,1 % sind dort immer
			// noch ~10.000 Pixel. Deshalb zusätzlich eine ABSOLUTE Obergrenze; es gilt
			// die jeweils strengere. Gemessene Realität: Wiederholungsläufe auf
			// derselben Maschine sind pixel-identisch (0 Abweichung), die Gegenprobe
			// erzeugte 4.724 abweichende Pixel — Faktor ~24 Sicherheitsabstand.
			maxDiffPixelRatio: 0.001,
			maxDiffPixels: 200,
			animations: 'disabled',
			caret: 'hide',
			scale: 'css'
		}
	},
	// Snapshots liegen nach Plattform getrennt im Repo (committet!) — sonst
	// überschreiben sich macOS- und Linux-Renderings gegenseitig.
	snapshotPathTemplate: '{testDir}/__screenshots__/{platform}/{arg}{ext}',
	use: {
		// Lokal das installierte Google Chrome (Playwright-Download-CDN ist in
		// manchen Netzen blockiert); in CI der via `playwright install` geladene
		// Chromium.
		...(process.env.CI ? {} : { channel: 'chrome' as const }),
		baseURL: `http://localhost:${PORT}`,
		// Feste Bühne für Screenshots: Viewport, DPR und Animations-Präferenz
		// dürfen nicht vom Host abhängen.
		viewport: { width: 1280, height: 900 },
		deviceScaleFactor: 1,
		reducedMotion: 'reduce',
		timezoneId: 'Europe/Berlin',
		locale: 'de-DE',
		trace: process.env.CI ? 'retain-on-failure' : 'off',
		httpCredentials: {
			username: process.env.E2E_USER ?? 'ci',
			password: process.env.E2E_PASS ?? 'ci-only'
		}
	},
	webServer: {
		command: `npm run dev -- --port ${PORT} --strictPort`,
		port: PORT,
		reuseExistingServer: !process.env.CI,
		timeout: 120_000
	}
});
