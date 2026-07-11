import { describe, it, expect } from 'vitest';
import { pageTemplate } from './new-page';
import { parseSvx, rebuild, checkIslandGuard } from './segment';

/**
 * Regression (E2E-Fund 2026-07-11): Auf frisch per CMS angelegten Seiten brach
 * JEDER Save am Insel-Guard ab. Ursache: das alte Template schrieb `# {title}`
 * in die Prosa — die Svelte-Expression verklebte den gesamten Body zur
 * geschützten Insel, und der Rebuild duplizierte sie. Das Template schreibt den
 * H1 jetzt literal; dieser Test hält den Save-Pfad auf Template-Seiten grün.
 */
describe('Save auf frischer Template-Seite (Insel-Guard)', () => {
	const raw = pageTemplate('E2E Smoke');
	const before = parseSvx(raw);

	it('Template ist safe und hat editierbare Prosa mit dem H1', () => {
		expect(before.safe).toBe(true);
		const prosa = before.segments.filter((s) => s.type === 'prosa');
		expect(prosa.length).toBeGreaterThan(0);
		expect(prosa.map((s) => s.text).join('\n')).toContain('# E2E Smoke');
	});

	it('Prosa-Edit passiert den Guard und landet im Output', () => {
		const prosaIdx = before.segments.findIndex((s) => s.type === 'prosa');
		const blocks = before.segments.map((s, i) =>
			i === prosaIdx ? { keep: i, prose: '# E2E Smoke\n\nE2E war hier.' } : { keep: i }
		);
		const next = rebuild(raw, { blocks });
		expect(checkIslandGuard(before, parseSvx(next)).ok).toBe(true);
		expect(next).toContain('E2E war hier');
	});

	it('Prosa mit Svelte-Expression wird konservativ abgelehnt (Guard, kein Datenverlust)', () => {
		// Wer {title} in den Text tippt, erzeugt eine neue Insel → Guard blockiert
		// den Save (bewusst: lieber ablehnen als still verkleben/duplizieren).
		const prosaIdx = before.segments.findIndex((s) => s.type === 'prosa');
		const blocks = before.segments.map((s, i) =>
			i === prosaIdx ? { keep: i, prose: '# {title}\n\nText.' } : { keep: i }
		);
		const next = rebuild(raw, { blocks });
		expect(checkIslandGuard(before, parseSvx(next)).ok).toBe(false);
	});
});
