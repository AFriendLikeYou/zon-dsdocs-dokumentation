import { describe, it, expect } from 'vitest';
import { readSlash } from './slash';

describe('readSlash', () => {
	it('öffnet bei nacktem „/" am Feldanfang', () => {
		expect(readSlash('/', 1)).toEqual({ start: 0, query: '' });
	});

	it('liest die Query nach dem Slash', () => {
		expect(readSlash('/head', 5)).toEqual({ start: 0, query: 'head' });
	});

	it('erlaubt den Slash nach Whitespace', () => {
		expect(readSlash('Text /bi', 8)).toEqual({ start: 5, query: 'bi' });
	});

	it('erlaubt den Slash am Zeilenanfang (nach \\n)', () => {
		expect(readSlash('Zeile1\n/bild', 12)).toEqual({ start: 7, query: 'bild' });
	});

	it('triggert nicht mitten im Wort', () => {
		expect(readSlash('http://x', 8)).toBeNull();
		expect(readSlash('a/b', 3)).toBeNull();
	});

	it('schließt, sobald Whitespace in der Query steht', () => {
		expect(readSlash('/head er', 8)).toBeNull();
	});

	it('gibt null ohne Slash oder bei Cursor 0 zurück', () => {
		expect(readSlash('abc', 3)).toBeNull();
		expect(readSlash('/', 0)).toBeNull();
	});

	it('bezieht sich auf den Slash unmittelbar vor dem Cursor', () => {
		// Cursor direkt hinter „/img" — der frühere Text ist irrelevant.
		expect(readSlash('/text und /img', 14)).toEqual({ start: 10, query: 'img' });
	});
});
