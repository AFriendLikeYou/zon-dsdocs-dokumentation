<script lang="ts">
	import TwoCol from '$components/TwoCol.svelte';
</script>

<svelte:head>
	<title>Voice & Tone - Zeit Online Design System</title>
</svelte:head>

<h1>Voice & Tone</h1>

<p>
	Lorem ipsum dolor sit amet, consetetur sadipscing elitr, sed diam nonumy eirmod tempor invidunt ut
	labore et dolore magna aliquyam erat, sed diam voluptua. At vero eos et accusam et justo duo
	dolores et ea rebum. Stet clita kasd gubergren, no sea takimata sanctus est Lorem ipsum dolor sit
	amet. Lorem ipsum dolor sit amet, consetetur sadipscing elitr, sed diam nonumy eirmod tempor
	invidunt ut labore et dolore magna aliquyam erat, sed diam voluptua. At vero eos et accusam et
	justo duo dolores et ea rebum. Stet clita kasd gubergren, no sea takimata sanctus est Lorem ipsum
	dolor sit amet. Lorem ipsum dolor sit amet, consetetur sadipscing elitr, sed diam nonumy eirmod
	tempor invidunt ut labore et dolore magna aliquyam erat, sed diam voluptua. At vero eos et accusam
	et justo duo dolores et ea rebum. Stet clita kasd gubergren, no sea takimata sanctus est Lorem
	ipsum dolor sit amet.
</p>

<h2>Grundlagen</h2>

<p></p>
Duis autem vel eum iriure dolor in hendrerit in vulputate velit esse molestie consequat, vel illum dolore
eu feugiat nulla facilisis at vero eros et accumsan et iusto odio dignissim qui blandit praesent luptatum
zzril delenit augue duis dolore te feugait nulla facilisi. Lorem ipsum dolor sit amet, consectetuer adipiscing
elit, sed diam nonummy nibh euismod tincidunt ut laoreet dolore magna aliquam erat volutpat.

<p></p>
Ut wisi enim ad minim veniam, quis nostrud exerci tation ullamcorper suscipit lobortis nisl ut aliquip
ex ea commodo consequat. Duis autem vel eum iriure dolor in hendrerit in vulputate velit esse molestie
consequat, vel illum dolore eu feugiat nulla facilisis at vero eros et accumsan et iusto odio dignissim
qui blandit praesent luptatum zzril delenit augue duis dolore te feugait nulla facilisi.

{#snippet left1()}
	<h2 class="headline">Small web</h2>
	<p class="desc">On small web screens, the filter bar is full-width.</p>
{/snippet}

{#snippet right1()}
	<img src="../../assets/images/a11y-pic2.png" alt="" />
{/snippet}

{#snippet left2()}
	<h2 class="headline">Small native</h2>
	<p class="desc">
		When bulk editing is initiated on native platforms, the interface transitions into a focused
		mode with a header takeover and the tray navigation hidden for a cleaner, more streamlined
		editing experience.
	</p>
{/snippet}

{#snippet right2()}
	<img src="../../assets/images/a11y-pic2.png" alt="" />
{/snippet}

<TwoCol left={left1} right={right1} />

<TwoCol reverse left={left2} right={right2} />

<style>
	.headline {
		margin-block: 0;
	}

	.desc {
		opacity: 0.8;
	}
</style>
