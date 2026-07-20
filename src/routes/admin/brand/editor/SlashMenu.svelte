<!--
  SlashMenu — das am Cursor verankerte Insert-Menü (Notion-artig, „/"-Trigger).
  Nur noch der Body: Positionierung, Mobile-Sheet, Scroll-Lock und Keyframes
  liefert die PopoverSheet-Hülle (Koordinaten-Modus, kein Outside-Close — der Host
  steuert Öffnen/Schließen über den Textarea-Fokus). `preservePointerFocus` fängt
  Pointerdown ab, damit das Textarea beim Klick den Fokus behält.

  Präsentational: Items sind bereits gefiltert, der aktive Index kommt vom Host
  (Tastatur läuft dort, weil der Fokus im Textarea bleibt).
-->
<script lang="ts">
	import BlockMenuList from './BlockMenuList.svelte';
	import { PopoverSheet } from '../../ui';

	type Item = { name: string; label: string; icon: string };
	let {
		items,
		activeIndex = 0,
		x = 0,
		y = 0,
		onpick,
		onhover,
		onclose
	}: {
		items: Item[];
		activeIndex?: number;
		x?: number;
		y?: number;
		onpick: (name: string) => void;
		onhover?: (i: number) => void;
		onclose: () => void;
	} = $props();
</script>

<PopoverSheet
	open
	label="Element einfügen"
	{x}
	{y}
	{onclose}
	closeOnOutside={false}
	preservePointerFocus
	desktopRole="presentation"
>
	<BlockMenuList {items} {activeIndex} {onpick} {onhover} />
</PopoverSheet>
