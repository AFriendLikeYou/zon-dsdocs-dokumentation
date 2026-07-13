import { describe, it, expect } from 'vitest';
import { isDegraded } from './import.mjs';

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
