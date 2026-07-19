<!-- LoginButton.svelte — Icon-Link zur Login-Seite; wird von der Navbar eingehängt (nur für ausgeloggte Nutzer). -->
<script lang="ts">
	import { LoginIcon } from '$lib/icons';
</script>

<a aria-label="Open login page" class="app-button app-button--transparent" href="/login">
	<LoginIcon width={20} height={20} />
</a>
