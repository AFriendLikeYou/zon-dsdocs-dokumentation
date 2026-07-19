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
		/** Button-Inhalt (Label/Icon). */
		children: Snippet;
	} & HTMLButtonAttributes;

	let { variant = 'default', children, ...restProps }: Props = $props();
</script>

<button
	class="app-button"
	class:app-button--transparent={variant === 'transparent'}
	class:app-button--outline={variant === 'outline'}
	{...restProps}
>
	{@render children()}
</button>
