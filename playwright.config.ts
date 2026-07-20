import { defineConfig } from '@playwright/test';

/**
 * E2E-Smoke der CMS-Kernflüsse (e2e/). Lokal wird der laufende Dev-Server
 * wiederverwendet; in CI startet webServer ihn selbst. Basic-Auth: lokal greift
 * der Dev-Bypass, in CI gelten die committeten Hooks → httpCredentials passend
 * zu den Dummy-USERS aus .github/workflows/ci.yml.
 */
export default defineConfig({
	testDir: 'e2e',
	timeout: 30_000,
	retries: process.env.CI ? 1 : 0,
	reporter: process.env.CI ? 'github' : 'list',
	use: {
		// Lokal das installierte Google Chrome (Playwright-Download-CDN ist in
		// manchen Netzen blockiert); in CI der via `playwright install` geladene
		// Chromium.
		...(process.env.CI ? {} : { channel: 'chrome' as const }),
		baseURL: 'http://localhost:5173',
		httpCredentials: {
			username: process.env.E2E_USER ?? 'ci',
			password: process.env.E2E_PASS ?? 'ci-only'
		}
	},
	webServer: {
		command: 'npm run dev',
		port: 5173,
		reuseExistingServer: !process.env.CI,
		timeout: 60_000
	}
});
