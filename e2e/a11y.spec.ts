import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { prepare, gotoStable, PAGES, type ThemeName } from './support/stabilize';

/**
 * C2 — Automatischer A11y-Check (axe-core).
 *
 * Ersetzt das „ist das eigentlich barrierefrei?" von Hand. Regelsatz:
 * **wcag2a · wcag2aa · wcag21a · wcag21aa** — bewusst nicht aufgeweicht.
 *
 * Aufteilung in zwei Läufe, weil die Regeln unterschiedlich theme-abhängig sind:
 *
 *  1. STRUKTUR (Labels, Landmarks, Namen, Reihenfolge, Sprache …) ist vom Theme
 *     unabhängig — identisches DOM in hell und dunkel. Ein Lauf in HELL je Seite
 *     genügt; `color-contrast` ist hier abgeschaltet, weil Lauf 2 ihn vollständig
 *     und in BEIDEN Themes abdeckt (kein blinder Fleck, nur keine Doppelmeldung).
 *  2. KONTRAST läuft je Seite in HELL **und** DUNKEL — genau hier unterscheiden
 *     sich die Themes, ein Ein-Theme-Lauf würde die Hälfte der Befunde verpassen.
 *
 * ERWARTUNG: 0 Verstöße. Die wenigen bekannten Ausnahmen stehen unten einzeln,
 * benannt und begründet in `KNOWN_ISSUES` — es gibt KEIN stilles `disableRules`.
 * Jede Ausnahme nennt Regel, Selektor, Seite, Grund und Zuständigkeit. Ein neuer
 * Verstoß, der nicht exakt auf einen Eintrag passt, lässt den Test rot werden.
 */

const TAGS = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'];
const THEMES: ThemeName[] = ['light', 'dark'];

type KnownIssue = {
	/** Seite (name aus PAGES) — '*' gilt für alle. */
	page: string;
	/** axe-Regel-ID. */
	rule: string;
	/** Teilstring, der im Selektor des betroffenen Knotens vorkommen muss. */
	selector: string;
	/** Warum das (noch) offen ist — und wer es entscheiden muss. */
	reason: string;
};

/**
 * BEKANNTE, BEWUSST OFFENE BEFUNDE.
 *
 * Gemeinsame Ursache der Kontrast-Punkte: zwei Farbentscheidungen auf
 * TOKEN-Ebene, nicht einzelne Komponenten-Bugs —
 *   (a) das gedämpfte Grau `#999` (`--ds-text-muted`/`--ds-text-faint`) auf
 *       hellen Flächen (2,45–2,84:1 bei 12–14 px),
 *   (b) das semantische Grün `#09864d` auf dunklen Flächen (4,04:1).
 * Beide global anzuheben ändert die Optik der GESAMTEN App und ist eine
 * Design-System-Entscheidung — nichts, was ein Test-Agent nebenbei durchdrückt.
 * Sie gehören als eigener Vorgang ins Token-Layer (static/global.css).
 */
const KNOWN_ISSUES: KnownIssue[] = [
	// ── (a) gedämpftes Grau #999 auf hell ──────────────────────────────────────
	{
		page: 'landing',
		rule: 'color-contrast',
		selector: '.stage__url',
		reason:
			'#999 auf #fff = 2,84:1. Dekorative Mock-Browserzeile im Landing-Hero (rein illustrativ). Fix = --ds-text-faint global anheben → Token-Entscheidung.'
	},
	{
		page: 'foundations-color',
		rule: 'color-contrast',
		selector: '.color-roles__raw',
		reason:
			'#999 auf #eee = 2,45:1. Roher Token-Wert als Sekundärinfo neben dem Rollennamen. Token-Entscheidung (--ds-text-muted).'
	},
	{
		page: 'foundations-typography',
		rule: 'color-contrast',
		selector: '.type-specimen__px',
		reason:
			'#999 auf #fff = 2,84:1. px-Zusatz im Token-Chip des Typo-Specimens. Token-Entscheidung (--ds-text-muted).'
	},
	{
		page: 'cms-component-button',
		rule: 'color-contrast',
		selector: '#cluster-',
		reason:
			'#999 auf #f7f7f7 = 2,65:1. Cluster-Überschriften der CMS-Maske (interne Redaktionsoberfläche). Token-Entscheidung.'
	},
	{
		page: 'cms-component-button',
		rule: 'color-contrast',
		selector: '.ds-table__cell',
		reason:
			'#999 auf #fff = 2,84:1. Maß-Tabelle der MachineZone (generierte, schreibgeschützte Anzeige). Token-Entscheidung.'
	},
	// ── (b) semantisches Grün/Rot bei kleiner Schrift ──────────────────────────
	{
		page: 'foundations-typography',
		rule: 'color-contrast',
		selector: '.dodont-card__title',
		reason:
			'#09864d auf #121212 = 4,04:1 (Dark). Semantisches Do-Grün; Farbe ist NICHT der einzige Träger der Aussage (Icon + Text „Do"/„Don\'t"). Token-Entscheidung für die Dark-Variante des Grüns.'
	},
	{
		page: 'brand-typography',
		rule: 'color-contrast',
		selector: '.dodont-card__title',
		reason: 'Identisch zu foundations-typography — dieselbe DoDont-Komponente, Dark-Grün.'
	},
	{
		page: 'foundations-color',
		rule: 'color-contrast',
		selector: '.color-roles__wcag',
		reason:
			'#09864d auf #121212 = 4,04:1 (Dark). Das „AA bestanden"-Badge der Kontrast-Spalte — dasselbe semantische Grün wie in DoDont; Bedeutung steht zusätzlich als Text im Badge. Token-Entscheidung für die Dark-Variante des Grüns.'
	},
	{
		page: 'cms-component-button',
		rule: 'color-contrast',
		selector: '.sublist__label--',
		reason:
			"#09864d bzw. #f13638 auf #eee/#232323 = 3,38–3,99:1. Do/Don't-Marker in der CMS-Maske; Bedeutung steht zusätzlich als Text. Token-Entscheidung."
	},
	// ── (c) Markenfarbe ────────────────────────────────────────────────────────
	{
		page: 'landing',
		rule: 'color-contrast',
		selector: '.btn--primary',
		reason:
			'Weiß auf ZEIT-Rot #eb362e = 4,11:1 (knapp unter 4,5). Das ist die MARKENFARBE — eine Änderung ist eine Brand-Entscheidung des Brand-Teams, kein Test-Fix.'
	},
	// ── (d) echter Bug, aber fremdes Revier ────────────────────────────────────
	{
		page: 'brand-typography',
		rule: 'document-title',
		selector: 'html',
		reason:
			'ECHTER BUG: /brand/typography setzt kein <title> (Frontmatter `title:` wird nicht in <svelte:head> gespiegelt, anders als auf den Produkt-Seiten). Fix gehört in src/routes/brand/typography/+page.svx — diese Datei wird gerade von einem anderen Agenten bearbeitet, daher hier nur dokumentiert.'
	}
];

/** Passt ein Verstoß-Knoten auf einen benannten, bekannten Befund? */
function isKnown(pageName: string, ruleId: string, target: string) {
	return KNOWN_ISSUES.some(
		(k) =>
			(k.page === pageName || k.page === '*') && k.rule === ruleId && target.includes(k.selector)
	);
}

/**
 * Verstöße auf Knoten-Ebene in „neu" (muss rot werden) und „bekannt"
 * (dokumentierte Ausnahme) trennen.
 */
function partition(
	pageName: string,
	violations: { id: string; impact?: string | null; nodes: { target: unknown[] }[] }[]
) {
	const fresh: string[] = [];
	const known: string[] = [];
	for (const v of violations) {
		for (const node of v.nodes) {
			const target = node.target.join(' ');
			const line = `${v.id} [${v.impact}] ${target}`;
			(isKnown(pageName, v.id, target) ? known : fresh).push(line);
		}
	}
	return { fresh, known };
}

test.describe('A11y — Struktur (axe, hell)', () => {
	for (const { name, path } of PAGES) {
		test(`${name}`, async ({ page }, testInfo) => {
			await prepare(page, 'light');
			await gotoStable(page, path, 'light');

			const results = await new AxeBuilder({ page })
				.withTags(TAGS)
				// Kontrast läuft separat in BEIDEN Themes (siehe unten) — hier nur
				// deduplizieren, nicht verstecken.
				.disableRules(['color-contrast'])
				.analyze();

			const { fresh, known } = partition(name, results.violations);
			await testInfo.attach(`${name}-struktur.json`, {
				body: JSON.stringify({ fresh, known }, null, 2),
				contentType: 'application/json'
			});
			expect(fresh, `Neue Struktur-Verstöße auf ${path}:\n${fresh.join('\n')}`).toEqual([]);
		});
	}
});

test.describe('A11y — Kontrast (axe, hell + dunkel)', () => {
	for (const { name, path } of PAGES) {
		for (const theme of THEMES) {
			test(`${name} (${theme})`, async ({ page }, testInfo) => {
				await prepare(page, theme);
				await gotoStable(page, path, theme);

				const results = await new AxeBuilder({ page })
					.withTags(TAGS)
					.withRules(['color-contrast'])
					.analyze();

				const { fresh, known } = partition(name, results.violations);
				await testInfo.attach(`${name}-${theme}-kontrast.json`, {
					body: JSON.stringify({ fresh, known }, null, 2),
					contentType: 'application/json'
				});
				expect(
					fresh,
					`Neue Kontrast-Verstöße auf ${path} (${theme}):\n${fresh.join('\n')}`
				).toEqual([]);
			});
		}
	}
});

/**
 * Tastatur-Basisprüfung — das, was axe grundsätzlich nicht sehen kann.
 */
test.describe('A11y — Tastatur', () => {
	test('Skip-Link ist per Tab erreichbar und springt zum Hauptinhalt', async ({ page }) => {
		await prepare(page, 'light');
		await gotoStable(page, '/product/components/button', 'light');

		await page.keyboard.press('Tab');
		const skip = page.locator('a.skip-to-content-link');
		await expect(skip).toBeFocused();
		// Sichtbar im Fokus (nicht nur im DOM) — sonst ist der Link wertlos.
		await expect(skip).toBeInViewport();

		await skip.press('Enter');
		await expect(page.locator('#main-content')).toBeVisible();
	});

	test('dekorative Karten-Vorschauen sind kein Fokus-Stopp (inert)', async ({ page }) => {
		await prepare(page, 'light');
		await gotoStable(page, '/product/components', 'light');

		// Die Karten-Medienfläche ist bewusst dekorativ (Card.svelte: aria-hidden + inert):
		// die Live-Vorschau enthält echte <button>-Elemente, die NICHT in die
		// Tab-Reihenfolge gehören — der Link ist die Karte selbst.
		const media = page.locator('.card__media').first();
		await expect(media).toHaveAttribute('aria-hidden', 'true');
		expect(await media.evaluate((el) => (el as HTMLElement).inert)).toBe(true);

		const focusableInMedia = await page.evaluate(() => {
			const sel = 'a[href], button, input, select, textarea, [tabindex]:not([tabindex="-1"])';
			return [...document.querySelectorAll('.card__media')].filter((m) =>
				[...m.querySelectorAll(sel)].some(
					(el) => (el as HTMLElement).tabIndex >= 0 && !(el as HTMLElement).closest('[inert]')
				)
			).length;
		});
		expect(focusableInMedia).toBe(0);
	});

	test('Tab-Reihenfolge der Component-Seite ist plausibel', async ({ page }) => {
		await prepare(page, 'light');
		await gotoStable(page, '/product/components/button', 'light');

		// Die ersten Stationen: Skip-Link → App-Chrome (Navbar/Sidebar) → Inhalt.
		// Geprüft wird die INVARIANTE, nicht die exakte Liste: der Skip-Link kommt
		// zuerst, danach folgen ausschließlich sichtbare, benannte Bedienelemente.
		await page.keyboard.press('Tab');
		await expect(page.locator('a.skip-to-content-link')).toBeFocused();

		for (let i = 0; i < 12; i++) {
			await page.keyboard.press('Tab');
			const info = await page.evaluate(() => {
				const el = document.activeElement as HTMLElement | null;
				if (!el || el === document.body) return null;
				const name =
					el.getAttribute('aria-label') ?? el.getAttribute('title') ?? el.textContent?.trim() ?? '';
				return {
					tag: el.tagName,
					name,
					inInert: !!el.closest('[inert]'),
					hidden: !!el.closest('[aria-hidden="true"]')
				};
			});
			if (!info) continue;
			// Kein Fokus darf in inerten/versteckten Bereichen landen …
			expect(info.inInert, `Fokus in [inert]: ${info.tag}`).toBe(false);
			expect(info.hidden, `Fokus in aria-hidden: ${info.tag}`).toBe(false);
			// … und jedes Element muss einen zugänglichen Namen haben.
			expect(info.name.length, `Fokussiertes ${info.tag} ohne Namen`).toBeGreaterThan(0);
		}
	});
});
