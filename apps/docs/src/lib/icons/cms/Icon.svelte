<!--
  Icon — Dispatcher über die CMS-Icon-Registry (README.md): `<Icon name="trash" />`.
  Unbekannte Namen fallen auf das generische Block-Icon zurück.
-->
<script lang="ts">
	import { CMS_ICONS } from './index';

	let { name = 'block' }: { name?: string } = $props();
	const C = $derived(CMS_ICONS[name] ?? CMS_ICONS.block);
</script>

<C />
