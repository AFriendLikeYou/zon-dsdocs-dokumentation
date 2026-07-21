// Startseiten-Editor (Formular, KEIN Block-Editor).
//
// Die Landing ist eine komponierte Seite, kein Dokument: Hero-Bühne, Verlauf und
// scroll-getriebene Animation gehören zur Gestaltung. Der Prosa-/Block-Editor
// würde daraus einen einzigen schreibgeschützten Riesenblock machen — deshalb
// hier dasselbe Muster wie im Spec-Editor (/admin/product/components/[slug]):
// eine JSON-Datei mit klarem Schema, gepflegt über ein Formular.
//
// Schreiben trifft NUR `src/routes/landing.content.json` und ist dev-only —
// identisch zum Spec-Editor (Prod, adapter-vercel/serverless: fs-Writes sind
// nicht persistent, dort öffnet Phase 1b einen GitHub-PR).
import { dev } from '$app/environment';
import { fail } from '@sveltejs/kit';
import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import {
	LANDING_CONTENT_PATH,
	normalizeLandingContent,
	serializeLandingContent,
	validateLandingContent
} from './landing-content';

const filePath = () => resolve(process.cwd(), LANDING_CONTENT_PATH);

function readContent() {
	try {
		return normalizeLandingContent(JSON.parse(readFileSync(filePath(), 'utf8')));
	} catch {
		// Kaputte/fehlende Datei → leeres Modell; die Validierung meldet dann die
		// Pflichtfelder, statt den Editor mit einem 500er unbedienbar zu machen.
		return normalizeLandingContent({});
	}
}

export const load = () => ({
	content: readContent(),
	viewHref: '/',
	writable: dev
});

export const actions = {
	default: async ({ request }) => {
		if (!dev)
			return fail(400, {
				message: 'Schreiben nur im Dev-Modus. Prod öffnet später einen GitHub-PR.'
			});

		const data = await request.formData();
		let patch: unknown;
		try {
			patch = JSON.parse(String(data.get('payload') ?? '{}'));
		} catch {
			return fail(400, { message: 'Ungültige Daten.' });
		}

		// Normalisieren wirft unbekannte Schlüssel weg (geschlossenes Schema) …
		const content = normalizeLandingContent(patch);
		// … und erst danach wird gegen dieselben Regeln geprüft wie im Client.
		const issues = validateLandingContent(content);
		if (issues.length)
			return fail(400, {
				message: `Startseiten-Texte ungültig: ${issues.map((i) => i.text).join('; ')}`
			});

		// Byte-stabil: kanonische Schlüsselreihenfolge, Tabs, Schluss-Newline.
		writeFileSync(filePath(), serializeLandingContent(content));
		return { saved: true };
	}
};
