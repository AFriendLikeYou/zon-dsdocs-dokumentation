import { describe, it, expect } from 'vitest';
import {
	VIEWPORT_PRESETS,
	viewportPresets,
	viewportWidth,
	type ViewportPreset
} from './ViewportSelect.svelte';

// Reine (DOM-freie) Logik des Atoms. Die Bedienung selbst liegt im
// SegmentedControl und ist dort abgedeckt; hier zählt, was der Consumer aus der
// Auswahl macht — die Breite.

// Die Referenzbreite, wie die Anatomie sie hereinreicht (Carousel: 375).
const referenz: ViewportPreset = {
	value: 'referenz',
	label: '375',
	width: 375,
	title: 'Referenzbreite des Modells — 375 px'
};

describe('VIEWPORT_PRESETS', () => {
	it('sind die real im Repo genutzten @media-Grenzen — und „Frei" ist keine', () => {
		expect(VIEWPORT_PRESETS.map((p) => p.width)).toEqual([null, 560, 768, 1280]);
	});
	it('„Frei" ist ein ECHTES Segment (sonst verliert die Gruppe ihren Tabstop)', () => {
		// SegmentedControl vergibt den Tabstop über `value === o.value`. Ein
		// Ausgangszustand ohne passendes Segment machte die Gruppe für die
		// Tastatur unerreichbar.
		expect(VIEWPORT_PRESETS[0].value).toBe('frei');
	});
});

describe('viewportPresets', () => {
	it('ohne Zusatzstufe: unverändert', () => {
		expect(viewportPresets()).toBe(VIEWPORT_PRESETS);
		expect(viewportPresets(null)).toBe(VIEWPORT_PRESETS);
	});
	it('sortiert die Zusatzstufe nach Breite ein, „Frei" bleibt vorn', () => {
		expect(viewportPresets(referenz).map((p) => p.width)).toEqual([null, 375, 560, 768, 1280]);
	});
	it('eine Zusatzstufe am oberen Ende landet hinten, nicht in der Mitte', () => {
		const breit = { ...referenz, label: '1000', width: 1000 };
		expect(viewportPresets(breit).map((p) => p.width)).toEqual([null, 560, 768, 1000, 1280]);
	});
});

describe('viewportWidth', () => {
	it('liefert die Breite der gewählten Stufe', () => {
		expect(viewportWidth('mobil')).toBe(560);
		expect(viewportWidth('desktop')).toBe(1280);
	});
	it('„Frei" heißt: volle Bühnenbreite, also keine gesetzte Breite', () => {
		expect(viewportWidth('frei')).toBeNull();
	});
	it('die Zusatzstufe ist nur erreichbar, wenn der Consumer sie mitgibt', () => {
		expect(viewportWidth('referenz')).toBeNull();
		expect(viewportWidth('referenz', referenz)).toBe(375);
	});
	it('unbekannter Wert fällt auf volle Breite zurück (nie auf eine falsche Zahl)', () => {
		expect(viewportWidth('gibt-es-nicht', referenz)).toBeNull();
	});
});
