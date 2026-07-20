import { test, expect } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

/**
 * Smoke über die CMS-Kernflüsse: Übersicht → Seite anlegen → Block editieren →
 * speichern → Persistenz; plus Medien-Verwaltung. Die Tests legen eine eigene
 * Wegwerf-Seite an (Slug e2e-smoke) und räumen sie in beforeAll/afterAll wieder
 * ab — inklusive des Nav-Eintrags in brand-nav.json (SSOT), damit weder Repo
 * noch lokale Spielstände verschmutzen.
 */
const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SLUG = 'e2e-smoke';
const pageDir = path.join(repoRoot, 'src/routes/brand', SLUG);
const navPath = path.join(repoRoot, 'src/lib/data/brand-nav.json');

function cleanup() {
	fs.rmSync(pageDir, { recursive: true, force: true });
	const tree = JSON.parse(fs.readFileSync(navPath, 'utf8')) as { href?: string }[];
	const filtered = tree.filter((s) => s.href !== `/brand/${SLUG}`);
	if (filtered.length !== tree.length)
		fs.writeFileSync(navPath, JSON.stringify(filtered, null, '\t') + '\n');
}

test.beforeAll(cleanup);
test.afterAll(cleanup);

test.describe.serial('CMS-Kernflüsse', () => {
	test('Brand-Übersicht spiegelt die Sidebar-Struktur', async ({ page }) => {
		await page.goto('/admin/brand');
		await expect(page.getByRole('heading', { name: 'Brand-Seiten' })).toBeVisible();
		expect(await page.locator('.tree li').count()).toBeGreaterThan(5);
	});

	test('Seite anlegen → Editor → Text speichern → Persistenz', async ({ page }) => {
		await page.goto('/admin/brand');
		// Dev-Server zur Ruhe kommen lassen: der beforeAll-Cleanup kann kurz zuvor
		// Dateien geschrieben haben → verspäteter Vite-HMR-Remount würde das frisch
		// geöffnete Panel sonst wieder schließen. Plus ein Retry-Klick als Gurt.
		await page.waitForLoadState('networkidle');
		const titel = page.locator('.new-panel input').first();
		await page.locator('.new-btn').click();
		try {
			await titel.waitFor({ timeout: 3000 });
		} catch {
			await page.locator('.new-btn').click();
			await titel.waitFor();
		}
		await titel.fill('E2E Smoke');
		await expect(page.locator('.np-slug input')).toHaveValue(SLUG);
		await page.locator('.np-create').click();

		// Nicht auf Toast/SPA-Navigation verlassen: die neue Route-Datei löst im Dev
		// einen Vite-Full-Reload aus, der beides wegreißen kann (HMR-Race). Die
		// verlässliche Wahrheit ist das Dateisystem — dann EXPLIZIT in den Editor.
		await expect.poll(() => fs.existsSync(path.join(pageDir, '+page.svx'))).toBe(true);
		// Vite kann durch die neue Route-Datei GENAU JETZT einen Full-Reload feuern,
		// der unser goto abbricht (net::ERR_ABORTED) — einmal wiederholen reicht.
		try {
			await page.goto(`/admin/brand/${SLUG}`);
		} catch {
			await page.waitForTimeout(500);
			await page.goto(`/admin/brand/${SLUG}`);
		}
		await page.waitForLoadState('networkidle');
		await expect(page.locator('.block-card')).toHaveCount(2);

		const prosa = page.locator('.block-card--prosa textarea');
		await prosa.fill('# E2E Smoke\n\nE2E war hier.');
		await expect(page.locator('.savebar')).toBeVisible();
		// Der Save-POST muss mit success antworten (nicht nur ein Toast, den der
		// Vite-Reload wegreißen kann).
		const [saveRes] = await Promise.all([
			page.waitForResponse((r) => r.request().method() === 'POST' && r.url().includes(SLUG)),
			page.locator('.savebar .save').click()
		]);
		expect(await saveRes.text()).toContain('"type":"success"');

		// Server-Wahrheit zuerst: die gespeicherte Datei MUSS den Text enthalten
		// (UI-Toasts können vom Vite-Reload weggerissen werden, die Datei nicht).
		await expect
			.poll(() => fs.readFileSync(path.join(pageDir, '+page.svx'), 'utf8'), { timeout: 10_000 })
			.toContain('E2E war hier');

		// Persistenz in der UI: nach Reload steht der gespeicherte Text im Editor.
		await page.reload();
		await page.waitForLoadState('networkidle');
		await expect(page.locator('.block-card--prosa textarea')).toHaveValue(/E2E war hier/);
	});

	test('Medien-Verwaltung: Galerie lädt, Suche filtert', async ({ page }) => {
		await page.goto('/admin/media');
		await expect(page.getByRole('heading', { name: 'Medien' })).toBeVisible();
		const alle = await page.locator('.card').count();
		expect(alle).toBeGreaterThan(3);
		await page.locator('.search').fill('logo');
		// Retryende Assertion statt sofortigem count(): Svelte filtert asynchron.
		await expect(page.locator('.card')).not.toHaveCount(alle);
		expect(await page.locator('.card').count()).toBeGreaterThan(0);
	});
});
