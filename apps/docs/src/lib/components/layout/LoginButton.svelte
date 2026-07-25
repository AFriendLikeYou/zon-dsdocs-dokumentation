<!-- LoginButton.svelte — Icon-Link zur Login-Seite; wird von der Navbar eingehängt (nur für ausgeloggte Nutzer). -->
<script lang="ts">
	import { Button } from '$components/ui/button';
	import { LoginIcon } from '$lib/icons';
</script>

<Button href="/login" variant="quiet" aria-label="Open login page">
	<LoginIcon width={20} height={20} />
</Button>
