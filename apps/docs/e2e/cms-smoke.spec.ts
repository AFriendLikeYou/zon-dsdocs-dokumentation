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
		// Rollen-basierte Locators statt Klassen: die frühere `.new-btn`/`.np-create`
		// waren beim Umbau auf das Button-Atom (ui/button) ersatzlos entfallen — der
		// Test lief seitdem in einen Timeout. Über die sichtbare Beschriftung sind
		// die Buttons unabhängig von der internen Klassen-Struktur greifbar.
		const neueSeite = page.getByRole('button', { name: '+ Neue Seite' });
		const titel = page.locator('.new-panel input').first();
		await neueSeite.click();
		try {
			await titel.waitFor({ timeout: 3000 });
		} catch {
			await neueSeite.click();
			await titel.waitFor();
		}
		await titel.fill('E2E Smoke');
		await expect(page.locator('.np-slug input')).toHaveValue(SLUG);
		await page.getByRole('button', { name: 'Anlegen & bearbeiten' }).click();

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
		// Keine feste Blockzahl mehr: die frische Seite aus `pageTemplate()` enthält
		// zwei geschützte Inseln (<svelte:head>, <script>) plus die Prosa; wie viele
		// Karten der Parser daraus macht, ist ein Implementierungsdetail, das sich
		// mit dem Block-Modell mitbewegt (war 2, ist 3). Geprüft wird, was der Smoke
		// wirklich zusichern will: der Editor lädt Blöcke UND die Prosa ist da.
		await expect(page.locator('.block-card').first()).toBeVisible();
		await expect(page.locator('.block-card--prosa')).toHaveCount(1);

		const prosa = page.locator('.block-card--prosa textarea');
		await prosa.fill('# E2E Smoke\n\nE2E war hier.');
		// Die schwebende Save-Bar ist inzwischen `ui/dialog` (Dialog variant="bar",
		// erscheint sobald `dirty`) — die alten `.savebar`/`.savebar .save` gibt es
		// nicht mehr. Über Rolle + Beschriftung bleibt der Test vom Umbau unabhängig.
		const speichern = page.getByRole('button', { name: /Speichern/ });
		await expect(speichern).toBeVisible();
		// Der Save-POST muss mit success antworten (nicht nur ein Toast, den der
		// Vite-Reload wegreißen kann).
		const [saveRes] = await Promise.all([
			page.waitForResponse((r) => r.request().method() === 'POST' && r.url().includes(SLUG)),
			speichern.click()
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
		// `.search` liegt seit dem Umbau auf das Field-Atom am WRAPPER, nicht mehr am
		// <input> — `.fill()` lief deshalb ins Leere. Rolle statt Klasse (type="search"
		// → role=searchbox).
		await page.getByRole('searchbox', { name: /suchen/i }).fill('logo');
		// Retryende Assertion statt sofortigem count(): Svelte filtert asynchron.
		await expect(page.locator('.card')).not.toHaveCount(alle);
		expect(await page.locator('.card').count()).toBeGreaterThan(0);
	});
});
