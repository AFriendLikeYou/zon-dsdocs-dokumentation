<!--
  Product-SVX-Editor — rendert exakt die Brand-Editor-Seite (gleiche Factory,
  gleiches Datenformat); nur der Server dahinter zeigt auf src/routes/product.
  Kein Duplikat: Änderungen am Editor gelten automatisch für beide Bereiche.
-->
<script lang="ts">
	import Editor from '../../brand/[...path]/+page.svelte';

	let { data, form }: import('./$types').PageProps = $props();
</script>

<Editor {data} {form} />
