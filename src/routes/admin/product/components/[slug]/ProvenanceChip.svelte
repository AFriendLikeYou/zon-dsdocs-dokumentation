<!--
  ProvenanceChip — kennzeichnet die HERKUNFT einer Zone im Spec-Editor:
  - variant „machine":  ⇣ aus Figma (gemutet) — vom Import gepflegt, hier read-only.
  - variant „editorial": ✎ Redaktion (grün/positiv) — von Redakteur:innen editierbar.

  Der title-Tooltip erklärt bei der Maschinen-Zone, wie eine Änderung möglich ist
  (in Figma ändern → Re-Import), damit niemand hier vergeblich sucht.
-->
<script lang="ts">
	let {
		variant,
		title
	}: {
		variant: 'machine' | 'editorial';
		title?: string;
	} = $props();

	const label = variant === 'machine' ? '⇣ aus Figma' : '✎ Redaktion';
	const defaultTitle =
		variant === 'machine'
			? 'Wird vom Import gepflegt — Änderung in Figma, dann Re-Import'
			: 'Redaktionell editierbar (content.json)';
</script>

<span class="prov-chip prov-chip--{variant}" title={title ?? defaultTitle}>{label}</span>

<style>
	.prov-chip {
		display: inline-flex;
		align-items: center;
		font-size: var(--ds-text-xs);
		font-weight: 600;
		letter-spacing: var(--ds-label-tracking);
		white-space: nowrap;
		border-radius: 999px;
		padding: 1px var(--z-ds-space-8);
		border: 1px solid transparent;
	}
	.prov-chip--machine {
		color: var(--ds-text-muted);
		background: var(--ds-surface-raised, var(--ds-surface));
		border-color: var(--ds-border-soft);
	}
	.prov-chip--editorial {
		color: var(--ds-positive, var(--ds-accent));
		border-color: color-mix(in srgb, var(--ds-positive, var(--ds-accent)) 45%, transparent);
		background: color-mix(in srgb, var(--ds-positive, var(--ds-accent)) 10%, transparent);
	}
</style>
