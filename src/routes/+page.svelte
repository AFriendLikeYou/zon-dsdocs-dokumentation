<script lang="ts">
	// Landing der Doku-Site. Der Hero liegt als co-located Komponente daneben
	// (LandingHero.svelte, Single-Route-Consumer). Hier bleiben die zwei
	// „Welten"-Einstiege und „Was ist neu".
	// Die kleine Produkt-Vorschau in der Welten-Karte nutzt echte z-Klassen;
	// deren Pattern-CSS kommt via ?raw aus den Component-Ordnern.
	import { CHANGELOG } from '$data/changelog';
	import LandingHero from './LandingHero.svelte';
	import buttonCss from './product/components/button/pattern.css?raw';
	import toggleCss from './product/components/toggle/pattern.css?raw';
	import checkboxCss from './product/components/checkbox/pattern.css?raw';

	const worldCss = [buttonCss, toggleCss, checkboxCss].join('\n');

	// „Was ist neu" — neuester Datumsblock aus dem Changelog.
	const latest = CHANGELOG[0]?.dates[0];
</script>

<svelte:head>
	<title>DIE ZEIT — Design System &amp; Brandhub</title>
</svelte:head>

<!-- Pattern-CSS der Welten-Vorschau einmalig einbinden (gültiges HTML, {@html}). -->
<!-- eslint-disable-next-line svelte/no-at-html-tags -->
{@html `<style>${worldCss}</style>`}

<div class="landing">
	<LandingHero />

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
	/* .landing bleibt ungestylt: volle Breite — der Hero (LandingHero) bricht bis
	   an den Viewport-Rand aus. Zentrierte Inhaltsspalte nur für die Folgesektionen: */
	.container {
		max-width: 76rem;
		margin-inline: auto;
		padding: clamp(3rem, 8vw, 5rem) clamp(1rem, 4vw, 2.5rem) 4rem;
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
		color: var(--ds-text-muted);
	}

	@media (prefers-reduced-motion: reduce) {
		.world {
			transition: none;
		}
	}
</style>
