<!--
  ProvenanceChip — kennzeichnet die HERKUNFT einer Zone im Spec-Editor:
  - variant „machine":   ⇣ aus Figma (Info-Blau) — vom Import gepflegt, hier read-only.
  - variant „editorial": ✎ Redaktion (Positiv-Grün) — von Redakteur:innen editierbar.

  Dünner Wrapper um die geteilte Pill (admin/ui): setzt Icon, Label und den
  erklärenden Default-Tooltip je Herkunft. Der Tooltip der Maschinen-Zone sagt, wie
  eine Änderung möglich ist (in Figma ändern → Re-Import), damit niemand hier
  vergeblich sucht. Optik/Tints liegen zentral in Pill + den --ds-tint-*-Rollen.
-->
<script lang="ts">
	import { ImportIcon, PencilIcon } from '$lib/icons';
	import { Pill } from '../../../ui';

	let {
		variant,
		title
	}: {
		variant: 'machine' | 'editorial';
		title?: string;
	} = $props();

	const label = variant === 'machine' ? 'aus Figma' : 'Redaktion';
	const defaultTitle =
		variant === 'machine'
			? 'Wird vom Import gepflegt — Änderung in Figma, dann Re-Import'
			: 'Redaktionell editierbar (content.json)';
</script>

{#snippet icon()}
	{#if variant === 'machine'}<ImportIcon />{:else}<PencilIcon />{/if}
{/snippet}

<Pill tone={variant} iconSnippet={icon} title={title ?? defaultTitle}>{label}</Pill>
