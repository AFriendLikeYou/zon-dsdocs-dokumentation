// Product-SVX-Editor — dieselbe Editor-Factory wie Brand, anderer Datei-Root.
// Editierbar ist die PROSA der handgeschriebenen Product-Seiten (Foundations,
// Patterns, Contribute …); die Figma-Specs bleiben außen vor: generierte
// Component-Seiten (model.json daneben) listet brand-fs.server gar nicht erst,
// und kuratierte Daten-Inseln (<script>-Blöcke, TypeSpecimen & Co.) sind im
// Editor geschützte Blöcke — änderbar „nur bei Bedarf" über den Code.
//
// Insert-Palette bewusst kuratiert: Product-Seiten sind redaktionell schlanker
// als Brand — vorerst nur Hinweis-Boxen (Alert) + das eingebaute Bild.
import { CMS_COMPONENTS } from '../../brand/core/cms-components';
import { makeEditorLoad, makeEditorActions } from '../../brand/core/editor-server';
import type { PageServerLoad, Actions } from './$types';

const PRODUCT_PALETTE = CMS_COMPONENTS.filter((c) => c.name === 'Alert');

export const load: PageServerLoad = makeEditorLoad('product', {
	components: PRODUCT_PALETTE,
	backHref: '/admin',
	backLabel: 'Alle Inhalte'
});

export const actions: Actions = makeEditorActions('product');
