<script lang="ts">
	// Illustrative Anwendungsbeispiele — reine HTML/CSS-Kompositionen aus vorhandenen
	// Assets (static/media/brand/**). KEINE echten Kampagnen-Daten, keine Download-Vorlagen.
	// Nur vorhandene Dateien referenzieren (check-assets bleibt grün).
	const logo = '/media/brand/logo/wordmark-1.webp';

	type Callout = { titel: string; text: string; href?: string; hrefLabel?: string };

	const socialCallouts: Callout[] = [
		{
			titel: 'Schutzzone',
			text: 'Das Logo hat rundum Freiraum von mindestens seiner halben Höhe — nichts rückt heran.',
			href: '/brand/logo',
			hrefLabel: 'Logo-Regeln'
		},
		{
			titel: 'Display-Schrift',
			text: 'Die Headline steht in Tiemann Schmal — die Display-Serife für markante Aussagen.',
			href: '/brand/typography',
			hrefLabel: 'Typografie'
		},
		{
			titel: 'Markenfarbe',
			text: 'ZEIT-Rot (#b91109) setzt einen Akzent, nie als flächige Hintergrundfarbe für Fließtext.',
			href: '/brand/color',
			hrefLabel: 'Farbe'
		},
		{
			titel: 'Kontrast',
			text: 'Text auf Fläche erfüllt mindestens WCAG AA — hier dunkle Schrift auf Hell.',
			href: '/brand/accessibility',
			hrefLabel: 'Accessibility'
		}
	];

	const posterCallouts: Callout[] = [
		{
			titel: 'Mindestgröße',
			text: 'Das Logo wird nie kleiner als lesbar gesetzt — im Hochformat sitzt es klar oben.',
			href: '/brand/logo',
			hrefLabel: 'Logo-Regeln'
		},
		{
			titel: 'Schrift-Mix',
			text: 'Große Serifen-Headline (Tiemann Schmal) über ruhiger Grotesk-Subline (TabletGothic).',
			href: '/brand/typography',
			hrefLabel: 'Typografie'
		},
		{
			titel: 'Farbfläche',
			text: 'Eine ruhige Markenfläche trägt die Botschaft — ZEIT-Rot als Signal, nicht als Lärm.',
			href: '/brand/color',
			hrefLabel: 'Farbe'
		}
	];
</script>

<svelte:head>
	<title>Anwendungsbeispiele - Die Zeit Design System</title>
</svelte:head>

<h1>Anwendungsbeispiele</h1>

<p>
	So wirkt die Marke, wenn ihre Elemente zusammenkommen — Logo, Schrift und Farbe im Zusammenspiel.
	Die folgenden Layouts sind <strong>illustrative Beispiele</strong>, keine Vorlagen zum Download.
	Echte Templates folgen, sobald das Material dafür bereitsteht.
</p>

<section class="ex">
	<h2>Social-Kachel (1:1)</h2>
	<div class="ex-row">
		<figure class="ex-figure">
			<div class="ex-canvas ex-canvas--square">
				<img class="ex-logo" src={logo} alt="ZEIT-Wortmarke" />
				<p class="ex-headline">Verstehen,<br />was die Welt<br />bewegt.</p>
				<span class="ex-tag">Wirtschaft</span>
			</div>
			<figcaption>Beispielhafte Social-Kachel — Format 1:1.</figcaption>
		</figure>
		<ul class="ex-callouts">
			{#each socialCallouts as c}
				<li>
					<span class="ex-callout-title">{c.titel}</span>
					<span class="ex-callout-text">{c.text}</span>
					{#if c.href}<a class="ex-callout-link" href={c.href}>{c.hrefLabel} →</a>{/if}
				</li>
			{/each}
		</ul>
	</div>
</section>

<section class="ex">
	<h2>Anzeigen-/Plakat-Motiv (Hochformat)</h2>
	<div class="ex-row">
		<figure class="ex-figure">
			<div class="ex-canvas ex-canvas--portrait">
				<img class="ex-logo ex-logo--top" src={logo} alt="ZEIT-Wortmarke" />
				<div class="ex-poster-body">
					<p class="ex-poster-headline">Haltung<br />braucht<br />Herkunft.</p>
					<p class="ex-poster-sub">Journalismus, der einordnet.</p>
				</div>
				<div class="ex-poster-bar" aria-hidden="true"></div>
			</div>
			<figcaption>Beispielhaftes Plakat-Motiv — Hochformat.</figcaption>
		</figure>
		<ul class="ex-callouts">
			{#each posterCallouts as c}
				<li>
					<span class="ex-callout-title">{c.titel}</span>
					<span class="ex-callout-text">{c.text}</span>
					{#if c.href}<a class="ex-callout-link" href={c.href}>{c.hrefLabel} →</a>{/if}
				</li>
			{/each}
		</ul>
	</div>
</section>

<p class="ex-note">
	Hinweis: Diese Beispiele dienen der Veranschaulichung. Die gezeigten Texte sind Platzhalter, keine
	veröffentlichten Kampagnen.
</p>

<style>
	.ex {
		margin-block: var(--z-ds-space-32);
	}
	.ex-row {
		display: grid;
		grid-template-columns: minmax(0, 340px) 1fr;
		gap: var(--z-ds-space-32);
		align-items: start;
	}
	.ex-figure {
		margin: 0;
	}
	.ex-figure figcaption {
		margin-top: var(--z-ds-space-8);
		font-size: var(--ds-text-sm);
		color: var(--ds-text-muted);
	}

	/* Artboard-Fläche — hell, mit ruhigem Rahmen. */
	.ex-canvas {
		position: relative;
		display: flex;
		flex-direction: column;
		justify-content: space-between;
		padding: var(--z-ds-space-24);
		background: #ffffff;
		border: 1px solid var(--ds-border-soft);
		border-radius: var(--ds-radius);
		/* Gepinnt weiße Bühne — steht im Dark-Mode ohnehin maximal gegen die Seite;
		   der Schlagschatten trug dort 1,05 : 1. Light behält ihn. */
		box-shadow: var(--ds-elevation-shadow);
		overflow: hidden;
	}
	.ex-canvas--square {
		aspect-ratio: 1 / 1;
	}
	.ex-canvas--portrait {
		aspect-ratio: 3 / 4;
	}
	.ex-logo {
		width: 96px;
		height: auto;
	}
	.ex-logo--top {
		align-self: flex-start;
	}
	.ex-headline {
		margin: 0;
		font-family: 'ZeitTiemannSchmal', Georgia, 'Times New Roman', serif;
		font-size: clamp(1.5rem, 4vw, 2.25rem);
		line-height: 1.1;
		color: #1a1a1a;
	}
	.ex-tag {
		align-self: flex-start;
		font-family: 'TabletGothic', system-ui, sans-serif;
		font-size: var(--ds-text-sm);
		font-weight: 700;
		letter-spacing: 0.04em;
		color: #ffffff;
		background: #b91109;
		padding: 4px 10px;
		border-radius: 3px;
	}

	/* Poster (Hochformat) — Serifen-Headline über Grotesk-Subline, Farbbalken unten. */
	.ex-poster-body {
		margin-block: auto;
	}
	.ex-poster-headline {
		margin: 0 0 var(--z-ds-space-12);
		font-family: 'ZeitTiemannSchmal', Georgia, 'Times New Roman', serif;
		font-size: clamp(1.75rem, 5vw, 2.75rem);
		line-height: 1.05;
		color: #1a1a1a;
	}
	.ex-poster-sub {
		margin: 0;
		font-family: 'TabletGothic', system-ui, sans-serif;
		font-size: var(--ds-text-base);
		color: #444444;
	}
	.ex-poster-bar {
		height: 8px;
		background: #b91109;
		border-radius: 2px;
		margin-top: var(--z-ds-space-16);
	}

	/* Regel-Callouts neben dem Motiv. */
	.ex-callouts {
		list-style: none;
		margin: 0;
		padding: 0;
		display: flex;
		flex-direction: column;
		gap: var(--z-ds-space-16);
	}
	.ex-callouts li {
		display: flex;
		flex-direction: column;
		gap: 2px;
		padding-left: var(--z-ds-space-16);
		border-left: 2px solid var(--ds-accent-brand, #b91109);
	}
	.ex-callout-title {
		font-weight: 700;
		font-size: var(--ds-text-base);
		color: var(--ds-text);
	}
	.ex-callout-text {
		font-size: var(--ds-text-sm);
		color: var(--ds-text-body);
		line-height: 1.5;
	}
	.ex-callout-link {
		font-size: var(--ds-text-sm);
		color: var(--ds-accent-brand, #b91109);
		width: fit-content;
	}
	.ex-note {
		margin-top: var(--z-ds-space-32);
		padding: var(--z-ds-space-16);
		border-radius: var(--ds-radius);
		background: var(--ds-surface-raised);
		font-size: var(--ds-text-sm);
		color: var(--ds-text-muted);
	}

	@media (max-width: 720px) {
		.ex-row {
			grid-template-columns: 1fr;
			gap: var(--z-ds-space-16);
		}
		.ex-figure {
			max-width: 340px;
		}
	}
</style>
