<script>
	import { IssuesList } from '$components/ui/issues-list';
	import { A11Y_ITEMS } from '$data/a11y-issues';
</script>

<svelte:head>
	<title>Barrierefreiheit — Probleme &amp; Lösungen - Die Zeit Design System</title>
</svelte:head>

<h1>Barrierefreiheit — Probleme & Lösungen</h1>
<IssuesList issues={A11Y_ITEMS} />
