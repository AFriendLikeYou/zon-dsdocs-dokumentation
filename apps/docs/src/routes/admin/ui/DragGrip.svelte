<!--
  DragGrip — die Ziehgriff-Affordanz der umsortierbaren CMS-Listen (/admin und
  /admin/brand). Rein dekorativ (aria-hidden): das Ziehen hängt am umgebenden
  Listeneintrag (`draggable`), der Griff zeigt es nur an. Ruhig im Ruhezustand,
  deutlicher, sobald die Zeile unter dem Zeiger liegt.

  Props:
    · enabled — false blendet den Griff aus (Prod = nur lesen), hält aber den
                Platz, damit die Zeilen nicht springen.
-->
<script lang="ts">
	import { Icon } from '$lib/icons/cms';

	let { enabled = true }: { enabled?: boolean } = $props();
</script>

<span class="grip" class:grip--off={!enabled} aria-hidden="true"><Icon name="grip" /></span>

<style>
	.grip {
		display: inline-flex;
		color: var(--ds-text-muted);
		cursor: grab;
		opacity: 0.3;
		transition: opacity var(--ds-dur) var(--ds-ease-out);
	}
	:global(.admin-row:hover) .grip {
		opacity: 0.7;
	}
	.grip:active {
		cursor: grabbing;
	}
	.grip--off {
		visibility: hidden;
	}
</style>
