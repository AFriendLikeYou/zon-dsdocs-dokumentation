import { mdsvex } from 'mdsvex';
import adapter from '@sveltejs/adapter-vercel';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';
import { fileURLToPath } from 'node:url';

// Die `.env` mit USERS (Basic-Auth) liegt im REPO-ROOT und bleibt dort — ein
// Monorepo hat EINE lokale Env-Datei. SvelteKit sucht sie sonst im
// Arbeitsverzeichnis (= apps/docs, seit dem Umzug) und der Build bräche mit
// „USERS is not exported by virtual:env/static/private". Bewusst absolut aus
// import.meta.url abgeleitet statt relativ zum cwd: so stimmt der Pfad auch,
// wenn jemand die Config von woanders aus fährt.
const envDir = fileURLToPath(new URL('../..', import.meta.url));

/**
 * Compiler-Warnungen filtern — genau EINE, und mit Grund.
 *
 * `custom_element_props_identifier` meldet jedes `$props()` mit Rest-Element
 * („Svelte kann nicht ableiten, welche Properties ein Custom Element exponiert").
 * Das ist eine Aussage über Svelte-Custom-Elements — und diese App baut keine:
 * kein `<svelte:options customElement>`, keine `compilerOptions.customElement`.
 * Das einzige Custom Element des Repos (`z-accordion`) ist handgeschriebenes
 * TypeScript im Paket @zeit/components, kein kompiliertes Svelte.
 *
 * Auftauchen kann die Warnung trotzdem: eslint-plugin-svelte kompiliert für die
 * Regel `svelte/valid-compile` HART mit `customElement: true`
 * (lib/shared/svelte-compile-warns/index.js). Sie war damit in 27 Dateien
 * unerfüllbar — der einzige „Fix" wäre gewesen, überall den `{...rest}`-
 * Passthrough aufzugeben, also echte API gegen eine Falschmeldung zu tauschen.
 * Stattdessen fällt sie hier an der Quelle heraus; eslint-plugin-svelte wendet
 * dieses `onwarn` auf seine eigenen Warnungen an, also gilt die Filterung für
 * Build UND Lint gleichermaßen. Damit steht `npm run lint` auf
 * `--max-warnings 0` statt auf einer Ratsche, hinter der sich Neues verstecken
 * könnte.
 *
 * Die Voraussetzung ist nicht bloß behauptet, sondern geprüft:
 * `svelte.config.test.ts` schlägt fehl, sobald hier doch ein Custom Element
 * entsteht — dann ist diese Filterung neu zu bewerten.
 *
 * @param {{ code?: string }} warning
 * @param {(warning: unknown) => void} handler
 */
function onwarn(warning, handler) {
	if (warning.code === 'custom_element_props_identifier') return;
	handler(warning);
}

/** @type {import('@sveltejs/kit').Config} */
const config = {
	// Consult https://svelte.dev/docs/kit/integrations
	// for more information about preprocessors
	preprocess: [vitePreprocess(), mdsvex()],
	onwarn,
	kit: {
		// adapter-auto only supports some environments, see https://svelte.dev/docs/kit/adapter-auto for a list.
		// If your environment is not supported, or you settled on a specific environment, switch out the adapter.
		// See https://svelte.dev/docs/kit/adapters for more information about adapters.
		adapter: adapter(),
		// `$env/static/private` liest von hier (siehe envDir oben).
		env: { dir: envDir },
		// Aliase = Kurzformen auf src/lib/* (SvelteKit-Standardort; $lib ist eingebaut).
		// Ausnahme `$content`: die Redaktion liegt seit PR 5 NEBEN src/ (kein Code,
		// kein Release-Artefakt). Die generierten Component-Seiten importieren ihre
		// Texte darüber — relativ wären es fünf Ebenen aufwärts, und das bräche bei
		// jeder Routen-Umhängung still.
		alias: {
			$components: './src/lib/components',
			$stores: './src/lib/stores',
			$data: './src/lib/data',
			$config: './src/lib/config',
			$types: './src/lib/types',
			$content: './content'
		}
	},
	extensions: ['.svelte', '.svx']
};

export default config;
