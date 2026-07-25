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

	it('behält den bedingten Rahmen und scopet nur die inneren Regeln', () => {
		const out = scopeToCanvas('@media (min-width: 768px) { .z { font-size: 22px } }');
		expect(out).toContain('@container (min-width: 768px) {');
		expect(out).toContain('.spec-canvas .z { font-size: 22px }');
		expect(out).not.toContain('.spec-canvas @');
		expect(out).not.toContain(':global');
	});

	it('verarbeitet mehrere Regeln in einem Rahmen und mehrere Blöcke', () => {
		const out = scopeToCanvas(
			'.z { font-size: 20px }\n@media (min-width: 768px) { .z { font-size: 22px } .y { gap: 0 } }'
		);
		expect(out.match(/@container/g)).toHaveLength(1);
		expect(out).toContain('.spec-canvas .y { gap: 0 }');
		expect(out.indexOf('font-size: 20px')).toBeLessThan(out.indexOf('font-size: 22px'));
	});

	it('überspringt @keyframes still (der Exporter lehnt sie bereits laut ab)', () => {
		const out = scopeToCanvas('.z { color: red }\n@keyframes puls { 0% { opacity: 0 } }');
		expect(out).toBe('.spec-canvas .z { color: red }');
	});
});

// Zwilling zu `export.mjs · scopeCss übersetzt @media zu @container`. Die
// Katalog-Karte ist ~300 px breit — ein viewport-basiertes @media zeigte dort
// Desktop-Typografie. Übersetzt werden NUR Größen-Features; alles, was Nutzer oder
// Gerät beschreibt, bleibt @media (eine `prefers-reduced-motion`-Regel, die auf die
// Kartenbreite reagiert, wäre schlicht falsch).
describe('scopeToCanvas — @media → @container', () => {
	it('übersetzt ein Größen-Feature und lässt `screen` entfallen', () => {
		const out = scopeToCanvas('@media screen and (min-width: 48em) { .z { font-size: 22px } }');
		expect(out).toContain('@container (min-width: 48em) {');
		expect(out).not.toContain('screen');
	});

	it('gibt NUR @container aus, nie zusätzlich @media', () => {
		const out = scopeToCanvas('@media screen and (max-width: 47.999em) { .z { font-size: 20px } }');
		expect(out).not.toContain('@media');
		expect(out.match(/@container/g)).toHaveLength(1);
	});

	it('lässt prefers-reduced-motion @media (Nutzer-Präferenz, nicht Bühnenbreite)', () => {
		const out = scopeToCanvas('@media (prefers-reduced-motion: reduce) { .z { transition: none } }');
		expect(out).toContain('@media (prefers-reduced-motion: reduce) {');
		expect(out).not.toContain('@container');
	});

	it('lässt GEMISCHTE Bedingungen ganz @media (nicht sauber teilbar)', () => {
		const out = scopeToCanvas(
			'@media screen and (min-width: 48em) and (prefers-reduced-motion: reduce) { .z { transition: none } }'
		);
		expect(out).toContain(
			'@media screen and (min-width: 48em) and (prefers-reduced-motion: reduce) {'
		);
		expect(out).not.toContain('@container');
	});

	it('lässt Komma-Listen und @supports/@container unangetastet', () => {
		expect(scopeToCanvas('@media (max-width: 30em), (min-width: 60em) { .z { color: red } }')).toContain(
			'@media (max-width: 30em), (min-width: 60em) {'
		);
		expect(scopeToCanvas('@supports (display: grid) { .z { display: grid } }')).toContain(
			'@supports (display: grid) {'
		);
		expect(scopeToCanvas('@container (min-width: 20rem) { .z { padding: 0 } }')).toContain(
			'@container (min-width: 20rem) {'
		);
	});

	it('das echte Standard-Teaser-CSS kommt ohne @media in der Vorschau an', () => {
		const teaser = CATALOG_PREVIEWS['standard-teaser'];
		expect(teaser).toBeDefined();
		expect(teaser.css).toContain('@container (min-width: 48em)');
		expect(teaser.css).not.toContain('@media');
	});
});
