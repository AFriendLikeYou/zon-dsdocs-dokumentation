import { describe, it, expect } from 'vitest';
import { validateProp, validateValues } from './validation';
import type { CmsPropDef } from './cms-components';

const TOKENS = ['--z-ds-color-background-0', '--z-ds-color-text-100', '--ds-accent'];

const p = (over: Partial<CmsPropDef>): CmsPropDef => ({
	key: 'x',
	label: 'X',
	type: 'text',
	default: '',
	...over
});

describe('validateProp', () => {
	it('meldet leere Pflichtfelder', () => {
		expect(validateProp(p({ required: true }), '', TOKENS)).toMatch(/Pflichtfeld/);
		expect(validateProp(p({ required: true }), '  ', TOKENS)).toMatch(/Pflichtfeld/);
		expect(validateProp(p({}), '', TOKENS)).toBeNull();
	});

	it('akzeptiert gültige URLs und lehnt Tippfehler ab', () => {
		const url = p({ format: 'url' });
		expect(validateProp(url, 'https://zeit.de/x', TOKENS)).toBeNull();
		expect(validateProp(url, '/brand/logo', TOKENS)).toBeNull();
		expect(validateProp(url, 'mailto:a@zeit.de', TOKENS)).toBeNull();
		expect(validateProp(url, 'www,zeit.de', TOKENS)).toMatch(/Ungültige URL/);
		expect(validateProp(url, 'www.zeit.de', TOKENS)).toMatch(/Ungültige URL/);
	});

	it('prüft Medientyp: Bildfeld lehnt Videos/Fremdes ab, Videofeld lehnt Bilder ab', () => {
		const img = p({ type: 'media', mediaKind: 'image' });
		const vid = p({ type: 'media', mediaKind: 'video' });
		expect(validateProp(img, '/media/a.png', TOKENS)).toBeNull();
		expect(validateProp(img, '/media/a.mp4', TOKENS)).toMatch(/Bilddatei/);
		expect(validateProp(vid, '/media/a.mp4', TOKENS)).toBeNull();
		expect(validateProp(vid, '/media/a.png', TOKENS)).toMatch(/Videodatei/);
	});

	it('prüft Farb-Token gegen die echte Liste, erlaubt Hex/rgb', () => {
		const tok = p({ format: 'token-color' });
		expect(validateProp(tok, '--z-ds-color-text-100', TOKENS)).toBeNull();
		expect(validateProp(tok, '--zds-black', TOKENS)).toMatch(/Unbekanntes Token/);
		expect(validateProp(tok, '#000000', TOKENS)).toBeNull();
		expect(validateProp(tok, '#ccc', TOKENS)).toBeNull();
		expect(validateProp(tok, 'rgb(0 0 0 / 0.5)', TOKENS)).toBeNull();
		expect(validateProp(tok, 'schwarz', TOKENS)).toMatch(/Kein gültiger Farbwert/);
	});

	it('prüft Zahlen', () => {
		const num = p({ type: 'number' });
		expect(validateProp(num, '4', TOKENS)).toBeNull();
		expect(validateProp(num, '4.5', TOKENS)).toMatch(/ganze Zahl/);
		expect(validateProp(num, 'vier', TOKENS)).toMatch(/ganze Zahl/);
	});

	it('booleans sind immer valide', () => {
		expect(validateProp(p({ type: 'boolean' }), true, TOKENS)).toBeNull();
		expect(validateProp(p({ type: 'boolean' }), false, TOKENS)).toBeNull();
	});
});

describe('validateValues', () => {
	it('sammelt Fehler pro Key', () => {
		const props: CmsPropDef[] = [
			p({ key: 'url', format: 'url', required: true }),
			p({ key: 'title' })
		];
		const errs = validateValues(props, { url: '', title: 'ok' }, TOKENS);
		expect(Object.keys(errs)).toEqual(['url']);
	});
});
