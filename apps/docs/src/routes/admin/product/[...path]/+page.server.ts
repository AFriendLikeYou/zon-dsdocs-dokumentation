// Product-SVX-Editor — dieselbe Editor-Factory wie Brand, anderer Datei-Root.
// Editierbar ist die PROSA der handgeschriebenen Product-Seiten (Foundations,
// Patterns, Contribute …); die Figma-Specs bleiben außen vor: generierte
// Component-Seiten (model.json daneben) listet brand-fs.server gar nicht erst,
// und kuratierte Daten-Inseln (<script>-Blöcke, TypeSpecimen & Co.) sind im
// Editor geschützte Blöcke — änderbar „nur bei Bedarf" über den Code.
//
// Insert-Palette kuratiert: Product-Seiten sind redaktionell schlanker als Brand.
// Zugelassen sind die Bausteine, die auf Doku-Seiten wirklich vorkommen — Hinweis-
// Boxen, Raster, Karten-Verweise, Bild-Lightbox und Do/Don't (samt Gruppe). Bewusst
// NICHT dabei: die brand-spezifischen Bausteine (BrandHero, Farbfelder, Downloads).
// Alle `importStatement`s zeigen auf `$components/ui/*` und funktionieren damit auf
// Product-Seiten genauso wie auf Brand-Seiten (siehe Test in editor-server.test.ts).
import { CMS_COMPONENTS } from '../../brand/core/cms-components';
import { makeEditorLoad, makeEditorActions } from '../../brand/core/editor-server';
import type { PageServerLoad, Actions } from './$types';

const PRODUCT_PALETTE_NAMES = [
	'Banner',
	'Grid',
	'Breakout',
	'Card',
	'Figure',
	'Lightbox',
	'ImageGallery',
	'DoDont',
	'DoDontGroup'
];
// Container-`childTypes` auf die Palette einschränken (Kopie, Registry unangetastet):
// `Grid` erlaubt global auch `Color`/`TextColor`/`DownloadSpecimen` — die gibt es auf
// Product-Seiten nicht, sie wären im Kind-Dropdown wählbar, aber nicht anlegbar.
const PRODUCT_PALETTE = CMS_COMPONENTS.filter((c) => PRODUCT_PALETTE_NAMES.includes(c.name)).map(
	(c) =>
		c.childTypes
			? { ...c, childTypes: c.childTypes.filter((n) => PRODUCT_PALETTE_NAMES.includes(n)) }
			: c
);

export const load: PageServerLoad = makeEditorLoad('product', {
	components: PRODUCT_PALETTE,
	backHref: '/admin',
	backLabel: 'Alle Inhalte'
});

export const actions: Actions = makeEditorActions('product');
