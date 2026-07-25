<!--
  TextColor.svelte — kleines Specimen für Textfarb-Tokens (Titel + Beschreibung
  in der Tokenfarbe). Verwendet auf /brand/color und als CMS-Block „Textfarbe"
  (cms-components.ts).
-->
<script lang="ts">
	type Props = {
		/** Token der Textfarbe (--z-ds-* oder --ds-*), als CSS-Custom-Property. */
		fontColorCustomProperty: string;
		/** Kurzbeschreibung unter dem Titel. */
		description: string;
		/** Anzeigename des Specimens. */
		title: string;
	};

	let { fontColorCustomProperty = '', description = '', title = '' }: Props = $props();
</script>

<div class="outer" style="color: var({fontColorCustomProperty})">
	<div style="display: flex; flex-direction: column; gap: 0.25rem; margin-bottom: 0.5rem;">
		<div style="margin-block: 0;">{title}</div>
		<small>{description}</small>
	</div>
	<code style="font-size: 0.5rem;">{fontColorCustomProperty}</code>
</div>

<style>
	.outer {
		height: auto;
		/* aspect-ratio: 1/1; */
		width: 150px;
		border: 1px solid var(--ds-border-strong);
		border-radius: 4px;
		display: flex;
		flex-direction: column;
		padding: var(--z-ds-space-m);
		color: var(--ds-text);
	}

	code {
		font-size: 14px;
	}
</style>
