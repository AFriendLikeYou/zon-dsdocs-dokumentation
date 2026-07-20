import { describe, it, expect } from 'vitest';
import { isDegraded, statusForDirs, formatStatus } from './import.mjs';

// GATE-1-Erkennung des Import-Orchestrators: stoppt der Lauf nach dem Fetch,
// weil die Token-Namen fehlen (REST ohne Enterprise liefert nur IDs)?
describe('import.mjs · isDegraded (Gate 1)', () => {
	it('TokenIds ohne Namen → degradiert (stoppt)', () => {
		const raw = '{"variants":{"0":{"fills":[{"hex":"#fff","tokenId":"VariableID:1:2","token":""}]}}}';
		expect(isDegraded(raw)).toBe(true);
	});

	it('padTokenId ohne Namen → degradiert', () => {
		expect(isDegraded('{"layout":{"padTokenId":"VariableID:3:4"}}')).toBe(true);
	});

	it('TokenIds MIT Namen → nicht degradiert (läuft durch)', () => {
		const raw =
			'{"variants":{"0":{"fills":[{"hex":"#fff","tokenId":"VariableID:1:2","token":"--z-ds-color-background-0"}]}}}';
		expect(isDegraded(raw)).toBe(false);
	});

	it('gar keine Tokens → nicht degradiert (nichts zu ergänzen)', () => {
		expect(isDegraded('{"set":{"id":"1:2","name":"X"},"variants":{}}')).toBe(false);
	});
});

// --status: reines Statusmodell (Hinweise + Summen) ist fs-frei testbar.
describe('import.mjs · statusForDirs (--status)', () => {
	const full = {
		slug: 'button-group',
		raw: true,
		draft: false,
		model: true,
		pattern: true,
		content: true,
		page: true,
		degraded: false,
		draftOpen: false
	};

	it('vollständige Komponente → kein Hinweis', () => {
		const { rows } = statusForDirs([full]);
		expect(rows[0].hinweis).toBe('');
		expect(rows[0].cells).toEqual({
			raw: true,
			draft: false,
			model: true,
			pattern: true,
			content: true,
			page: true
		});
	});

	it('kein raw-Fixture → „raw fehlt"', () => {
		const { rows } = statusForDirs([{ ...full, raw: false }]);
		expect(rows[0].hinweis).toBe('raw fehlt');
	});

	it('raw da, aber degradiert → „Gate 1" (nicht „raw fehlt")', () => {
		const { rows } = statusForDirs([{ ...full, degraded: true }]);
		expect(rows[0].hinweis).toBe('Gate 1');
	});

	it('offener Draft → „draft offen" (kombiniert mit raw-Hinweis)', () => {
		const { rows } = statusForDirs([{ ...full, raw: false, draft: true, draftOpen: true }]);
		expect(rows[0].hinweis).toBe('raw fehlt, draft offen');
	});

	it('summiert die Stufen über alle Komponenten', () => {
		const { totals } = statusForDirs([
			full,
			{ ...full, slug: 'x', raw: false, model: false },
			{ ...full, slug: 'y', degraded: true }
		]);
		expect(totals).toEqual({ total: 3, raw: 2, model: 2, page: 3, gate1: 1, draftOpen: 0 });
	});
});

describe('import.mjs · formatStatus', () => {
	it('rendert Kopf, Glyphen (✓/–) und Summen-Fußzeile', () => {
		const out = formatStatus(
			statusForDirs([
				{
					slug: 'button',
					raw: false,
					draft: false,
					model: true,
					pattern: true,
					content: true,
					page: true,
					degraded: false,
					draftOpen: false
				}
			])
		);
		expect(out).toContain('Komponente');
		expect(out).toContain('button');
		expect(out).toContain('✓');
		expect(out).toContain('–');
		expect(out).toContain('raw fehlt');
		expect(out).toContain('raw-Fixtures: 0/1');
	});
});
