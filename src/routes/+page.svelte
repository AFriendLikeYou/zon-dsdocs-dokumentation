<script lang="ts">
	// Landing der Doku-Site. Produkt-Showcase im Hero: echte z-Komponenten, live und
	// interaktiv — kein Screenshot, kein CSS-Duplikat. Das Pattern-CSS kommt via ?raw
	// direkt aus den Component-Ordnern (Single Source) und wird EINMAL eingebunden;
	// die z-*-Klassen sind eindeutig, daher unscoped unbedenklich.
	import { CATALOG } from '$data/catalog';
	import { CHANGELOG } from '$data/changelog';
	import buttonCss from './product/components/button/pattern.css?raw';
	import toggleCss from './product/components/toggle/pattern.css?raw';
	import checkboxCss from './product/components/checkbox/pattern.css?raw';
	import stepperCss from './product/components/stepper/pattern.css?raw';
	import cellCss from './product/components/cell/pattern.css?raw';

	const componentCount = CATALOG.length;
	const showcaseCss = [buttonCss, toggleCss, checkboxCss, stepperCss, cellCss].join('\n');

	// Interaktive Showcase-Zustände — die Komponenten reagieren auf Klick (wie „echt").
	let toggleOn = $state(true);
	let checked = $state(true);
	let stepVal = $state(2);

	// „Was ist neu" — neuester Datumsblock aus dem Changelog.
	const latest = CHANGELOG[0]?.dates[0];
</script>

<svelte:head>
	<title>DIE ZEIT — Design System &amp; Brandhub</title>
</svelte:head>

<!-- Pattern-CSS der Showcase-Komponenten einmalig einbinden (gültiges HTML, {@html}). -->
<!-- eslint-disable-next-line svelte/no-at-html-tags -->
{@html `<style>${showcaseCss}</style>`}

<div class="landing">
	<!-- ── Hero ─────────────────────────────────────────────────────────────── -->
	<section class="hero">
		<div class="hero__inner">
		<div class="hero__copy">
			<p class="eyebrow">DIE ZEIT · Design System</p>
			<h1>Marke und Produkt,<br />an einem Ort.</h1>
			<p class="lead">
				Richtlinien, Tokens und dokumentierte Komponenten — live, konsistent und
				agent-ready.
			</p>
			<div class="hero__cta">
				<a class="btn btn--primary" href="/product">Zum Design-System</a>
				<a class="btn" href="/brand">Zum Brandhub</a>
			</div>
			<ul class="stats">
				<li><strong>{componentCount}</strong> Komponenten</li>
				<li>Light &amp; Dark</li>
				<li>agent-ready</li>
			</ul>
		</div>

		<!-- Produkt-Showcase: echte, klickbare z-Komponenten. -->
		<div class="showcase">
			<div class="sc-card">
				<span class="sc-label">Button</span>
				<button class="z-button z-button--primary" type="button">Speichern</button>
			</div>

			<div class="sc-card">
				<span class="sc-label">Toggle</span>
				<button
					class="z-switch"
					class:z-switch--on={toggleOn}
					type="button"
					role="switch"
					aria-checked={toggleOn}
					aria-label="Beispiel-Schalter"
					onclick={() => (toggleOn = !toggleOn)}
				>
					<span class="z-switch__thumb"></span>
				</button>
			</div>

			<div class="sc-card">
				<span class="sc-label">Checkbox</span>
				<button
					class="z-checkbox"
					class:z-checkbox--checked={checked}
					type="button"
					role="checkbox"
					aria-checked={checked}
					aria-label="Beispiel-Checkbox"
					onclick={() => (checked = !checked)}
				>
					<span class="z-checkbox__check"></span>
				</button>
			</div>

			<div class="sc-card">
				<span class="sc-label">Stepper</span>
				<div class="z-stepper">
					<button
						class="z-stepper__minus"
						type="button"
						aria-label="Weniger"
						onclick={() => (stepVal = Math.max(0, stepVal - 1))}
					></button>
					<span class="z-stepper__val">{stepVal}</span>
					<button
						class="z-stepper__plus"
						type="button"
						aria-label="Mehr"
						onclick={() => (stepVal += 1)}
					></button>
				</div>
			</div>

			<div class="sc-card sc-card--wide">
				<span class="sc-label">Cell</span>
				<article class="z-cell z-cell--article">
					<div class="z-cell__body">
						<p class="z-cell__kicker">Politik</p>
						<h3 class="z-cell__title">Artikel Überschrift</h3>
						<div class="z-cell__meta"><span>Vor 2 Stunden</span><span>Von Vorname Nachname</span></div>
					</div>
				</article>
			</div>
		</div>
		</div>
	</section>

	<div class="container">
	<!-- ── Zwei Welten ──────────────────────────────────────────────────────── -->
	<section class="worlds">
		<a class="world world--brand" href="/brand">
			<img src="/media/brand/logo/wordmark-1.webp" alt="" class="world__img" loading="lazy" />
			<div class="world__text">
				<h2>Brandhub</h2>
				<p>
					Markenstrategie, Logo, Farbe, Typografie, Bildsprache und Barrierefreiheit — alles,
					was die Marke DIE ZEIT ausmacht.
				</p>
				<span class="world__go">Zur Marke →</span>
			</div>
		</a>
		<a class="world world--product" href="/product">
			<div class="world__demo" aria-hidden="true">
				<button class="z-button z-button--primary" type="button">Primary</button>
				<span class="z-switch z-switch--on"><span class="z-switch__thumb"></span></span>
				<span class="z-checkbox z-checkbox--checked"><span class="z-checkbox__check"></span></span>
			</div>
			<div class="world__text">
				<h2>Design-System</h2>
				<p>
					Design Principles, Foundations, Tokens und dokumentierte Komponenten mit
					interaktivem Playground — für konsistente, barrierearme Interfaces.
				</p>
				<span class="world__go">Zum System →</span>
			</div>
		</a>
	</section>

	<!-- ── Was ist neu ──────────────────────────────────────────────────────── -->
	{#if latest}
		<section class="whatsnew">
			<div class="whatsnew__head">
				<h2>Was ist neu</h2>
				<a href="/product/changelog">Alle Änderungen →</a>
			</div>
			<ul class="whatsnew__list">
				{#each latest.notes.slice(0, 4) as note}
					<!-- eslint-disable-next-line svelte/no-at-html-tags -->
					<li>{@html note}</li>
				{/each}
			</ul>
			<p class="whatsnew__date">Stand {latest.date}</p>
		</section>
	{/if}
	</div>
</div>

<style>
	.landing {
		/* Volle Breite — der Hero bricht bis an den Viewport-Rand aus. */
	}

	/* Zentrierte Inhaltsspalte für Hero-Innenleben und Folgesektionen. */
	.hero__inner,
	.container {
		max-width: 76rem;
		margin-inline: auto;
		padding-inline: clamp(1rem, 4vw, 2.5rem);
	}
	.container {
		padding-block: clamp(3rem, 8vw, 5rem) 4rem;
	}

	/* ── Hero (vollbreites Band) ── */
	.hero {
		background: var(--ds-surface-raised);
		border-bottom: 1px solid var(--ds-border-soft);
		padding-block: clamp(3rem, 8vw, 6rem);
	}
	.hero__inner {
		display: grid;
		grid-template-columns: 1fr;
		gap: clamp(2rem, 5vw, 4rem);
		align-items: center;
	}
	@media (min-width: 900px) {
		.hero__inner {
			grid-template-columns: 1.05fr 0.95fr;
		}
	}
	.eyebrow {
		font-size: var(--ds-label-size);
		text-transform: uppercase;
		letter-spacing: var(--ds-label-tracking);
		font-weight: 600;
		color: var(--ds-text-muted);
		margin: 0 0 1rem;
	}
	.hero__copy h1 {
		font-family: 'FranziskaWebPro', Georgia, serif;
		font-size: clamp(2.2rem, 5.2vw, 3.7rem);
		line-height: 1.06;
		letter-spacing: -0.01em;
		color: var(--ds-text);
		margin: 0 0 1.25rem;
		hyphens: none;
		text-wrap: balance;
	}
	.lead {
		font-size: var(--ds-text-lg);
		line-height: 1.5;
		color: var(--ds-text-body);
		max-width: 34ch;
		margin: 0 0 2rem;
	}
	.hero__cta {
		display: flex;
		flex-wrap: wrap;
		gap: 0.75rem;
		margin-bottom: 2rem;
	}
	.btn {
		display: inline-flex;
		align-items: center;
		padding: 0.7rem 1.4rem;
		border-radius: var(--ds-radius);
		border: 1px solid var(--ds-border-strong);
		font-size: var(--ds-text-base);
		font-weight: 500;
		color: var(--ds-text);
		text-decoration: none;
		transition:
			transform var(--ds-dur) var(--ds-ease-out),
			background-color var(--ds-dur) var(--ds-ease),
			border-color var(--ds-dur) var(--ds-ease);
	}
	.btn--primary {
		background: var(--ds-accent-brand);
		color: var(--ds-static-white);
		border-color: var(--ds-accent-brand);
	}
	@media (hover: hover) {
		.btn:hover {
			border-color: var(--ds-text);
		}
		.btn--primary:hover {
			filter: brightness(0.92);
		}
	}
	.btn:active {
		transform: scale(0.98);
	}
	.stats {
		list-style: none;
		display: flex;
		flex-wrap: wrap;
		gap: 0.5rem 1.5rem;
		margin: 0;
		padding: 0;
		font-size: var(--ds-text-sm);
		color: var(--ds-text-muted);
	}
	.stats strong {
		color: var(--ds-text);
	}

	/* ── Showcase ── */
	.showcase {
		display: grid;
		grid-template-columns: repeat(2, 1fr);
		gap: 0.75rem;
	}
	.sc-card {
		display: flex;
		flex-direction: column;
		align-items: flex-start;
		gap: 0.9rem;
		min-height: 92px;
		padding: 1rem 1.1rem;
		border: 1px solid var(--ds-border-soft);
		border-radius: var(--ds-radius);
		background: var(--ds-surface);
		box-shadow: var(--ds-shadow-sm);
	}
	.sc-card--wide {
		grid-column: 1 / -1;
	}
	.sc-label {
		font-size: var(--ds-text-xs);
		text-transform: uppercase;
		letter-spacing: var(--ds-label-tracking);
		color: var(--ds-text-faint);
	}

	/* ── Zwei Welten ── */
	.worlds {
		display: grid;
		grid-template-columns: 1fr;
		gap: 1rem;
	}
	@media (min-width: 720px) {
		.worlds {
			grid-template-columns: 1fr 1fr;
		}
	}
	.world {
		display: flex;
		flex-direction: column;
		border: 1px solid var(--ds-border-soft);
		border-radius: var(--ds-radius);
		overflow: hidden;
		background: var(--ds-surface);
		text-decoration: none;
		color: inherit;
		transition:
			transform var(--ds-dur) var(--ds-ease-out),
			border-color var(--ds-dur) var(--ds-ease);
	}
	@media (hover: hover) {
		.world:hover {
			transform: translateY(-3px);
			border-color: var(--ds-border-hover);
		}
	}
	.world__img {
		width: 100%;
		height: 180px;
		object-fit: cover;
		background: var(--ds-surface-raised);
	}
	.world__demo {
		display: flex;
		align-items: center;
		gap: 1.25rem;
		height: 180px;
		padding: 0 1.5rem;
		background: var(--ds-surface-raised);
	}
	.world__text {
		padding: 1.5rem;
	}
	.world__text h2 {
		font-size: var(--ds-heading-2);
		margin: 0 0 0.5rem;
		color: var(--ds-text);
	}
	.world__text p {
		font-size: var(--ds-text-base);
		line-height: 1.5;
		color: var(--ds-text-body);
		margin: 0 0 1rem;
	}
	.world__go {
		font-weight: 500;
		color: var(--ds-accent);
	}

	/* ── Was ist neu ── */
	.whatsnew {
		margin-top: clamp(3rem, 8vw, 6rem);
	}
	.whatsnew__head {
		display: flex;
		align-items: baseline;
		justify-content: space-between;
		gap: 1rem;
		margin-bottom: 1rem;
	}
	.whatsnew__head h2 {
		font-size: var(--ds-heading-2);
		margin: 0;
		color: var(--ds-text);
	}
	.whatsnew__head a {
		font-size: var(--ds-text-sm);
		color: var(--ds-accent);
		white-space: nowrap;
	}
	.whatsnew__list {
		list-style: none;
		margin: 0;
		padding: 0;
		display: grid;
		gap: 0.6rem;
	}
	.whatsnew__list :global(li) {
		position: relative;
		padding-left: 1.1rem;
		font-size: var(--ds-text-base);
		line-height: 1.5;
		color: var(--ds-text-body);
	}
	.whatsnew__list :global(li)::before {
		content: '';
		position: absolute;
		left: 0;
		top: 0.6em;
		width: 5px;
		height: 5px;
		border-radius: 999px;
		background: var(--ds-accent);
	}
	.whatsnew__list :global(a) {
		color: var(--ds-accent);
	}
	.whatsnew__date {
		margin-top: 1rem;
		font-size: var(--ds-text-sm);
		color: var(--ds-text-faint);
	}

	@media (prefers-reduced-motion: reduce) {
		.btn,
		.world {
			transition: none;
		}
	}
</style>
