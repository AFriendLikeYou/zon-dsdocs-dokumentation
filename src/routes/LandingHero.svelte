<script lang="ts">
	// Landing-Hero (Astryx-inspiriert): zentrierter Text + große, abgerundete
	// „Bühne" mit abstraktem Docsite-Mockup (Platzhalter-Blöcke + Token-Farbchips,
	// bewusst KEINE Live-Komponenten). Die Bühne richtet sich beim Scrollen aus 3D
	// auf (scroll-driven, Reduced-Motion-sicher).
	//
	// Single-Route-Consumer (nur „/") → per Konvention (components/README.md) hier
	// bei der Route co-located, kein ui/-Barrel. Selbst-enthalten: zieht die
	// Komponenten-Anzahl direkt aus dem Katalog.
	import { CATALOG } from '$data/catalog';

	const componentCount = CATALOG.length;
</script>

<section class="hero">
	<div class="hero__inner">
		<div class="hero__copy">
			<p class="eyebrow">DIE ZEIT · Design System</p>
			<h1>Marke und Produkt,<br />an einem Ort.</h1>
			<p class="lead">
				Richtlinien, Tokens und dokumentierte Komponenten — live, konsistent und agent-ready.
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

		<!-- Bühne: abgerundetes Docsite-Mockup, richtet sich beim Scrollen auf. -->
		<div class="stage-wrap">
			<div class="stage-glow" aria-hidden="true"></div>
			<div class="stage" aria-hidden="true">
				<div class="stage__bar">
					<span class="stage__dots"><i></i><i></i><i></i></span>
					<span class="stage__url">zeit.design / product / components</span>
				</div>
				<div class="stage__body">
					<aside class="stage__nav">
						<span class="stage__navhead"></span>
						<span class="stage__navitem"></span>
						<span class="stage__navitem stage__navitem--active"></span>
						<span class="stage__navitem"></span>
						<span class="stage__navhead"></span>
						<span class="stage__navitem"></span>
						<span class="stage__navitem"></span>
						<span class="stage__navitem"></span>
					</aside>
					<div class="stage__main">
						<span class="stage__title"></span>
						<span class="stage__sub"></span>
						<div class="stage__swatches">
							<i style="--c: var(--ds-accent-brand)"></i>
							<i style="--c: var(--ds-text)"></i>
							<i style="--c: var(--ds-text-muted)"></i>
							<i style="--c: var(--ds-border-strong)"></i>
							<i style="--c: var(--ds-accent)"></i>
							<i style="--c: var(--ds-surface-raised)"></i>
						</div>
						<div class="stage__lines"><span></span><span></span><span></span></div>
						<div class="stage__cards">
							<div></div>
							<div></div>
							<div></div>
						</div>
					</div>
				</div>
			</div>
		</div>
	</div>
</section>

<style>
	/* ── Hero (vollbreites Band, zentriert) ── */
	.hero {
		/* Band von der angehobenen Fläche zur Basis-Fläche (= Seitenhintergrund)
		   → nahtloser Übergang. Semantische Rollen, flippen mit Light/Dark. */
		background: linear-gradient(180deg, var(--ds-surface-raised) 0%, var(--ds-surface) 100%);
		padding-block: clamp(3rem, 8vw, 6rem) 0;
		overflow: hidden; /* Glow + gekippte Bühne dürfen nicht ausbrechen */
	}
	.hero__inner {
		max-width: 76rem;
		margin-inline: auto;
		padding-inline: clamp(1rem, 4vw, 2.5rem);
		text-align: center;
	}
	.hero__copy {
		max-width: 46rem;
		margin-inline: auto;
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
		/* Globale Heading-Regel setzt display:flex (linksgepackt) → hier auf Block
		   zurück, damit text-align:center die Zeilen tatsächlich zentriert. */
		display: block;
		text-align: center;
		/* Tiemann Schmal hat nur Normalschnitt → font-weight: normal (die globale
		   h1-Regel setzt 700, was hier Faux-Bold erzeugen würde). */
		font-family: 'ZeitTiemannSchmal', Georgia, 'Times New Roman', serif;
		font-weight: normal;
		font-size: clamp(2.4rem, 6vw, 4.2rem);
		line-height: 1.05;
		letter-spacing: -0.01em;
		color: var(--ds-text);
		margin: 0 0 1.25rem;
		padding-bottom: 0;
		hyphens: none;
		text-wrap: balance;
	}
	.lead {
		font-size: var(--ds-text-lg);
		line-height: 1.5;
		color: var(--ds-text-body);
		max-width: 42ch;
		margin: 0 auto 2rem;
	}
	.hero__cta {
		display: flex;
		flex-wrap: wrap;
		justify-content: center;
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
		justify-content: center;
		gap: 0.5rem 1.5rem;
		margin: 0;
		padding: 0;
		font-size: var(--ds-text-sm);
		color: var(--ds-text-muted);
	}
	.stats strong {
		color: var(--ds-text);
	}

	/* ── Bühne (Docsite-Mockup) ── */
	.stage-wrap {
		position: relative;
		margin-top: clamp(2.5rem, 6vw, 4.5rem);
		/* Bühne perspektivisch aufrichten (Scroll-Effekt) */
		perspective: 1600px;
	}
	.stage-glow {
		position: absolute;
		inset: -12% -6% auto -6%;
		height: 70%;
		z-index: 0;
		background: radial-gradient(
			55% 60% at 50% 35%,
			color-mix(in srgb, var(--ds-accent-brand) 22%, transparent),
			transparent 70%
		);
		filter: blur(8px);
		pointer-events: none;
	}
	.stage {
		position: relative;
		z-index: 1;
		margin-inline: auto;
		max-width: 62rem;
		border: 1px solid var(--ds-border-soft);
		border-radius: clamp(14px, 1.6vw, 22px);
		background: var(--ds-surface);
		box-shadow: var(--ds-shadow-lg);
		overflow: hidden;
		transform-origin: 50% 0%;
	}
	/* Scroll-driven: startet leicht gekippt/verkleinert, richtet sich beim
	   Scrollen der ersten ~65vh auf. Nur wo unterstützt; sonst flach. */
	@supports (animation-timeline: scroll()) {
		.stage {
			animation: stage-rise linear both;
			animation-timeline: scroll(root);
			animation-range: 0 65vh;
		}
	}
	@keyframes stage-rise {
		from {
			transform: rotateX(11deg) scale(0.95) translateY(14px);
			opacity: 0.88;
		}
		to {
			transform: rotateX(0deg) scale(1) translateY(0);
			opacity: 1;
		}
	}
	.stage__bar {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		padding: 0.7rem 1rem;
		border-bottom: 1px solid var(--ds-border-soft);
		background: var(--ds-surface-raised);
	}
	.stage__dots {
		display: inline-flex;
		gap: 0.4rem;
	}
	.stage__dots i {
		width: 10px;
		height: 10px;
		border-radius: 999px;
		background: var(--ds-border-strong);
	}
	.stage__url {
		font-family: var(--ds-font-mono);
		font-size: var(--ds-text-xs);
		color: var(--ds-text-faint);
		margin-inline: auto;
		padding: 0.2rem 0.7rem;
		border-radius: 999px;
		background: var(--ds-surface);
		border: 1px solid var(--ds-border-soft);
	}
	.stage__body {
		display: grid;
		grid-template-columns: 1fr;
		min-height: 300px;
	}
	@media (min-width: 640px) {
		.stage__body {
			grid-template-columns: 172px 1fr;
		}
	}
	.stage__nav {
		display: none;
		flex-direction: column;
		gap: 0.7rem;
		padding: 1.4rem 1.1rem;
		border-right: 1px solid var(--ds-border-soft);
		background: var(--ds-surface-raised);
	}
	@media (min-width: 640px) {
		.stage__nav {
			display: flex;
		}
	}
	.stage__navhead {
		width: 42%;
		height: 7px;
		border-radius: 4px;
		background: var(--ds-border-strong);
		margin-top: 0.4rem;
	}
	.stage__navitem {
		width: 78%;
		height: 9px;
		border-radius: 5px;
		background: var(--ds-border-soft);
	}
	.stage__navitem:nth-of-type(4) {
		width: 64%;
	}
	.stage__navitem:nth-of-type(7) {
		width: 70%;
	}
	.stage__navitem--active {
		width: 86%;
		background: color-mix(in srgb, var(--ds-accent-brand) 55%, var(--ds-border-strong));
	}
	.stage__main {
		display: flex;
		flex-direction: column;
		gap: 1rem;
		padding: clamp(1.2rem, 3vw, 2rem);
	}
	.stage__title {
		width: 52%;
		height: 22px;
		border-radius: 6px;
		background: var(--ds-text);
		opacity: 0.85;
	}
	.stage__sub {
		width: 72%;
		height: 11px;
		border-radius: 5px;
		background: var(--ds-border-strong);
	}
	.stage__swatches {
		display: flex;
		gap: 0.6rem;
		margin-top: 0.4rem;
	}
	.stage__swatches i {
		width: 44px;
		height: 44px;
		border-radius: 10px;
		background: var(--c);
		border: 1px solid var(--ds-border-soft);
	}
	.stage__lines {
		display: flex;
		flex-direction: column;
		gap: 0.55rem;
		margin-top: 0.4rem;
	}
	.stage__lines span {
		height: 9px;
		border-radius: 5px;
		background: var(--ds-border-soft);
	}
	.stage__lines span:nth-child(1) {
		width: 92%;
	}
	.stage__lines span:nth-child(2) {
		width: 84%;
	}
	.stage__lines span:nth-child(3) {
		width: 60%;
	}
	.stage__cards {
		display: grid;
		grid-template-columns: repeat(3, 1fr);
		gap: 0.7rem;
		margin-top: 0.6rem;
	}
	.stage__cards div {
		height: 64px;
		border-radius: 10px;
		border: 1px solid var(--ds-border-soft);
		background: var(--ds-surface-raised);
	}

	@media (prefers-reduced-motion: reduce) {
		.btn {
			transition: none;
		}
		.stage {
			animation: none;
			transform: none;
			opacity: 1;
		}
	}
</style>
