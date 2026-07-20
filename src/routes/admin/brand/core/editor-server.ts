// Server-Factory des SVX-Editors: EIN Load/Save-Paar, parametrisiert nach
// Bereich (brand | product). Beide Editor-Routen (/admin/brand/[...path] und
// /admin/product/[...path]) sind dünne Aufrufer — das Sicherheitsmodell
// (Insel-Guard, dev-only-Writes, Traversal-Schutz via Enumeration) lebt hier
// EINMAL. Die Komponenten-Palette kommt pro Bereich rein: Brand = volle
// Registry, Product = kuratierte Teilmenge (die Figma-Specs der generierten
// Seiten sind ohnehin ausgeschlossen, siehe brand-fs.server).
import { dev } from '$app/environment';
import { error, fail } from '@sveltejs/kit';
import { writeFileSync } from 'node:fs';
import { findSvxPage, readSvx, trimBlankEnds, type SvxRoot } from './brand-fs.server';
import { listMediaFiles } from '../../media-fs.server';
import { listColorTokens } from './tokens.server';
import {
	parseSvx,
	rebuild,
	proseFrame,
	checkIslandGuard,
	hasScriptBlock,
	IMG_ONLY_ISLAND,
	type SvxEdits
} from './segment';
import { componentIslandInfo, containerIslandInfo, type CmsComponentDef } from './cms-components';

interface FieldVM {
	key: string;
	value: string;
}
interface ComponentVM {
	name: string;
	label: string;
	props: CmsComponentDef['props'];
	values: Record<string, string | boolean>;
}
interface ContainerVM {
	name: string;
	label: string;
	props: CmsComponentDef['props'];
	values: Record<string, string | boolean>;
	childTypes: string[];
	children: ComponentVM[];
}
type BlockKind = 'prosa' | 'component' | 'container' | 'img' | 'structural' | 'protected';
interface SegmentVM {
	index: number;
	type: 'prosa' | 'insel';
	content: string;
	kind: BlockKind;
	/** Anzeige-Label (Komponenten-Name, „Bild", „Script", Container-Name …). */
	label: string;
	/** Darf per Hoch/Runter umsortiert werden (alles außer Struktur-Inseln). */
	movable: boolean;
	/** Darf gelöscht werden — mutable (Bild/registrierte Leaf/Container) + Prosa. */
	deletable: boolean;
	/** Gesetzt, wenn die Insel eine editierbare, registrierte Leaf-Komponente ist. */
	component?: ComponentVM;
	/** Gesetzt, wenn die Insel ein editierbarer, registrierter Container ist. */
	container?: ContainerVM;
}

const STRUCTURAL_RE = /^<(script|style|svelte:head)[\s>]|^<!--/;

/**
 * Sprechende Namen für nicht registrierte HTML-Inseln. Ohne diese Tabelle hieße der
 * Block schlicht „p" oder „h2" — für Redakteur:innen bedeutungslos. Nicht gelistete
 * Tags (v. a. GROSS geschriebene Svelte-Komponenten wie `CardGrid`, `TypeSpecimen`)
 * behalten ihren Komponentennamen: der ist die beste verfügbare Kennung.
 */
const HTML_LABEL: Record<string, string> = {
	p: 'Absatz',
	h1: 'Überschrift 1',
	h2: 'Überschrift 2',
	h3: 'Überschrift 3',
	h4: 'Überschrift 4',
	h5: 'Überschrift 5',
	h6: 'Überschrift 6',
	ul: 'Liste',
	ol: 'Nummerierte Liste',
	li: 'Listenpunkt',
	table: 'Tabelle',
	blockquote: 'Zitat',
	figure: 'Abbildung',
	section: 'Abschnitt',
	div: 'Layout-Block',
	span: 'Text-Auszeichnung',
	a: 'Link',
	video: 'Video (HTML)',
	iframe: 'Eingebetteter Inhalt'
};

/** Label einer geschützten Insel: HTML-Tag → deutscher Name, Komponente → ihr Name. */
export function protectedLabel(content: string): string {
	const t = content.trim();
	// Markdown-Überschrift mit Interpolation (`# {title}`) — kein Tag, aber klar benennbar.
	const md = /^(#{1,6})\s/.exec(t);
	if (md) return md[1].length === 1 ? 'Seiten-Überschrift' : `Überschrift ${md[1].length}`;
	const tag = /^<([A-Za-z][\w:-]*)/.exec(t)?.[1];
	if (!tag) return 'Block';
	return HTML_LABEL[tag.toLowerCase()] ?? tag;
}

function classifyIsland(content: string): {
	kind: BlockKind;
	label: string;
	movable: boolean;
	deletable: boolean;
} {
	if (IMG_ONLY_ISLAND.test(content))
		return { kind: 'img', label: 'Bild', movable: true, deletable: true };
	if (STRUCTURAL_RE.test(content)) {
		const tag = /^<(script|style|svelte:head|!--)/.exec(content)?.[1] ?? '';
		const label =
			tag === 'script'
				? 'Script'
				: tag === 'style'
					? 'Style'
					: tag === 'svelte:head'
						? 'Head'
						: 'Kommentar';
		return { kind: 'structural', label, movable: false, deletable: false };
	}
	// Erkannt, aber nicht editierbar: benannter Read-only-Baustein. `movable` (die
	// Reihenfolge ist multiset-invariant und damit guard-sicher), aber NICHT
	// `deletable` — eine nicht-mutable Insel darf laut `checkIslandGuard` nicht
	// verschwinden, ein Lösch-Button würde den Save garantiert abbrechen lassen.
	return { kind: 'protected', label: protectedLabel(content), movable: true, deletable: false };
}

export interface EditorRouteOpts {
	/** Insert-Palette dieses Bereichs (Brand: volle Registry, Product: Teilmenge). */
	components: CmsComponentDef[];
	/** Krümel zurück zur Bereichs-Übersicht. */
	backHref: string;
	backLabel: string;
}

export function makeEditorLoad(root: SvxRoot, opts: EditorRouteOpts) {
	// Kind-Typen dürfen nur aus der Palette DIESES Bereichs kommen: der Editor löst
	// `childTypes` über die Palette auf — ein nicht enthaltener Typ (z. B. `Color` in
	// `Grid.childTypes` auf einer Product-Seite) wäre im Dropdown wählbar, ließe sich
	// aber nicht anlegen. Bestehende Kinder bleiben davon unberührt (sie werden aus
	// der Datei geparst, nicht aus der Palette).
	const paletteNames = new Set(opts.components.map((c) => c.name));
	const allowedChildTypes = (types: string[] | undefined): string[] =>
		(types ?? []).filter((n) => paletteNames.has(n));

	return ({ params }: { params: { path: string } }) => {
		const page = findSvxPage(params.path, root);
		if (!page) throw error(404, 'Unbekannte oder nicht editierbare Seite.');

		const raw = readSvx(page.file);
		const parsed = parseSvx(raw);
		const title = parsed.fields.find((f) => f.key === 'title')?.value ?? params.path;
		const fields: FieldVM[] = parsed.fields.map((f) => ({
			key: f.key,
			value: f.value
		}));

		// bodyLocked: falls das Splitting nicht round-trip-sicher wäre (Insel-Leak
		// o. Ä.), wird der komplette Body als eine geschützte Insel gezeigt — nur
		// Frontmatter editierbar. Die ehrliche, konservative Absicherung.
		const bodyLocked = !parsed.safe;
		const segments: SegmentVM[] = bodyLocked
			? [
					{
						index: 0,
						type: 'insel',
						content: trimBlankEnds(parsed.body),
						kind: 'protected',
						label: 'Body',
						movable: false,
						deletable: false
					}
				]
			: parsed.segments.map((s, index) => {
					const content = s.type === 'prosa' ? proseFrame(s.text).core : trimBlankEnds(s.text);
					if (s.type === 'prosa') {
						return {
							index,
							type: s.type,
							content,
							kind: 'prosa' as const,
							label: 'Text',
							movable: true,
							deletable: true
						};
					}
					const info = componentIslandInfo(content);
					if (info) {
						return {
							index,
							type: s.type,
							content,
							kind: 'component' as const,
							label: info.def.label,
							movable: true,
							deletable: true,
							component: {
								name: info.def.name,
								label: info.def.label,
								props: info.def.props,
								values: info.values
							}
						};
					}
					const cinfo = containerIslandInfo(content);
					if (cinfo) {
						return {
							index,
							type: s.type,
							content,
							kind: 'container' as const,
							label: cinfo.def.label,
							movable: true,
							deletable: true,
							container: {
								name: cinfo.def.name,
								label: cinfo.def.label,
								props: cinfo.def.props,
								values: cinfo.attrs,
								childTypes: allowedChildTypes(cinfo.def.childTypes),
								children: cinfo.children.map((c) => ({
									name: c.def.name,
									label: c.def.label,
									props: c.def.props,
									values: c.values
								}))
							}
						};
					}
					const cls = classifyIsland(content);
					return { index, type: s.type, content, ...cls };
				});

		// Insert-Palette nur, wenn ein <script>-Block existiert (Import-Management).
		const hasScript = !bodyLocked && hasScriptBlock(parsed.body);
		const lastIndex = segments.length ? segments[segments.length - 1].index : 0;

		return {
			path: params.path,
			url: page.url,
			title,
			fields,
			segments,
			bodyLocked,
			hasScript,
			lastIndex,
			components: opts.components,
			backHref: opts.backHref,
			backLabel: opts.backLabel,
			writable: dev,
			media: listMediaFiles(),
			colorTokens: listColorTokens()
		};
	};
}

export function makeEditorActions(root: SvxRoot) {
	return {
		save: async ({ params, request }: { params: { path: string }; request: Request }) => {
			const page = findSvxPage(params.path, root);
			if (!page) return fail(404, { message: 'Unbekannte Seite.' });
			// Prod (adapter-vercel, serverless): fs-Writes sind nicht persistent →
			// Phase 2b öffnet stattdessen einen GitHub-PR. Im Dev schreiben wir lokal.
			if (!dev)
				return fail(400, {
					message: 'Schreiben nur im Dev-Modus. Prod öffnet später einen GitHub-PR (Phase 2b).'
				});

			const data = await request.formData();
			let edits: SvxEdits;
			try {
				edits = JSON.parse(String(data.get('payload') ?? '{}')) as SvxEdits;
			} catch {
				return fail(400, { message: 'Ungültige Daten.' });
			}

			const raw = readSvx(page.file);
			const next = rebuild(raw, edits);

			// Doppelter Sicherheitsgurt: die Svelte-Inseln dürfen sich durch einen Save
			// NIE verändert haben. Wenn doch → abbrechen, nicht schreiben.
			const before = parseSvx(raw);
			if (before.safe) {
				const verdict = checkIslandGuard(before, parseSvx(next));
				if (!verdict.ok) {
					return fail(500, {
						message:
							verdict.reason === 'foreign-add'
								? 'Abbruch: Es dürfen nur Bilder ergänzt werden, keine anderen Svelte-Inseln. Nichts gespeichert.'
								: 'Abbruch: Eine geschützte Svelte-Insel hätte sich verändert. Nichts gespeichert.'
					});
				}
			}

			writeFileSync(page.file, next);
			return { saved: true };
		}
	};
}
