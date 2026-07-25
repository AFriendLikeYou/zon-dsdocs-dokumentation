// Brand-SVX-Editor — dünner Aufrufer der geteilten Editor-Factory
// (core/editor-server.ts). Brand bekommt die VOLLE Komponenten-Registry als
// Insert-Palette; das Product-Pendant (/admin/product/[...path]) nutzt dieselbe
// Factory mit kuratierter Teilmenge.
import { CMS_COMPONENTS } from '../core/cms-components';
import { makeEditorLoad, makeEditorActions } from '../core/editor-server';
import type { PageServerLoad, Actions } from './$types';

export const load: PageServerLoad = makeEditorLoad('brand', {
	components: CMS_COMPONENTS,
	backHref: '/admin/brand',
	backLabel: 'Alle Brand-Seiten'
});

export const actions: Actions = makeEditorActions('brand');
