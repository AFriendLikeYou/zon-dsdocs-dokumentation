import { describe, it, expect } from 'vitest';
import {
	collectDefinedTokens,
	collectVarRefs,
	extractStyleBlocks,
	collectModelTokens,
	collectTsTokens,
	diffTokens
} from './check-token-refs.mjs';

// Zero-Reference-Guard: die reinen Parse-/Abgleich-Funktionen (fs-frei).

describe('collectDefinedTokens', () => {
	it('nimmt nur Property-Definitionen, nicht var()-Nutzungen', () => {
		const css = `:root {
			--z-ds-color-text-100: #252525;
			--ds-x: var(--z-ds-color-text-100);
		}`;
		expect(collectDefinedTokens(css)).toEqual(['--z-ds-color-text-100']);
	});

	it('erfasst --rgb-Suffixe als eigene Tokens', () => {
		expect(collectDefinedTokens('--z-ds-color-background-0--rgb: 255,255,255;')).toEqual([
			'--z-ds-color-background-0--rgb'
		]);
	});
});

describe('collectVarRefs', () => {
	it('sammelt var()-Nutzungen (auch mit Whitespace/Fallback)', () => {
		const css = 'a{color:var(--z-ds-color-text-100)} b{font-family:var( --z-ds-font-mono, monospace)}';
		expect(collectVarRefs(css)).toEqual(['--z-ds-color-text-100', '--z-ds-font-mono']);
	});

	it('ignoriert Token-Globs in Kommentaren (kein var)', () => {
		expect(collectVarRefs('/* --z-ds-space-* und --z-ds-lineheight-* */')).toEqual([]);
	});
});

describe('extractStyleBlocks', () => {
	it('zieht nur den Inhalt der <style>-Blöcke', () => {
		const svelte = `<div>var(--z-ds-nope)</div>\n<style>a{color:var(--z-ds-color-text-100)}</style>`;
		const refs = collectVarRefs(extractStyleBlocks(svelte));
		expect(refs).toEqual(['--z-ds-color-text-100']);
	});
});

describe('collectModelTokens', () => {
	it('liest name/token/tokensProZustand, inkl. annotierter Token-Felder', () => {
		const model = JSON.stringify({
			name: 'Button',
			tokens: [{ items: [{ name: '--z-ds-color-background-10' }] }],
			masse: { radius: { token: '--z-ds-border-radius-4' } },
			spacing: [{ token: '--z-ds-space-m (nur Small; Wide = 54px)' }],
			farbrollen: {
				elemente: [{ tokensProZustand: { default: '--z-ds-color-focus-100', hover: 'none' } }]
			},
			render: { codeNote: 'echte --z-ds-Tokens' }
		});
		expect(collectModelTokens(model).sort()).toEqual([
			'--z-ds-border-radius-4',
			'--z-ds-color-background-10',
			'--z-ds-color-focus-100',
			'--z-ds-space-m'
		]);
	});

	it('ignoriert Prosa mit Groß-T („--z-ds-Tokens") und "none"', () => {
		const model = JSON.stringify({ render: { repoNote: 'auf echten --z-ds-Tokens' } });
		expect(collectModelTokens(model)).toEqual([]);
	});
});

describe('collectTsTokens', () => {
	it('nimmt nur voll-gequotete Literale, keine Kommentar-Globs', () => {
		const ts = `/* --z-ds-space-* Glob */\nconst x = { raw: '--z-ds-color-text-100' };`;
		expect(collectTsTokens(ts)).toEqual(['--z-ds-color-text-100']);
	});

	it('matcht keinen gequoteten Glob', () => {
		expect(collectTsTokens(`const g = '--z-ds-space-*';`)).toEqual([]);
	});
});

describe('diffTokens', () => {
	const canonical = ['--z-ds-color-text-100'];

	it('meldet referenzierte, aber nicht definierte Tokens gruppiert', () => {
		const { unknownRefs, unknownPinned } = diffTokens(
			canonical,
			[
				{ token: '--z-ds-color-text-100', file: 'a.css' }, // bekannt → ok
				{ token: '--z-ds-font-mono', file: 'a.css' },
				{ token: '--z-ds-font-mono', file: 'b.svelte' }
			],
			[]
		);
		expect(unknownPinned.size).toBe(0);
		expect(unknownRefs.size).toBe(1);
		expect([...unknownRefs.get('--z-ds-font-mono')].sort()).toEqual(['a.css', 'b.svelte']);
	});

	it('trennt gepinnte, upstream unbekannte Tokens in eigene Kategorie', () => {
		const { unknownRefs, unknownPinned } = diffTokens(
			canonical,
			[],
			[{ token: '--z-ds-color-legacy', file: 'global.css' }]
		);
		expect(unknownRefs.size).toBe(0);
		expect(unknownPinned.size).toBe(1);
		expect(unknownPinned.has('--z-ds-color-legacy')).toBe(true);
	});

	it('keine Befunde, wenn alles definiert ist', () => {
		const { unknownRefs, unknownPinned } = diffTokens(
			canonical,
			[{ token: '--z-ds-color-text-100', file: 'a.css' }],
			[{ token: '--z-ds-color-text-100', file: 'global.css' }]
		);
		expect(unknownRefs.size).toBe(0);
		expect(unknownPinned.size).toBe(0);
	});
});
