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

/** @type {import('@sveltejs/kit').Config} */
const config = {
	// Consult https://svelte.dev/docs/kit/integrations
	// for more information about preprocessors
	preprocess: [vitePreprocess(), mdsvex()],
	kit: {
		// adapter-auto only supports some environments, see https://svelte.dev/docs/kit/adapter-auto for a list.
		// If your environment is not supported, or you settled on a specific environment, switch out the adapter.
		// See https://svelte.dev/docs/kit/adapters for more information about adapters.
		adapter: adapter(),
		// `$env/static/private` liest von hier (siehe envDir oben).
		env: { dir: envDir },
		// Aliase = Kurzformen auf src/lib/* (SvelteKit-Standardort; $lib ist eingebaut).
		alias: {
			$components: './src/lib/components',
			$stores: './src/lib/stores',
			$data: './src/lib/data',
			$config: './src/lib/config',
			$types: './src/lib/types'
		}
	},
	extensions: ['.svelte', '.svx']
};

export default config;
