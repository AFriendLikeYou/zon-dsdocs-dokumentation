/**
 * Geteilter Kern der Asset-Generatoren (Icons + Brand-Assets).
 *
 * Prinzip „Discovery + Override-Map": Alle `*.svg` eines Ordners werden automatisch
 * entdeckt (Drift-frei), Standard-Felder abgeleitet, und nur die NICHT ableitbaren
 * Felder (Name-Sonderfälle, slug, tags, Ausschlüsse) aus einer Override-Map gemerged.
 * Erzeugt ein getyptes `IconPre[]`-Datenfile im Repo-Stil (Tabs, single quotes).
 */
import fs from 'node:fs';

/** 'arrow-down' -> 'Arrow Down' */
export function titleCase(slug) {
	return slug
		.split('-')
		.map((word) => (word ? word[0].toUpperCase() + word.slice(1) : word))
		.join(' ');
}

/**
 * @param {{ svgDir: string, pathPrefix: string, overrides: Record<string, {name?:string,slug?:string,tags?:string[],exclude?:boolean}> }} opts
 * @returns {{ entries: object[], excluded: string[], unknownOverrides: string[] }}
 */
export function discoverAssets({ svgDir, pathPrefix, overrides }) {
	const files = fs.readdirSync(svgDir).filter((f) => f.endsWith('.svg'));
	const bases = new Set(files.map((f) => f.replace(/\.svg$/, '')));
	const entries = [];
	const excluded = [];
	for (const file of files) {
		const base = file.replace(/\.svg$/, '');
		const ov = overrides[base] ?? {};
		if (ov.exclude) {
			excluded.push(base);
			continue;
		}
		const entry = {
			name: ov.name ?? titleCase(base),
			slug: ov.slug ?? base,
			path: `${pathPrefix}${file}`
		};
		if (ov.tags) entry.tags = ov.tags;
		entries.push(entry);
	}
	entries.sort((a, b) => a.name.localeCompare(b.name));
	// Overrides, die auf keine Datei mehr zeigen (Tippfehler / gelöschte SVG) — für Checks.
	const unknownOverrides = Object.keys(overrides).filter((k) => !bases.has(k));
	return { entries, excluded, unknownOverrides };
}

const q = (s) => `'${String(s).replace(/\\/g, '\\\\').replace(/'/g, "\\'")}'`;

/**
 * @param {{ constName: string, entries: object[], generatorName: string, overridesName: string, regenCmd: string }} opts
 */
export function renderIconPreFile({ constName, entries, generatorName, overridesName, regenCmd }) {
	const rows = entries.map((e) => {
		const parts = [`\t\tname: ${q(e.name)}`, `\t\tslug: ${q(e.slug)}`, `\t\tpath: ${q(e.path)}`];
		if (e.tags) parts.push(`\t\ttags: [${e.tags.map(q).join(', ')}]`);
		return `\t{\n${parts.join(',\n')}\n\t}`;
	});
	return (
		`// AUTOGENERIERT von ${generatorName} — NICHT von Hand editieren.\n` +
		`// Neue SVGs erscheinen automatisch; kuratierte Felder (Name-Sonderfälle, slug, tags,\n` +
		`// Ausschlüsse) in ${overridesName} pflegen. Neu erzeugen: ${regenCmd}\n` +
		`import type { IconPre } from '$types/global';\n\n` +
		`export const ${constName}: IconPre[] = [\n${rows.join(',\n')}\n];\n`
	);
}
