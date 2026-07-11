import { describe, it, expect } from 'vitest';
import { slugify, validateNewPage, pageTemplate } from './new-page';

describe('slugify', () => {
	it('macht Titel zu URL-Slugs (Umlaute, Leerzeichen, Sonderzeichen)', () => {
		expect(slugify('Neue Seite')).toBe('neue-seite');
		expect(slugify('Barrierefreiheit & Kontrast')).toBe('barrierefreiheit-kontrast');
		expect(slugify('Größen-Übersicht')).toBe('groessen-uebersicht');
		expect(slugify('  Café Été  ')).toBe('cafe-ete');
		expect(slugify('---')).toBe('');
	});
});

describe('validateNewPage', () => {
	const HREFS = ['/brand/color', '/brand/identity/strategy'];

	it('akzeptiert einen sauberen Neuzugang', () => {
		expect(validateNewPage('Neue Seite', 'neue-seite', HREFS)).toBeNull();
	});

	it('lehnt leere Titel, YAML-Brecher und kaputte Slugs ab', () => {
		expect(validateNewPage('', 'x', HREFS)).toMatch(/Titel/);
		expect(validateNewPage('A: B', 'a-b', HREFS)).toMatch(/Doppelpunkt/);
		expect(validateNewPage('Ok', 'Neue Seite', HREFS)).toMatch(/Slug/);
		expect(validateNewPage('Ok', '../hack', HREFS)).toMatch(/Slug/);
		expect(validateNewPage('Ok', '', HREFS)).toMatch(/Slug/);
	});

	it('lehnt Kollisionen mit bestehenden Seiten ab', () => {
		expect(validateNewPage('Farbe', 'color', HREFS)).toMatch(/existiert bereits/);
	});
});

describe('pageTemplate', () => {
	it('erzeugt ein editierbares Gerüst mit Script-Block und H1', () => {
		const svx = pageTemplate('Neue Seite');
		expect(svx).toContain('title: Neue Seite');
		expect(svx).toContain('<script lang="ts">');
		expect(svx).toContain('# {title}');
		expect(svx.endsWith('\n')).toBe(true);
	});
});
