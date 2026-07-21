import { CATALOG_PREVIEWS } from './catalog-previews';

// Regressionstest zu einem echten Absturz: Die Katalog-Karte (`ui/card`) ist ein
// `<a>`. Enthielt eine Vorschau selbst ein `<a>` — der Standard-Teaser hat
// `<a class="zon-teaser__link">` als Template-Wurzel —, entstand `<a>` in `<a>`.
// Der Parser hebt den inneren Link heraus, die Hydration findet eine andere
// Baumstruktur vor als das SSR-Markup und wirft `HierarchyRequestError`; sichtbar
// wurde das dadurch, dass `/product/components` ohne Navbar und Sidebar rendert.
describe('CATALOG_PREVIEWS — Verschachtelung', () => {
	it('enthält in keiner Vorschau ein <a> (die Karte ist selbst eines)', () => {
		// Slugs mitführen, damit der Fehlerfall zeigt, WELCHE Vorschau es ist.
		const mitLink = Object.entries(CATALOG_PREVIEWS)
			.filter(([, preview]) => /<a[\s>]/i.test(preview.html) || /<\/a>/i.test(preview.html))
			.map(([slug]) => slug);
		expect(mitLink).toEqual([]);
	});

	it('behält beim Neutralisieren die Klassen — die Optik hängt am Pattern-CSS', () => {
		const teaser = CATALOG_PREVIEWS['standard-teaser'];
		expect(teaser).toBeDefined();
		// Aus <a class="zon-teaser__link" href="#0"> wird <span class="zon-teaser__link">.
		expect(teaser.html).toMatch(/<span[^>]*class="[^"]*zon-teaser__link/);
		expect(teaser.html).not.toMatch(/href=/);
	});

	it('lässt <button> unangetastet (elementgebundener Selektor in button-group)', () => {
		const gruppe = CATALOG_PREVIEWS['button-group'];
		expect(gruppe).toBeDefined();
		expect(gruppe.html).toMatch(/<button[\s>]/);
	});
});
