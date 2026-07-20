/**
 * Neue-Seite-Helfer (rein, testbar): Slug aus dem Titel ableiten, Anlage
 * validieren und das minimale `.svx`-Gerüst erzeugen. Genutzt von der
 * create-Action der Übersicht (Server) und live im Formular (Slug-Vorschau).
 */

export const SLUG_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export function slugify(title: string): string {
	return title
		.trim()
		.toLowerCase()
		.replace(/ä/g, 'ae')
		.replace(/ö/g, 'oe')
		.replace(/ü/g, 'ue')
		.replace(/ß/g, 'ss')
		.normalize('NFD')
		.replace(/[̀-ͯ]/g, '')
		.replace(/[^a-z0-9]+/g, '-')
		.replace(/^-+|-+$/g, '');
}

/**
 * Anlage-Validierung. `existingHrefs` = alle Nav-Hrefs (collectHrefs) — die
 * Route-Kollision prüft der Server zusätzlich gegen das Dateisystem.
 */
export function validateNewPage(
	title: string,
	slug: string,
	existingHrefs: readonly string[]
): string | null {
	if (!title.trim()) return 'Bitte einen Titel angeben.';
	// Frontmatter bleibt unquoted (wie auf allen Seiten) → diese Zeichen würden
	// das YAML brechen. Lieber ehrlich ablehnen als still kaputtschreiben.
	if (/[:"\n]/.test(title))
		return 'Titel darf keinen Doppelpunkt und keine Anführungszeichen enthalten.';
	// Geschweifte Klammern wären im Markdown-H1 eine Svelte-Expression → die Prosa
	// würde vom Parser zur geschützten Insel verklebt und die Seite unspeicherbar.
	if (/[{}]/.test(title)) return 'Titel darf keine geschweiften Klammern enthalten.';
	if (!SLUG_RE.test(slug))
		return 'Slug bitte nur mit Kleinbuchstaben, Zahlen und Bindestrichen (z. B. „neue-seite").';
	if (existingHrefs.includes(`/brand/${slug}`)) return `„/brand/${slug}“ existiert bereits.`;
	return null;
}

/**
 * Minimales Seiten-Gerüst (Muster: pride-communication): Frontmatter-Titel,
 * Head-Titel, LEERER Script-Block (macht Komponenten sofort einfügbar, siehe
 * hasScript-Gate im Editor), H1 + Start-Absatz.
 *
 * Der H1 steht bewusst LITERAL (nicht `# {title}`): eine Svelte-Expression in
 * der Prosa würde vom Parser zur geschützten Insel verklebt — der Titel wäre im
 * CMS uneditierbar, und der Insel-Guard bräche JEDEN Save der frischen Seite ab
 * (E2E-Fund 2026-07-11).
 */
export function pageTemplate(title: string): string {
	return [
		'---',
		`title: ${title.trim()}`,
		'---',
		'',
		'<svelte:head>',
		'\t<title>{title} - Die Zeit Design System</title>',
		'</svelte:head>',
		'',
		'<script lang="ts">',
		'</script>',
		'',
		`# ${title.trim()}`,
		'',
		'Inhalte folgen.',
		''
	].join('\n');
}
