import { configDefaults, defineConfig } from 'vitest/config';
import { sveltekit } from '@sveltejs/kit/vite';

export default defineConfig(() => ({
	plugins: [sveltekit()],

	// Die `.env` (USERS für die Basic-Auth) liegt im REPO-ROOT, nicht in der App.
	// Vite sucht sie sonst neben dieser Datei — der Build bräche mit
	// „USERS is not exported by virtual:env/static/private".
	envDir: '../..',

	resolve: {
		conditions: ['browser']
	},

	// vite-plugin-svelte erkennt „Framework-Pakete" (solche mit `svelte`-Export), indem
	// es die package.json der PROJEKTWURZEL abkrabbelt — und die ist seit dem Umzug
	// apps/docs/package.json. Die Abhängigkeiten des Monorepos stehen aber in der
	// Root-package.json. Ohne diesen Hinweis bliebe @testing-library/svelte extern,
	// seine `*.svelte.js`-Module kämen uncompiliert bei Node an und JEDER
	// Komponenten-Test stürbe an `rune_outside_svelte`.
	ssr: {
		noExternal: ['@testing-library/svelte']
	},

	test: {
		globals: true,
		restoreMocks: true,
		// ?raw-Importe von .css (styles-zds.css in mcp.ts, pattern.css im Katalog)
		// liefern sonst leere Strings — mit css:true kommt der echte Rohtext.
		css: true,
		// Die Suite ist REPO-WEIT, nicht app-weit: `tooling/` (Exporter, Drift-Checks)
		// und `packages/` (Token-Rollen) haben eigene Tests. Vor dem Umzug lief vitest
		// im Repo-Root und sammelte sie automatisch ein; jetzt ist die Projektwurzel
		// apps/docs, also müssen die beiden Nachbarn ausdrücklich mitgenannt werden —
		// sonst fielen 9 Testdateien / 148 Tests lautlos aus dem Gate.
		include: [
			'**/*.{test,spec}.?(c|m)[jt]s?(x)',
			'../../tooling/**/*.{test,spec}.?(c|m)[jt]s?(x)',
			'../../packages/**/*.{test,spec}.?(c|m)[jt]s?(x)'
		],
		// e2e/ gehört Playwright — vitest würde die .spec.ts sonst mit ausführen.
		exclude: [...configDefaults.exclude, 'e2e/**'],
		environment: 'jsdom',
		setupFiles: ['vitest.setup.js'],
		passWithNoTests: true,
		reporters: ['default', 'junit'],
		outputFile: './reports/testing-library.xml'
	}
}));
