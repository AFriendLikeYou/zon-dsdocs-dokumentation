<!--
  /internal/ui-inventory — Inventar der Doku-App-UI.

  Internes Werkzeug, kein Marken- und kein Design-System-Inhalt: EIN Ort, an dem
  alle Bausteine aus `$components/ui/` als lebende Instanz nebeneinander stehen,
  damit man sie gestalterisch nacharbeiten kann. Bewusst NICHT im Sidebar-Menü
  (Allowlist in tooling/check-nav.mjs) — Zielgruppe sind Design und Entwicklung,
  nicht die Leserinnen und Leser der Doku.

  Reihenfolge, Gruppierung und Texte kommen aus `inventar.ts`; hier stehen nur die
  Demos. Fehlt zu einem Registry-Eintrag eine Demo, sagt die Seite das an Ort und
  Stelle — und `inventar.test.ts` meldet, wenn ein ganzer Ordner fehlt.
-->
<script lang="ts">
	import type { Snippet } from 'svelte';

	import { INVENTAR, ANZAHL_BAUSTEINE, fehlendeOrdner, verwaisteEintraege } from './inventar';

	// App-Chrome: der Theme-Schalter ist derselbe wie im Footer (ein Schreibpfad
	// für Cookie + html-Klasse). Die `select`-Variante hat weder feste IDs noch
	// eine Radiogruppe und kollidiert deshalb nicht mit der Instanz im Footer.
	import ThemeSwitch from '$components/layout/ThemeSwitch.svelte';
	import type { Theme } from '$types/global';

	import { Accordion } from '$components/ui/accordion';
	import { AssetActions } from '$components/ui/asset-actions';
	import { Badge } from '$components/ui/badge';
	import { Banner } from '$components/ui/banner';
	import { BrandAssetsGrid } from '$components/ui/brand-assets';
	import { BrandHero } from '$components/ui/brand-hero';
	import { Breakout } from '$components/ui/breakout';
	import { Button } from '$components/ui/button';
	import { ButtonGroup } from '$components/ui/button-group';
	import { Card, CardGrid } from '$components/ui/card';
	import { Changelog } from '$components/ui/changelog';
	import { Checkbox } from '$components/ui/checkbox';
	import { Chip } from '$components/ui/chip';
	import { CodeBlock } from '$components/ui/code-block';
	import { ColorRoles } from '$components/ui/color-roles';
	import { Color, TextColor } from '$components/ui/colors';
	import { ColumnPicker } from '$components/ui/column-picker';
	import { ContrastMatrix } from '$components/ui/contrast-matrix';
	import { CopyButton } from '$components/ui/copy-button';
	import { Dialog } from '$components/ui/dialog';
	import { Divider } from '$components/ui/divider';
	import { DoDont, DoDontGroup } from '$components/ui/dodont';
	import { DownloadButton } from '$components/ui/download-button';
	import { DownloadSpecimen } from '$components/ui/downloadspecimen';
	import { ElevationDemo } from '$components/ui/elevation-demo';
	import { EmptyState } from '$components/ui/empty-state';
	import { ExampleStage } from '$components/ui/example-stage';
	import { Field, Select } from '$components/ui/field';
	import { Figure } from '$components/ui/figure';
	import { Font } from '$components/ui/fonts';
	import { Grid } from '$components/ui/grid';
	import { IconActionButton } from '$components/ui/icon-action-button';
	import { IconGridWithSearch } from '$components/ui/icons';
	import { ImageGallery } from '$components/ui/imagegallery';
	import { IssuesList } from '$components/ui/issues-list';
	import { Kbd } from '$components/ui/kbd';
	import { Lightbox } from '$components/ui/lightbox';
	import { MotionDemo } from '$components/ui/motion-demo';
	import { Playground } from '$components/ui/playground';
	import { ResizeHandle } from '$components/ui/resize-handle';
	import { RoundButton } from '$components/ui/round-button';
	import { RadiusScale, SpacingScale } from '$components/ui/scale';
	import { SectionTiles } from '$components/ui/section-tiles';
	import { SegmentedControl } from '$components/ui/segmented-control';
	import { SpacingContext } from '$components/ui/spacing-context';
	import { Mark, StateList } from '$components/ui/specsheet';
	import { StageToggle } from '$components/ui/stage-toggle';
	import { Swatch } from '$components/ui/swatch';
	import { Switch } from '$components/ui/switch';
	import { Tabs } from '$components/ui/tab';
	import { Table } from '$components/ui/table';
	import { TokenReference } from '$components/ui/token-reference';
	import { TypeSpecimen } from '$components/ui/type-specimen';
	import { UsageBlock } from '$components/ui/usage-block';
	import { VideoPlayer } from '$components/ui/videoplayer';
	import { ViewportSelect } from '$components/ui/viewport-select';

	import { CloseIcon, CopyIcon, PencilIcon, SearchIcon } from '$lib/icons';
	import { A11Y_ITEMS } from '$data/a11y-issues';
	import { CHANGELOG } from '$data/changelog';
	import { FOUNDATION_TOKENS } from '$data/foundation-tokens';

	// Icons und Marken-Assets liefert das Wurzel-Layout (`+layout.server.ts`) an
	// jede Seite — die daten-gebundenen Darsteller bekommen so echte Daten statt
	// erfundener Fixtures.
	let { data }: import('./$types').PageProps = $props();

	// Der Cookie-Wert kommt als `string` aus dem Layout-Load; die Verengung auf
	// `Theme` macht das Wurzel-Layout genauso (dort über die Props-Deklaration).
	const theme = data.theme as Theme;

	// ── Vollständigkeit ──────────────────────────────────────────────────────
	// Glob (Ordner auf der Platte) gegen Registry. Der Befund steht sichtbar oben
	// auf der Seite; dieselbe Prüfung läuft im Gate (inventar.test.ts).
	const fehlend = fehlendeOrdner();
	const verwaist = verwaisteEintraege();

	// ── Zustand der Demos ────────────────────────────────────────────────────
	let feldWert = $state('Suchbegriff');
	let mehrzeiligWert = $state('Mehrzeilig — wächst mit dem Inhalt.');
	let sortierung = $state('alphabetisch');
	let haekchen = $state(true);
	let schalter = $state(true);
	let dichte = $state('komfortabel');
	let spalten = $state(3);
	let probenBreite = $state(220);
	let probenViewport = $state('frei');
	let buehneDunkel = $state(false);
	let leisteOffen = $state(false);

	/** Zieh-Griff: der Aufrufer hält die Grenzen (die Komponente kennt sie nicht). */
	const PROBE_MIN = 140;
	const PROBE_MAX = 420;
	const zieheProbe = (delta: number) => {
		probenBreite = Math.min(PROBE_MAX, Math.max(PROBE_MIN, probenBreite + delta));
	};

	// ── Daten der Demos ──────────────────────────────────────────────────────
	const tabellenSpalten = [
		{ key: 'rolle', label: 'Rolle', header: true, width: '40%' },
		{ key: 'einsatz', label: 'Einsatz' }
	];
	const tabellenZeilen = [
		{ rolle: '--ds-surface', einsatz: 'Seite, Karten, Navbar' },
		{ rolle: '--ds-surface-raised', einsatz: 'Pillen, Hover, Code, Bühnen' },
		{ rolle: '--ds-border-soft', einsatz: 'Haarlinien in Tabellen und Karten' }
	];

	const beispielCode = [
		'<Banner variant="tip" title="Sparsam einsetzen">',
		'\tDrei Hinweiskästen hintereinander lesen sich wie ein Formular.',
		'</Banner>'
	].join('\n');

	const farbRollen = [
		{
			titel: 'Flächen',
			beschreibung: 'Die drei Ebenen, auf denen alles andere steht.',
			rollen: [
				{
					token: '--ds-surface',
					raw: '--z-ds-color-background-0',
					usage: 'Seite, Karten, Navbar'
				},
				{
					token: '--ds-surface-raised',
					raw: '--z-ds-color-background-10',
					usage: 'Pillen, Hover, Code, Bühnen'
				}
			]
		}
	];

	const textRollen = [
		{
			token: '--z-ds-fontsize-30',
			label: 'Überschrift 1',
			usage: 'Seitentitel — genau einmal je Seite.',
			bold: true
		},
		{
			token: '--z-ds-fontsize-16',
			label: 'Fließtext',
			usage: 'Der Normalfall im Text.',
			demoText:
				'Die Rolle wird in ihrer echten Zielgröße gerendert; der px-Wert wird aus dem Specimen gelesen, nicht aus dem Roh-Token.'
		}
	];

	// Nur der erste Datumsblock der neuesten Version — die volle Historie steht
	// unter /product/changelog.
	const changelogAusschnitt = [
		{ version: CHANGELOG[0].version, dates: CHANGELOG[0].dates.slice(0, 1) }
	];

	const kacheln = [
		{
			href: '/product/foundations',
			title: 'Foundations',
			description: 'Farbe, Typografie, Abstände, Motion.'
		},
		{
			href: '/product/components',
			title: 'Komponenten',
			description: 'Der dokumentierte Pattern-Katalog.',
			badge: 'Katalog',
			badgeVariant: 'machine' as const
		}
	];

	const karten = [
		{
			url: '/product/components/button',
			title: 'Button',
			description: 'Die dokumentierte ZDS-Komponente mit Playground und Anatomie.',
			badge: 'Doku',
			badgeVariant: 'machine' as const
		}
	];

	const verwendung = {
		nutzen: ['Wenn ein Baustein poliert werden soll und der Vergleich zählt.'],
		nichtNutzen: ['Als Dokumentation des ZEIT-Designsystems — dafür gibt es /product.']
	};

	const zustaende = [
		{ label: 'default', vorhanden: true },
		{ label: 'hover', vorhanden: true },
		{ label: 'disabled', vorhanden: false }
	];

	// Playground im SNIPPET-Modus (Escape-Hatch): das Specimen ist ein echter
	// Doku-UI-Button statt eines ZDS-Patterns — siehe `einschraenkung` im Eintrag.
	const playgroundControls = [
		{
			key: 'variante',
			label: 'Variante',
			type: 'select' as const,
			options: [
				{ value: 'default', label: 'Default' },
				{ value: 'accent', label: 'Accent' },
				{ value: 'ghost', label: 'Ghost' }
			]
		},
		{ key: 'gross', label: 'Große Stufe', type: 'toggle' as const }
	];
	const playgroundCode = (zustand: Record<string, string | number | boolean>) =>
		`<Button variant="${zustand.variante}" size="${zustand.gross ? 'lg' : 'sm'}">Knopf</Button>`;
</script>

<svelte:head><title>UI-Inventar – intern</title></svelte:head>

<!-- ══ Demos ══════════════════════════════════════════════════════════════════
     Je Baustein ein Snippet. Die Zuordnung Ordner → Snippet passiert unten in
     genau EINER Tabelle beim Aufruf von `inventarListe` — so fällt eine fehlende
     Demo sofort auf, statt still eine leere Kachel zu hinterlassen. -->

{#snippet demoButton()}
	<Button>Default</Button>
	<Button variant="accent">Accent</Button>
	<Button variant="ghost">Ghost</Button>
	<Button variant="quiet">Quiet</Button>
	<Button variant="danger">Danger</Button>
	<Button disabled>Deaktiviert</Button>
{/snippet}

{#snippet demoButtonGroup()}
	<ButtonGroup attached label="Reihenfolge ändern">
		<Button variant="ghost">Nach oben</Button>
		<Button variant="ghost">Nach unten</Button>
	</ButtonGroup>
	<ButtonGroup gap="md" label="Speichern oder verwerfen">
		<Button variant="quiet">Verwerfen</Button>
		<Button variant="accent">Speichern</Button>
	</ButtonGroup>
{/snippet}

{#snippet demoIconActionButton()}
	<IconActionButton iconButton ariaLabel="Kopieren" title="Gerahmt (iconButton)">
		<CopyIcon />
	</IconActionButton>
	<IconActionButton subtle ariaLabel="Bearbeiten" title="Dezent (subtle)">
		<PencilIcon />
	</IconActionButton>
	<IconActionButton subtle tone="danger" ariaLabel="Entfernen" title="Destruktiv (tone=danger)">
		<CloseIcon />
	</IconActionButton>
{/snippet}

{#snippet demoRoundButton()}
	<RoundButton label="Schließen" size="sm">
		{#snippet icon()}<CloseIcon />{/snippet}
	</RoundButton>
	<RoundButton label="Suchen" size="md">
		{#snippet icon()}<SearchIcon />{/snippet}
	</RoundButton>
{/snippet}

{#snippet demoCopyButton()}
	<CopyButton value="--ds-surface" label="Token kopieren" />
	<CopyButton value="--ds-surface" ariaLabel="Token kopieren" iconButton />
{/snippet}

{#snippet demoDownloadButton()}
	<DownloadButton
		href="/downloads/docs/brandguidelines.pdf"
		filename="brandguidelines.pdf"
		label="Guidelines laden"
	/>
	<DownloadButton
		href="/downloads/docs/brandguidelines.pdf"
		filename="brandguidelines.pdf"
		ariaLabel="Guidelines laden"
		iconButton
	/>
{/snippet}

{#snippet demoField()}
	<!-- aria-label statt sichtbarem Label: Field/Select rendern bewusst nur das
	     Bedienelement, die Beschriftung stellt der Aufrufer. Hier gibt es keine —
	     also muss der Name über restProps kommen, sonst ist das Feld namenlos. -->
	<div class="inventar__spalte">
		<Field bind:value={feldWert} density="comfortable" aria-label="Suchfeld (Beispiel)">
			{#snippet icon()}<SearchIcon />{/snippet}
			{#snippet shortcut()}<Kbd>⌘K</Kbd>{/snippet}
		</Field>
		<Select
			bind:value={sortierung}
			aria-label="Sortierung (Beispiel)"
			options={[
				{ value: 'alphabetisch', label: 'Alphabetisch' },
				{ value: 'gruppen', label: 'Nach Gruppen' }
			]}
		/>
		<Field
			bind:value={mehrzeiligWert}
			multiline
			rows={2}
			font="mono"
			density="compact"
			aria-label="Mehrzeiliges Feld (Beispiel)"
		/>
		<Field value="Fehler-Zustand" error aria-label="Feld im Fehler-Zustand (Beispiel)" />
	</div>
{/snippet}

{#snippet demoCheckbox()}
	<Checkbox bind:checked={haekchen} label="Nur Bausteine mit Lücken" />
	<Checkbox checked={false} label="Deaktiviert" disabled />
{/snippet}

{#snippet demoSwitch()}
	<Switch label="Dunkle Bühne" checked={schalter} onchange={(v) => (schalter = v)} />
{/snippet}

{#snippet demoSegmentedControl()}
	<SegmentedControl
		bind:value={dichte}
		label="Dichte"
		options={[
			{ value: 'kompakt', label: 'Kompakt' },
			{ value: 'komfortabel', label: 'Komfortabel' }
		]}
	/>
	<SegmentedControl
		value={dichte}
		onchange={(v) => (dichte = v)}
		variant="flat"
		size="sm"
		label="Dichte (flach)"
		options={[
			{ value: 'kompakt', label: 'Kompakt' },
			{ value: 'komfortabel', label: 'Komfortabel' }
		]}
	/>
{/snippet}

{#snippet demoColumnPicker()}
	<ColumnPicker
		value={spalten}
		onchange={(v) => (spalten = v)}
		label="Spalten des Rasters"
		choices={[1, 2, 3, 4]}
		childCount={4}
	/>
{/snippet}

{#snippet demoResizeHandle()}
	<!-- Der Griff ist absolut positioniert — der Aufrufer stellt den Bezugsrahmen. -->
	<div class="inventar__probe" style:width="{probenBreite}px">
		<span class="inventar__probe-wert">{probenBreite} px</span>
		<ResizeHandle
			direction="horizontal"
			label="Breite der Probe"
			value={probenBreite}
			min={PROBE_MIN}
			max={PROBE_MAX}
			onresize={zieheProbe}
		/>
	</div>
{/snippet}

{#snippet demoViewportSelect()}
	<!-- Ohne Bühne drumherum: Der Baustein ist die Leiste, nicht ihre Wirkung.
	     Was die gewählte Stufe mit einem Specimen macht, zeigen Playground und
	     Anatomie — hier zählt die Optik der Pille samt Beschriftung. -->
	<ViewportSelect value={probenViewport} onchange={(v) => (probenViewport = v)} />
{/snippet}

{#snippet demoStageToggle()}
	<!-- Bühne mit ROHEN --z-ds-*-Token: nur so flippt die Fläche mit dem Schalter
	     und nicht mit dem Seiten-Theme (.ds-stage-Regel). -->
	<div class="ds-stage inventar__buehne" class:is-dark={buehneDunkel}>
		<StageToggle
			isDark={buehneDunkel}
			onlight={() => (buehneDunkel = false)}
			ondark={() => (buehneDunkel = true)}
		/>
	</div>
{/snippet}

{#snippet demoAssetActions()}
	{#if data.brandAssets[0]}
		<AssetActions icon={data.brandAssets[0]} />
	{/if}
{/snippet}

{#snippet demoBadge()}
	<Badge>default</Badge>
	<Badge tone="machine">machine</Badge>
	<Badge tone="editorial">editorial</Badge>
	<Badge tone="warn">warn</Badge>
	<Badge tone="ghost">ghost</Badge>
	<Badge tone="accent">accent</Badge>
{/snippet}

{#snippet demoChip()}
	<Chip value="--ds-surface" />
	<Chip value="8px" tone="machine" />
	<Chip value="Redaktion" tone="editorial" font="text" copy={false} />
	<Chip value="veraltet" tone="warn" font="text" copy={false} />
{/snippet}

{#snippet demoKbd()}
	<Kbd>⌘K</Kbd>
	<Kbd>Esc</Kbd>
	<Kbd>⇧⌘D</Kbd>
{/snippet}

{#snippet demoSwatch()}
	<Swatch color="var(--ds-accent)" title="Akzent" />
	<Swatch color="var(--ds-positive)" title="Positiv" />
	<Swatch color="var(--ds-negative)" title="Negativ" />
	<Swatch checkerboard title="Kein Fill" />
{/snippet}

{#snippet demoCodeBlock()}
	<CodeBlock title="Banner in einer .svx-Seite" code={beispielCode} lang="svelte" />
{/snippet}

{#snippet demoTable()}
	<Table
		columns={tabellenSpalten}
		rows={tabellenZeilen}
		showHeader
		caption="Drei Rollen-Token als Beispielzeilen"
	/>
{/snippet}

{#snippet demoDivider()}
	<div class="inventar__spalte">
		<Divider />
		<Divider label="oder" />
		<Divider variant="dashed" label="Maschinen-Trenner" />
	</div>
{/snippet}

{#snippet demoAccordion()}
	<Accordion titel="Warum ist diese Seite kein Design-System?" headingLevel={4}>
		<p>
			Weil sie die UI der Doku-App zeigt — das Werkzeug, mit dem dokumentiert wird, nicht das
			Dokumentierte.
		</p>
	</Accordion>
	<Accordion titel="Zweiter Aufklapper, offen" headingLevel={4} open>
		<p>Das Panel klappt über <code>grid-template-rows</code> auf; geschlossen ist es inert.</p>
	</Accordion>
{/snippet}

{#snippet demoTooltip()}
	<Badge tone="machine" title="Erscheint nach ~400 ms bei Hover — und sofort bei Tastatur-Fokus.">
		Zeiger draufhalten
	</Badge>
	<Button variant="ghost" title="Auch der Button hebt sein title-Prop auf die Action.">
		oder hierhin
	</Button>
{/snippet}

{#snippet demoCard()}
	<CardGrid cards={karten} />
	<Card
		url="/product/foundations/color"
		title="Farbe"
		description="Rollen, Kontraste und die Foundation-Token dahinter."
		variant="framed"
		headingLevel={3}
		cta="Ansehen"
	/>
{/snippet}

{#snippet demoSectionTiles()}
	<SectionTiles tiles={kacheln} />
{/snippet}

{#snippet tabDesign()}
	<p>Panel eins — hier läge auf einer Component-Seite der Playground.</p>
{/snippet}
{#snippet tabDevelop()}
	<p>Panel zwei — hier lägen Props und Code-Artefakte.</p>
{/snippet}

{#snippet demoTab()}
	{@const tabs = [
		{ id: 'design', label: 'Design', component: tabDesign },
		{ id: 'develop', label: 'Develop', component: tabDevelop }
	]}
	<Tabs {tabs} label="Beispiel-Tabs" />
{/snippet}

{#snippet demoBanner()}
	<div class="inventar__spalte">
		<Banner variant="info" title="Info" description="Der neutrale Hinweis im Lesefluss." />
		<Banner variant="success" title="Erledigt" description="Positive Rückmeldung." />
		<Banner variant="warning" title="Achtung" description="Etwas braucht Aufmerksamkeit." />
		<Banner compact variant="danger" description="Schmales Statusband (compact)." />
	</div>
{/snippet}

{#snippet demoEmptyState()}
	<div class="inventar__spalte">
		<EmptyState title="Nichts gefunden" description="Andere Suchbegriffe probieren." />
		<EmptyState appearance="dashed" title="Noch keine Blöcke" description="Unten etwas einfügen.">
			{#snippet action()}<Button variant="ghost">Block einfügen</Button>{/snippet}
		</EmptyState>
	</div>
{/snippet}

{#snippet demoDialog()}
	<Button variant="ghost" onclick={() => (leisteOffen = true)}>Save-Bar einblenden</Button>
	<!-- Nur eingehängt, wenn sichtbar: der ⌘S-Handler hängt am Fenster und würde
	     sonst die ganze Seite über das Tastenkürzel abfangen. -->
	{#if leisteOffen}
		<Dialog
			open
			message="Ungespeicherte Änderungen"
			shortcut="cmd+s"
			onprimary={() => (leisteOffen = false)}
			onsecondary={() => (leisteOffen = false)}
		/>
	{/if}
{/snippet}

{#snippet demoLightbox()}
	<Lightbox
		src="/media/brand/logo/pictogram-1.png"
		alt="Bildmarke der ZEIT"
		caption="Klick öffnet die Detailansicht im nativen <dialog>."
	/>
{/snippet}

{#snippet demoGrid()}
	<Grid columns={3} columnGap="md" rowGap="md">
		<div class="inventar__zelle">1</div>
		<div class="inventar__zelle">2</div>
		<div class="inventar__zelle">3</div>
	</Grid>
{/snippet}

{#snippet demoBreakout()}
	<Breakout width="wide">
		<div class="inventar__zelle">width="wide"</div>
	</Breakout>
{/snippet}

{#snippet demoExampleStage()}
	<ExampleStage title="Bühne mit Raster" caption="Unterschrift zum Beispiel" background="grid">
		<Button variant="accent">Ein Specimen</Button>
	</ExampleStage>
{/snippet}

{#snippet demoPlayground()}
	<Playground controls={playgroundControls} code={playgroundCode} lang="svelte">
		{#snippet preview(zustand)}
			<Button
				variant={zustand.variante as 'default' | 'accent' | 'ghost'}
				size={zustand.gross ? 'lg' : 'sm'}
			>
				Knopf
			</Button>
		{/snippet}
	</Playground>
{/snippet}

{#snippet demoSpecsheet()}
	<div class="inventar__spalte">
		<StateList states={zustaende} />
		<p class="inventar__zeile">
			<Mark kind="good" /> erfüllt · <Mark kind="bad" /> nicht erfüllt
		</p>
	</div>
{/snippet}

{#snippet demoFigure()}
	<!-- Feste Breite: Figure setzt `width: 100%` aufs Bild, und in einem
	     schrumpfenden Flex-Container (die Bühne) hat 100 % keinen Bezug — das Bild
	     fiele auf null zusammen. Ein Befund, kein Kunstgriff: siehe Fußnote. -->
	<div class="inventar__medium">
		<Figure
			src="/media/brand/typography/fonts.webp"
			alt="Schriftmuster der ZEIT-Hausschriften"
			caption="Bildunterschrift (caption)"
		/>
	</div>
{/snippet}

{#snippet demoImageGallery()}
	<ImageGallery direction="row" gap="1rem">
		<Lightbox src="/media/brand/logo/pictogram-1.png" alt="Bildmarke, Variante 1" />
		<Lightbox src="/media/brand/logo/pictogram-2.png" alt="Bildmarke, Variante 2" />
	</ImageGallery>
{/snippet}

{#snippet demoVideoPlayer()}
	<div class="inventar__medium">
		<VideoPlayer src="/media/brand/logo/logo.mp4" title="Bewegtbild der Wortmarke" />
	</div>
{/snippet}

{#snippet demoBrandHero()}
	<BrandHero
		title="Titelkopf einer Brand-Seite"
		subtitle="Unterzeile mit einem Satz Einordnung."
		image="/media/brand/typography/typografie-image-0.png"
		imageAlt=""
	/>
{/snippet}

{#snippet demoColors()}
	<Grid columns={2} columnGap="md" rowGap="md">
		<Color
			colorCustomProperty="--z-ds-color-accent-100"
			title="Akzent 100"
			description="Das ZEIT-Rot."
		/>
		<TextColor
			fontColorCustomProperty="--z-ds-color-text-70"
			title="Text 70"
			description="Fließtext und sekundäre UI."
		/>
	</Grid>
{/snippet}

{#snippet demoColorRoles()}
	<ColorRoles groups={farbRollen} />
{/snippet}

{#snippet demoContrastMatrix()}
	<ContrastMatrix
		textTokens={['--z-ds-color-text-100', '--z-ds-color-text-55']}
		backgroundTokens={['--z-ds-color-background-0', '--z-ds-color-background-10']}
		caption="Kontrast zweier Textfarben auf zwei Flächen"
	/>
{/snippet}

{#snippet demoTokenReference()}
	<TokenReference groups={FOUNDATION_TOKENS.slice(0, 1)} />
{/snippet}

{#snippet demoTypeSpecimen()}
	<TypeSpecimen roles={textRollen} />
{/snippet}

{#snippet demoFonts()}
	<div class="inventar__spalte">
		<Font style="headline" title="Die ZEIT" weight="bold" size={34} lineheight="1.1" />
		<Font style="label" title="Ressort · Politik" weight="regular" size={14} />
	</div>
{/snippet}

{#snippet demoScale()}
	<div class="inventar__spalte">
		<SpacingScale tokens={['--z-ds-space-8', '--z-ds-space-16', '--z-ds-space-32']} />
		<RadiusScale
			items={[
				{ token: '--z-ds-border-radius-4', usage: 'Chips, kleine Flächen' },
				{ token: '--z-ds-border-radius-8', usage: 'Karten, Felder' }
			]}
		/>
	</div>
{/snippet}

{#snippet demoSpacingContext()}
	<SpacingContext />
{/snippet}

{#snippet demoMotionDemo()}
	<MotionDemo
		tokens={[
			{ label: 'Standard-Kurve', cssVar: '--ds-ease-out' },
			{ label: 'Morph-Kurve', cssVar: '--ds-ease-in-out' }
		]}
	/>
{/snippet}

{#snippet demoElevationDemo()}
	<ElevationDemo
		tokens={[
			{ label: 'Klein', cssVar: '--ds-shadow-sm', usage: 'ruhende Kante' },
			{ label: 'Mittel', cssVar: '--ds-shadow-md', usage: 'Hover-Lift' }
		]}
	/>
{/snippet}

{#snippet demoIcons()}
	<IconGridWithSearch icons={data.icons.slice(0, 8)} />
{/snippet}

{#snippet demoBrandAssets()}
	<BrandAssetsGrid brandAssets={data.brandAssets.slice(0, 3)} />
{/snippet}

{#snippet demoChangelog()}
	<Changelog changelog={changelogAusschnitt} />
{/snippet}

{#snippet demoIssuesList()}
	<IssuesList issues={A11Y_ITEMS.slice(0, 2)} />
{/snippet}

{#snippet demoDoDont()}
	<DoDontGroup columns={2}>
		<DoDont variant="do" caption="Bildmarke freistellen" imgSrc="/media/brand/logo/logo.png" />
		<DoDont
			variant="dont"
			caption="Bildmarke verzerren"
			imgSrc="/media/brand/logo/dont-1.png"
			strikeThrough
		/>
	</DoDontGroup>
{/snippet}

{#snippet demoDownloadSpecimen()}
	<DownloadSpecimen
		variant="pdf"
		title="Brand Guidelines"
		subtitle="PDF · vollständige Markenrichtlinien"
		url="/downloads/docs/brandguidelines.pdf"
		filename="brandguidelines.pdf"
	/>
{/snippet}

{#snippet demoUsageBlock()}
	<UsageBlock {verwendung} />
{/snippet}

<!-- ══ Rahmen ═════════════════════════════════════════════════════════════════ -->

{#snippet inventarListe(demos: Record<string, Snippet>)}
	{#each INVENTAR as gruppe (gruppe.id)}
		<section class="gruppe" id={gruppe.id}>
			<h2 class="gruppe__titel">{gruppe.titel}</h2>
			<p class="gruppe__begruendung">{gruppe.begruendung}</p>

			<div class="gruppe__raster">
				{#each gruppe.eintraege as eintrag (eintrag.ordner)}
					{@const demo = demos[eintrag.ordner]}
					<article class="baustein" class:baustein--breit={eintrag.breit}>
						<header class="baustein__kopf">
							<h3 class="baustein__name">{eintrag.exporte.slice(0, 3).join(' · ')}</h3>
							<code class="baustein__ordner">ui/{eintrag.ordner}</code>
						</header>
						{#if eintrag.exporte.length > 3}
							<!-- Sammel-Ordner (specsheet) — die Überschrift bliebe sonst ein Absatz. -->
							<p class="baustein__exporte">
								außerdem: {eintrag.exporte.slice(3).join(' · ')}
							</p>
						{/if}
						<p class="baustein__zweck">{eintrag.zweck}</p>

						{#if eintrag.nurVerweis}
							<Banner compact variant="info" description={eintrag.nurVerweis} />
						{:else if demo}
							<!-- Bühne nur für schmale, objekthafte Specimens — breite Block-
							     Renderer bringen ihre eigene Fassung mit (siehe inventar.ts). -->
							{#if eintrag.breit}
								{@render demo()}
							{:else}
								<ExampleStage>{@render demo()}</ExampleStage>
							{/if}
							{#if eintrag.einschraenkung}
								<p class="baustein__einschraenkung">{eintrag.einschraenkung}</p>
							{/if}
						{:else}
							<!-- Registry-Eintrag ohne Demo: sichtbar machen statt verschweigen. -->
							<Banner
								compact
								variant="warning"
								description="Für diesen Eintrag ist keine Demo hinterlegt — in +page.svelte ergänzen."
							/>
						{/if}
					</article>
				{/each}
			</div>
		</section>
	{/each}
{/snippet}

<div class="inventar">
	<header class="inventar__kopf">
		<p class="inventar__eyebrow">Intern · kein Seiteninhalt</p>
		<h1 class="inventar__titel">Inventar der Doku-App-UI</h1>
		<p class="inventar__lead">
			Alle {ANZAHL_BAUSTEINE} Bausteine aus <code>src/lib/components/ui/</code> als lebende Instanz an
			einem Ort — zum Vergleichen, Nacharbeiten und Aufräumen.
		</p>

		<Banner
			variant="warning"
			title="Das hier ist NICHT das ZEIT-Designsystem"
			role="note"
			description="Gezeigt wird die UI der Doku-App selbst — das Werkzeug, mit dem dokumentiert wird. Das dokumentierte ZEIT-Designsystem (die z-*-Patterns aus packages/components) steht unter /product/components und hat mit diesen Bausteinen nichts gemein außer den Token darunter. Wer hier etwas ändert, ändert die Doku-App; wer dort etwas ändert, ändert das Designsystem."
		/>

		{#if fehlend.length || verwaist.length}
			<Banner variant="danger" title="Diese Übersicht ist gerade unvollständig">
				{#if fehlend.length}
					<p>
						Ohne Eintrag in <code>inventar.ts</code>: {fehlend.join(', ')}
					</p>
				{/if}
				{#if verwaist.length}
					<p>Eingetragen, aber nicht mehr auf der Platte: {verwaist.join(', ')}</p>
				{/if}
			</Banner>
		{/if}

		<div class="inventar__leiste">
			<label class="inventar__theme">
				<span class="inventar__theme-label">Erscheinung der App</span>
				<ThemeSwitch currentTheme={theme} variant="select" />
			</label>
			<p class="inventar__hinweis">
				Hell und Dunkel gehören beide geprüft — der Schalter ist derselbe wie im Footer und wirkt
				auf die ganze App. Alle Bausteine hier nutzen ausschließlich die semantischen
				<code>--ds-*</code>-Rollen, folgen ihm also vollständig. Ausnahme mit Absicht: die
				<code>.ds-stage</code>-Bühnen (StageToggle, Playground) pinnen rohe
				<code>--z-ds-*</code>-Token und bleiben deshalb unabhängig vom Seiten-Theme.
			</p>
		</div>

		<nav class="inventar__sprungmarken" aria-label="Gruppen">
			{#each INVENTAR as gruppe (gruppe.id)}
				<a class="inventar__sprungmarke" href="#{gruppe.id}">
					{gruppe.titel}
					<Badge tone="ghost">{gruppe.eintraege.length}</Badge>
				</a>
			{/each}
		</nav>

		<p class="inventar__fussnote">
			Nicht enthalten: <code>components/layout/</code> (App-Chrome wie Navbar, Sidebar, Footer,
			Toaster — existiert je Seite genau einmal und lässt sich nicht sinnvoll herauslösen) und die
			route-eigenen Bausteine unter <code>routes/admin/</code>. Die im Brand-CMS einfügbaren Blöcke
			zeigt daneben die redaktionelle
			<a href="/brand/component-showcase">Komponenten-Schau</a> — sie ist eine Teilmenge hiervon,
			mit Blindtext statt Bauteil-Sicht.
		</p>
	</header>

	{@render inventarListe({
		accordion: demoAccordion,
		'asset-actions': demoAssetActions,
		badge: demoBadge,
		banner: demoBanner,
		'brand-assets': demoBrandAssets,
		'brand-hero': demoBrandHero,
		breakout: demoBreakout,
		button: demoButton,
		'button-group': demoButtonGroup,
		card: demoCard,
		changelog: demoChangelog,
		checkbox: demoCheckbox,
		chip: demoChip,
		'code-block': demoCodeBlock,
		'color-roles': demoColorRoles,
		colors: demoColors,
		'column-picker': demoColumnPicker,
		'contrast-matrix': demoContrastMatrix,
		'copy-button': demoCopyButton,
		dialog: demoDialog,
		divider: demoDivider,
		dodont: demoDoDont,
		'download-button': demoDownloadButton,
		downloadspecimen: demoDownloadSpecimen,
		'elevation-demo': demoElevationDemo,
		'empty-state': demoEmptyState,
		'example-stage': demoExampleStage,
		field: demoField,
		figure: demoFigure,
		fonts: demoFonts,
		grid: demoGrid,
		'icon-action-button': demoIconActionButton,
		icons: demoIcons,
		imagegallery: demoImageGallery,
		'issues-list': demoIssuesList,
		kbd: demoKbd,
		lightbox: demoLightbox,
		'motion-demo': demoMotionDemo,
		playground: demoPlayground,
		'resize-handle': demoResizeHandle,
		'round-button': demoRoundButton,
		scale: demoScale,
		'section-tiles': demoSectionTiles,
		'segmented-control': demoSegmentedControl,
		'spacing-context': demoSpacingContext,
		specsheet: demoSpecsheet,
		'stage-toggle': demoStageToggle,
		swatch: demoSwatch,
		switch: demoSwitch,
		tab: demoTab,
		table: demoTable,
		'token-reference': demoTokenReference,
		tooltip: demoTooltip,
		'type-specimen': demoTypeSpecimen,
		'usage-block': demoUsageBlock,
		videoplayer: demoVideoPlayer,
		'viewport-select': demoViewportSelect
	})}
</div>

<style>
	/* Die Seite läuft im Root-Bereich (keine Sidebar, kein Lese-Cap) und fasst
	   sich deshalb selbst ein — mit denselben zwei Entscheidungen wie alle
	   öffentlichen Seiten, kein eigenes max-width/clamp-Paar. */
	.inventar {
		max-width: var(--ds-container-max);
		margin-inline: auto;
		padding-inline: var(--ds-gutter);
		padding-block: var(--ds-rhythm-section) var(--ds-rhythm-section);
	}

	.inventar__eyebrow {
		font-family: var(--ds-font-mono);
		font-size: var(--ds-label-size);
		letter-spacing: var(--ds-label-tracking);
		text-transform: uppercase;
		color: var(--ds-text-muted);
		margin: 0;
	}

	.inventar__titel {
		margin-block: var(--ds-rhythm-tight) 0;
	}

	.inventar__lead {
		margin-block: var(--ds-rhythm-tight) var(--ds-rhythm-block);
		font-size: var(--ds-text-lg);
		color: var(--ds-text-body);
	}

	.inventar__leiste {
		display: flex;
		flex-wrap: wrap;
		align-items: flex-start;
		gap: var(--z-ds-space-16);
		margin-block-start: var(--ds-rhythm-block);
		padding: var(--z-ds-space-16);
		border: 1px solid var(--ds-border-soft);
		border-radius: var(--ds-radius);
		background: var(--ds-elevation-rest-bg);
		box-shadow: var(--ds-elevation-shadow);
	}

	.inventar__theme {
		display: flex;
		flex-direction: column;
		gap: var(--z-ds-space-4);
		font-size: var(--ds-text-sm);
	}

	.inventar__theme-label {
		font-weight: 600;
		color: var(--ds-text);
	}

	.inventar__hinweis {
		flex: 1 1 24rem;
		margin: 0;
		font-size: var(--ds-text-sm);
		color: var(--ds-text-body);
	}

	.inventar__sprungmarken {
		display: flex;
		flex-wrap: wrap;
		gap: var(--z-ds-space-8);
		margin-block-start: var(--ds-rhythm-block);
	}

	.inventar__sprungmarke {
		display: inline-flex;
		align-items: center;
		gap: var(--z-ds-space-8);
		padding: var(--z-ds-space-6) var(--z-ds-space-12);
		border: 1px solid var(--ds-border);
		border-radius: var(--ds-radius);
		font-size: var(--ds-text-sm);
		color: var(--ds-text);
		text-decoration: none;
		/* Emil: nur Farbe/Rand animieren, starke ease-out, unter 300 ms. */
		transition:
			border-color var(--ds-dur) var(--ds-ease-out),
			background-color var(--ds-dur) var(--ds-ease-out);
	}

	@media (hover: hover) and (pointer: fine) {
		.inventar__sprungmarke:hover {
			border-color: var(--ds-border-hover);
			background: var(--ds-surface-raised);
		}
	}

	.inventar__sprungmarke:active {
		background: var(--ds-surface-sunken);
	}

	.inventar__fussnote {
		margin-block-start: var(--ds-rhythm-block);
		font-size: var(--ds-text-sm);
		color: var(--ds-text-muted);
	}

	/* ── Gruppen ─────────────────────────────────────────────────────────────── */
	.gruppe {
		margin-block-start: var(--ds-rhythm-section);
		/* Anker-Sprünge dürfen nicht unter der 64px-Navbar landen. */
		scroll-margin-top: calc(var(--header-height) + var(--z-ds-space-16));
	}

	.gruppe__titel {
		margin-block: 0 var(--ds-rhythm-tight);
	}

	.gruppe__begruendung {
		margin-block: 0 var(--ds-rhythm-block);
		max-width: var(--ds-content-width);
		color: var(--ds-text-body);
	}

	/* Bewusst KEIN `ui/grid`: dessen API kennt (mit Absicht) keine Spalten-Spans,
	   und genau die braucht dieses Raster — breite Bausteine (Tabellen, Raster,
	   Bühnen) laufen über die volle Breite, schmale stehen zu zweit nebeneinander. */
	.gruppe__raster {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(min(100%, 22rem), 1fr));
		gap: var(--ds-rhythm-section) var(--z-ds-space-32);
		align-items: start;
	}

	.baustein--breit {
		grid-column: 1 / -1;
	}

	.baustein__kopf {
		display: flex;
		flex-wrap: wrap;
		align-items: baseline;
		gap: var(--z-ds-space-8);
	}

	.baustein__name {
		margin: 0;
		font-size: var(--ds-text-base);
	}

	.baustein__ordner {
		font-family: var(--ds-font-mono);
		font-size: var(--ds-text-xs);
		color: var(--ds-text-muted);
	}

	.baustein__exporte {
		margin-block: var(--ds-rhythm-tight) 0;
		font-family: var(--ds-font-mono);
		font-size: var(--ds-text-xs);
		color: var(--ds-text-muted);
	}

	.baustein__zweck {
		margin-block: var(--ds-rhythm-tight);
		max-width: var(--ds-content-width);
		font-size: var(--ds-text-sm);
		color: var(--ds-text-body);
	}

	.baustein__einschraenkung {
		margin-block: var(--ds-rhythm-tight) 0;
		max-width: var(--ds-content-width);
		font-size: var(--ds-text-sm);
		color: var(--ds-text-muted);
		border-inline-start: 2px solid var(--ds-border);
		padding-inline-start: var(--z-ds-space-8);
	}

	/* ── Hilfsflächen der Demos ──────────────────────────────────────────────── */

	/* Mehrere Instanzen untereinander statt in einer Zeile (Banner, Felder …). */
	.inventar__spalte {
		display: flex;
		flex-direction: column;
		gap: var(--z-ds-space-16);
		width: 100%;
	}

	/* Medien füllen jede Breite, die sie bekommen — hier bewusst gedeckelt. */
	.inventar__medium {
		width: 16rem;
		max-width: 100%;
	}

	.inventar__zeile {
		display: flex;
		align-items: center;
		gap: var(--z-ds-space-8);
		margin: 0;
		font-size: var(--ds-text-sm);
	}

	/* Bezugsrahmen für den absolut positionierten Zieh-Griff. */
	/* Bezugsrahmen für den absolut positionierten Griff. Bewusst auf --ds-surface
	   und nicht auf der gedämpften Fläche: der Griff zeichnet sich mit
	   --z-ds-color-border-70 (#e4e4e4), auf --ds-surface-raised (#eee) wäre er
	   praktisch unsichtbar. Auch auf Weiß bleibt er blass — ein Befund für die
	   Politur, keine Eigenheit dieser Seite. */
	.inventar__probe {
		position: relative;
		display: flex;
		align-items: center;
		justify-content: center;
		min-height: 4rem;
		border: 1px solid var(--ds-border);
		border-radius: var(--ds-radius);
		background: var(--ds-surface);
	}

	.inventar__probe-wert {
		font-family: var(--ds-font-mono);
		font-size: var(--ds-text-xs);
		color: var(--ds-text-muted);
	}

	/* Specimen-Bühne: ROHE --z-ds-*-Token, damit sie dem StageToggle folgt und
	   nicht dem Seiten-Theme (.ds-stage-Regel, global.css). */
	.inventar__buehne {
		display: flex;
		align-items: center;
		justify-content: center;
		padding: var(--z-ds-space-24);
		border-radius: var(--ds-radius);
		background: var(--z-ds-color-background-10);
	}

	/* Platzhalter-Kachel für die Layout-Demos (Grid, Breakout) — sie zeigt die
	   Zelle, nicht einen Baustein; deshalb bewusst ohne eigenes Gestaltungsangebot. */
	.inventar__zelle {
		display: flex;
		align-items: center;
		justify-content: center;
		min-height: 3rem;
		border: 1px dashed var(--ds-border-strong);
		border-radius: var(--ds-radius-sm);
		font-family: var(--ds-font-mono);
		font-size: var(--ds-text-xs);
		color: var(--ds-text-muted);
	}
</style>
