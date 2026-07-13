<!--
  AdminBadge — kleine Pille für Meta-Auszeichnungen (Badges, „Thema"-Tag,
  „Code-Seite", Status). Vereinheitlicht die zuvor je Seite eigenen .badge/.tag/
  .code-note-Stile auf eine Form (999px-Radius, xs, weicher Rahmen).

  Props:
  - tone: ‚default' (weicher Rahmen) | ‚accent' (Akzent-Rahmen) | ‚muted' (nur Text,
          kursiv — z. B. „Code-Seite").
-->
<script lang="ts">
	import type { Snippet } from 'svelte';

	let {
		tone = 'default',
		children
	}: {
		tone?: 'default' | 'accent' | 'muted';
		children: Snippet;
	} = $props();
</script>

<span class="badge badge--{tone}">{@render children()}</span>

<style>
	.badge {
		display: inline-flex;
		align-items: center;
		font-size: var(--ds-text-xs);
		white-space: nowrap;
		border-radius: 999px;
	}
	.badge--default,
	.badge--accent {
		padding: 0 var(--z-ds-space-8);
		border: 1px solid var(--ds-border);
	}
	.badge--default {
		color: var(--ds-text-body);
		background: var(--ds-surface-raised);
	}
	.badge--accent {
		color: var(--ds-accent);
		border-color: var(--ds-accent);
	}
	.badge--muted {
		color: var(--ds-text-faint, var(--ds-text-muted));
		font-style: italic;
	}
</style>
