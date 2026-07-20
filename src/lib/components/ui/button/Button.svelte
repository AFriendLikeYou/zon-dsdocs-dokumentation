<!--
  Button.svelte — App-Chrome-Button der Doku-UI (nicht der dokumentierte ZEIT-DS-Button).
  Reicht alle nativen Button-Attribute durch. Wird u. a. von FooterNavigation und
  LoginForm verwendet; für reine Icon-Aktionen nimm IconActionButton.
-->
<script lang="ts">
	import type { Snippet } from 'svelte';
	import type { HTMLButtonAttributes } from 'svelte/elements';

	type Props = {
		/** Erscheinungsbild: gefüllter Default, Outline oder transparent. */
		variant?: 'outline' | 'transparent' | 'default';
		/**
		 * Größe aus den realen Padding-Clustern: sm = 6px/12px + font-sm (Default),
		 * md = 8px/24px + font-base, lg = 10px/32px. Icon-only bleibt IconActionButton.
		 */
		size?: 'sm' | 'md' | 'lg';
		/** Button-Inhalt (Label/Icon). */
		children: Snippet;
	} & HTMLButtonAttributes;

	let { variant = 'default', size = 'sm', children, ...restProps }: Props = $props();
</script>

<button
	class="app-button"
	class:app-button--transparent={variant === 'transparent'}
	class:app-button--outline={variant === 'outline'}
	class:app-button--md={size === 'md'}
	class:app-button--lg={size === 'lg'}
	{...restProps}
>
	{@render children()}
</button>
