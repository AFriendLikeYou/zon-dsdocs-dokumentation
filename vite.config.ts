import { defineConfig } from 'vitest/config';
import { sveltekit } from '@sveltejs/kit/vite';

export default defineConfig(() => ({
	plugins: [sveltekit()],

	resolve: {
		conditions: ['browser']
	},

	test: {
		globals: true,
		restoreMocks: true,
		environment: 'jsdom',
		setupFiles: ['vitest.setup.js'],
		passWithNoTests: true,
		reporters: ['default', 'junit'],
		outputFile: './reports/testing-library.xml'
	}
}));
