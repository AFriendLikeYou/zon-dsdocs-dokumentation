import { CATALOG_PREVIEWS, scopeToCanvas } from './catalog-previews';

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

// Zwilling zu scopeCss in tooling/zeit-de-exporter/export.mjs — hier ohne
// :global-Wrapper, weil das CSS in einem echten <style>-Tag landet. Beide müssen
// dieselben At-Rules durchlassen, sonst greift eine responsive Regel auf der
// Component-Seite, aber nicht in der Katalog-Mini-Vorschau (oder umgekehrt).
describe('scopeToCanvas — Scoping der Pattern-CSS', () => {
	it('präfixt flache Regeln mit .spec-canvas (ohne :global)', () => {
		expect(scopeToCanvas('.z { color: red }')).toBe('.spec-canvas .z { color: red }');
	});

	it('behält den @media-Rahmen und scopet nur die inneren Regeln', () => {
		const out = scopeToCanvas('@media (min-width: 768px) { .z { font-size: 22px } }');
		expect(out).toContain('@media (min-width: 768px) {');
		expect(out).toContain('.spec-canvas .z { font-size: 22px }');
		expect(out).not.toContain('.spec-canvas @media');
		expect(out).not.toContain(':global');
	});

	it('verarbeitet mehrere Regeln in einem @media und mehrere Blöcke', () => {
		const out = scopeToCanvas(
			'.z { font-size: 20px }\n@media (min-width: 768px) { .z { font-size: 22px } .y { gap: 0 } }'
		);
		expect(out.match(/@media/g)).toHaveLength(1);
		expect(out).toContain('.spec-canvas .y { gap: 0 }');
		expect(out.indexOf('font-size: 20px')).toBeLessThan(out.indexOf('font-size: 22px'));
	});

	it('überspringt @keyframes still (der Exporter lehnt sie bereits laut ab)', () => {
		const out = scopeToCanvas('.z { color: red }\n@keyframes puls { 0% { opacity: 0 } }');
		expect(out).toBe('.spec-canvas .z { color: red }');
	});
});
