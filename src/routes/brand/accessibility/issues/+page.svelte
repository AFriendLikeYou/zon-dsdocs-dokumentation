<script>
	import IssuesList from '$components/issues-list/IssuesList.svelte';
	import { A11Y_ITEMS } from '$data/a11y-issues';
</script>

<svelte:head>
	<title>Accessibility Issues & Solutions - Zeit Online Design System</title>
</svelte:head>

<h1>Accessibility Issues & Solutions</h1>
<IssuesList issues={A11Y_ITEMS} />
