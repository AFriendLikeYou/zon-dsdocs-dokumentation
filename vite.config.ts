import { configDefaults, defineConfig } from 'vitest/config';
import { sveltekit } from '@sveltejs/kit/vite';

export default defineConfig(() => ({
	plugins: [sveltekit()],

	resolve: {
		conditions: ['browser']
	},

	test: {
		globals: true,
		restoreMocks: true,
		// ?raw-Importe von .css (styles-zds.css in mcp.ts, pattern.css im Katalog)
		// liefern sonst leere Strings — mit css:true kommt der echte Rohtext.
		css: true,
		// e2e/ gehört Playwright — vitest würde die .spec.ts sonst mit ausführen.
		exclude: [...configDefaults.exclude, 'e2e/**'],
		environment: 'jsdom',
		setupFiles: ['vitest.setup.js'],
		passWithNoTests: true,
		reporters: ['default', 'junit'],
		outputFile: './reports/testing-library.xml'
	}
}));
