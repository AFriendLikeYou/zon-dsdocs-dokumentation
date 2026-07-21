import prettier from 'eslint-config-prettier';
import js from '@eslint/js';
import { includeIgnoreFile } from '@eslint/compat';
import svelte from 'eslint-plugin-svelte';
import globals from 'globals';
import { fileURLToPath } from 'node:url';
import ts from 'typescript-eslint';
const gitignorePath = fileURLToPath(new URL('./.gitignore', import.meta.url));

export default ts.config(
	includeIgnoreFile(gitignorePath),
	js.configs.recommended,
	...ts.configs.recommended,
	...svelte.configs['flat/recommended'],
	prettier,
	...svelte.configs['flat/prettier'],
	{
		languageOptions: {
			globals: {
				...globals.browser,
				...globals.node,
				NodeListOf: 'readonly'
			}
		},
		rules: {
			// `_`-Präfix = bewusster Discard (z. B. `const { render: _render, ...spec } = …`).
			'@typescript-eslint/no-unused-vars': [
				'error',
				{ argsIgnorePattern: '^_', varsIgnorePattern: '^_', caughtErrorsIgnorePattern: '^_' }
			]
		}
	},
	{
		// Figma-Plugin-Sandbox-Skripte: laufen NICHT in Node/Browser, sondern via
		// use_figma in Figmas Sandbox (`figma` ist dort ein Global). Kein Runtime-Code
		// dieser App — Globals bereitstellen statt 136 false-positive Fehler.
		files: ['.agents/skills/**/scripts/**/*.js', 'tooling/zeit-de-exporter/figma-measure.js'],
		languageOptions: {
			globals: { figma: 'readonly', __html__: 'readonly' }
		},
		rules: {
			'no-empty': 'off',
			'@typescript-eslint/no-unused-vars': 'off'
		}
	},
	{
		files: ['**/*.svelte'],

		languageOptions: {
			parserOptions: {
				parser: ts.parser
			}
		},
		rules: {
			'svelte/no-at-html-tags': 'off',
			'svelte/valid-compile': 'warn',
			// `no-undef` ist in TS-Projekten grundsätzlich aus (typescript-eslint empfiehlt
			// das, weil TS selbst die Autorität für Bindungen ist) — in `.svelte` ist es
			// zusätzlich schlicht falsch: die ESLint-Scope-Analyse kennt das
			// `<script generics="Row extends …">`-Attribut nicht und meldet jeden
			// Typparameter als „not defined" (Table.svelte `Row`, Select.svelte `T`).
			// Abgedeckt wird das von `npm run check` (svelte-check, 0/0).
			'no-undef': 'off'
		}
	}
);
