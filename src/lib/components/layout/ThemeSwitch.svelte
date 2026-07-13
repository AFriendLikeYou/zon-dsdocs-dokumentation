<script lang="ts">
	import { afterNavigate } from '$app/navigation';
	import { setCookie } from '$lib/cookie';
	import { onMount } from 'svelte';
	import { fade } from 'svelte/transition';
	import { ThemeSystemIcon, ThemeLightIcon, ThemeDarkIcon } from '$lib/icons';
	import type { Theme } from '$types/global';
	let { currentTheme, type = 'radio' }: { currentTheme: Theme; type?: 'select' | 'radio' } =
		$props();
	let isMounted = $state(false);

	afterNavigate(() => {
		isMounted = true;
	});

	onMount(() => {
		addThemeToHTMLTag(currentTheme);
	});

	function addThemeToHTMLTag(theme: Theme) {
		document.documentElement.classList.remove(
			'color-scheme-light',
			'color-scheme-dark',
			'color-scheme-system'
		);
		document.documentElement.classList.add(`color-scheme-${theme}`);
	}

	// Einziger Schreibpfad für beide Varianten (select + radio): Cookie UND
	// html-Klasse setzen. Vorher aktualisierte der Select-Pfad nur den Cookie,
	// sodass das Theme erst nach Reload/Navigation griff.
	function updateTheme(theme: Theme) {
		currentTheme = theme;
		setCookie('theme', currentTheme);
		addThemeToHTMLTag(theme);
	}
</script>

<svelte:head>
	<meta name="color-scheme" content={currentTheme == 'system' ? 'light dark' : currentTheme} />
</svelte:head>

{#if type == 'select'}
	{#if isMounted}
		<select
			in:fade
			bind:value={currentTheme}
			onchange={() => {
				updateTheme(currentTheme);
			}}
		>
			<option value="system">System</option>
			<option value="light">Light</option>
			<option value="dark">Dark</option>
		</select>
	{/if}
{/if}

{#if type == 'radio'}
	<fieldset class="theme-switcher">
		<legend class="sr-only">Select a display theme:</legend>
		<span class="theme-option">
			<input
				aria-label="system"
				id="theme-switch-system"
				name="theme-option"
				type="radio"
				value="system"
				bind:group={currentTheme}
				onchange={() => updateTheme('system')}
			/>
			<label for="theme-switch-system">
				<span class="sr-only">system</span>
				<ThemeSystemIcon />
			</label>
		</span>
		<span class="theme-option">
			<input
				aria-label="light"
				id="theme-switch-light"
				name="theme-option"
				type="radio"
				value="light"
				bind:group={currentTheme}
				onchange={() => updateTheme('light')}
			/>
			<label for="theme-switch-light">
				<span class="sr-only">light</span>
				<ThemeLightIcon />
			</label>
		</span>
		<span class="theme-option">
			<input
				aria-label="dark"
				id="theme-switch-dark"
				name="theme-option"
				type="radio"
				value="dark"
				bind:group={currentTheme}
				onchange={() => updateTheme('dark')}
			/>
			<label for="theme-switch-dark">
				<span class="sr-only">dark</span>
				<ThemeDarkIcon />
			</label>
		</span>
	</fieldset>
{/if}

<style>
	.theme-switcher {
		display: flex;
		align-items: center;
		background-color: rgb(from var(--ds-surface-sunken) r g b / 0.6);
		border-radius: calc(var(--ds-radius) + 2px);
		border: 2px solid transparent;
	}

	.theme-option {
		display: flex;
		align-items: center;
		justify-content: center;
		cursor: pointer;
		position: relative;
	}

	/* SVG lebt in der Icon-Kind-Komponente → :global, sonst greift das Scoping nicht. */
	.theme-option :global(svg) {
		width: 1rem;
		height: 1rem;
		opacity: 0.6;
	}

	.theme-option input[type='radio']:checked + label {
		background: var(--ds-surface);
		border-radius: var(--ds-radius);
		color: var(--ds-text);
	}

	.theme-option input[type='radio']:checked + label :global(svg) {
		opacity: 1;
	}

	input[type='radio'] {
		opacity: 0;
		position: absolute;
		width: 100%;
		height: 100%;
		cursor: pointer;
	}

	label {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 2.5rem;
		height: 2rem;
	}
</style>
