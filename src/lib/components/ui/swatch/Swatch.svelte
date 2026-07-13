<!--
  Swatch.svelte — kleine Farbprobe für Token-Tabellen.
  Entweder eine Vollfläche (`color`) oder das Schachbrett-Muster (`checkerboard`)
  für „kein Fill"/transluzente Token. Zentralisiert das zuvor in TokenTable und
  ColorRoleTable duplizierte Swatch-Markup.
-->
<script lang="ts">
	let {
		color,
		checkerboard = false,
		title
	}: { color?: string; checkerboard?: boolean; title?: string } = $props();
</script>

<span
	class="swatch"
	class:swatch--checkerboard={checkerboard}
	style:background={checkerboard ? undefined : color || 'transparent'}
	{title}
></span>

<style>
	.swatch {
		display: inline-block;
		flex: none;
		width: 15px;
		height: 15px;
		border-radius: var(--ds-radius-sm);
		border: 1px solid var(--ds-border-strong);
	}
	/* Schachbrett = bewusst kein Fill (transparent/none). Hex-Werte hier zentral
	   dokumentiert: neutrales Grau (#bbb) auf Weiß (#fff), 8px-Raster. */
	.swatch--checkerboard {
		background: repeating-conic-gradient(#bbb 0 25%, #fff 0 50%) 50% / 8px 8px;
	}
</style>
