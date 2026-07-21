<!--
  CodeBlock.svelte — Code-Snippet mit Copy-Button + leichter Syntax-Hervorhebung.

  Zwei optionale Playground-Features:
  - flashKey/flashLines: bei jedem flashKey-Wechsel leuchten die genannten Zeilen
    kurz auf (Ease-out-Fade) — macht sichtbar, WAS ein Control am Code geändert
    hat.
  - collapsible: lange Snippets (> 7 Zeilen) starten auf 4 Zeilen gekappt mit
    Fade-out + „Code aufklappen" (Mantine-Muster). Copy kopiert immer alles.

  Zeilennummern (lineNumbers): rein über einen CSS-Counter als ::before der
  Zeilen-Spans — die Ziffern stehen NICHT im DOM-Text. Damit liefert sowohl der
  Copy-Button (kopiert ohnehin den rohen `code`-String) als auch eine manuelle
  Text-Selektion ausschließlich den Code ohne Nummern. `user-select: none` auf
  dem Pseudo-Element ist zusätzlich gesetzt, ändert am Ergebnis aber nichts:
  Pseudo-Element-Inhalte sind per Spezifikation nicht Teil der Selektion.
-->

<script lang="ts">
	import { CopyButton } from '$components/ui/copy-button';
	import { ChevronIcon } from '$lib/icons';

	type Lang = 'html' | 'css' | 'svelte' | 'js';
	let {
		title = '',
		code = '',
		lang = 'html',
		flashKey,
		flashLines = [],
		collapsible = false,
		lineNumbers
	}: {
		/** Überschrift in der Kopfzeile des Blocks. */
		title?: string;
		/** Anzuzeigender und (immer vollständig) kopierbarer Quelltext. */
		code?: string;
		/** Sprache für die Syntax-Hervorhebung (html/css/svelte). */
		lang?: Lang;
		/** Wechselt der Wert, leuchten die flashLines kurz auf; aktiviert den zeilenweisen Modus. */
		flashKey?: number;
		/** Zeilenindizes (0-basiert), die beim flashKey-Wechsel aufleuchten. */
		flashLines?: number[];
		/** Lange Snippets (> 7 Zeilen) starten gekappt mit „Code aufklappen". */
		collapsible?: boolean;
		/**
		 * Zeilennummern in der Rinne (CSS-Counter, nicht im DOM-Text → Kopieren
		 * liefert weiterhin nur den Code).
		 *
		 * Default ist bewusst AUTOMATISCH statt `false`: Nummern zeigen sich, sobald
		 * der Block mehr als eine Zeile hat. Damit bekommen Playground und
		 * Develop-Tab (HTML-/CSS-/Svelte-Blöcke) die Rinne ohne Änderung an den
		 * generierten Seiten, während einzeilige Inline-Snippets im Fließtext
		 * (Pattern-Seiten, Beispiel-Zeilen) unverändert nummernlos bleiben — eine
		 * „1" an einer einzelnen Zeile trägt keine Information. Explizites
		 * `lineNumbers={false}` bzw. `true` überschreibt die Automatik.
		 */
		lineNumbers?: boolean;
	} = $props();

	const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

	const GRAMMAR: Record<Lang, [string, RegExp][]> = {
		html: [
			['comment', /<!--[\s\S]*?-->/],
			['tag', /<\/?[a-zA-Z][\w-]*/],
			['attr', /[a-zA-Z-]+(?==)/],
			['string', /"[^"]*"|'[^']*'/],
			['punct', /\/?>/]
		],
		svelte: [
			['comment', /<!--[\s\S]*?-->/],
			['tag', /<\/?[a-zA-Z][\w-]*/],
			['attr', /[a-zA-Z-]+(?==)/],
			['string', /"[^"]*"|'[^']*'/],
			['brace', /\{[^{}]*\}/],
			['punct', /\/?>/]
		],
		css: [
			['comment', /\/\*[\s\S]*?\*\//],
			['property', /--?[\w-]+(?=\s*:)/],
			['string', /"[^"]*"|'[^']*'/],
			['func', /[\w-]+(?=\()/],
			['number', /#[0-9a-fA-F]{3,8}\b|\b\d+(?:\.\d+)?(?:px|rem|em|%|s|ms)?\b/],
			['selector', /\.[\w-]+|::?[\w-]+|[\w-]+(?=\s*\{)/],
			['punct', /[{}();:,]/]
		],
		js: [
			['comment', /\/\/[^\n]*|\/\*[\s\S]*?\*\//],
			['string', /"[^"]*"|'[^']*'|`[^`]*`/],
			[
				'tag',
				/\b(?:const|let|var|function|return|import|export|from|if|else|await|async|new|class)\b/
			],
			['number', /\b\d+(?:\.\d+)?\b/],
			['punct', /[{}()[\];:,.=]/]
		]
	};

	/** Quelltext → Tokenfolge [Klasse|null, Text]. Eine Quelle für beide Renderpfade. */
	function tokenize(src: string, language: Lang): [string | null, string][] {
		const rules = (GRAMMAR[language] ?? []).map(
			([cls, re]) => [cls, new RegExp(re.source, 'y')] as [string, RegExp]
		);
		const out: [string | null, string][] = [];
		let plain = '';
		let i = 0;
		while (i < src.length) {
			let hit = false;
			for (const [cls, re] of rules) {
				re.lastIndex = i;
				const m = re.exec(src);
				if (m && m.index === i && m[0].length) {
					if (plain) {
						out.push([null, plain]);
						plain = '';
					}
					out.push([cls, m[0]]);
					i += m[0].length;
					hit = true;
					break;
				}
			}
			if (!hit) {
				plain += src[i];
				i++;
			}
		}
		if (plain) out.push([null, plain]);
		return out;
	}

	const wrap = (cls: string | null, text: string) =>
		cls ? `<span class="t-${cls}">${esc(text)}</span>` : esc(text);

	function highlight(src: string, language: Lang) {
		return tokenize(src, language)
			.map(([cls, text]) => wrap(cls, text))
			.join('');
	}

	/**
	 * Zeilenweises Markup — für Flash-Highlighting und Zeilennummern.
	 * Tokenisiert wird der GANZE Quelltext (nicht Zeile für Zeile), damit
	 * mehrzeilige Tokens — allen voran CSS-Blockkommentare in pattern.css —
	 * durchgehend eingefärbt bleiben; erst danach werden sie an den Zeilenumbrüchen
	 * aufgeteilt und je Zeile neu umschlossen.
	 */
	function highlightLines(src: string, language: Lang) {
		const out: string[] = [''];
		for (const [cls, text] of tokenize(src, language)) {
			const parts = text.split('\n');
			parts.forEach((part, idx) => {
				if (idx > 0) out.push('');
				if (part) out[out.length - 1] += wrap(cls, part);
			});
		}
		return out;
	}

	// Zeilenweise rendern, sobald Flash ODER Zeilennummern gebraucht werden;
	// einzeilige Snippets ohne Flash bleiben beim schlanken Ein-Block-Pfad.
	const lineCount = $derived(code.split('\n').length);
	const showNumbers = $derived(lineNumbers ?? lineCount > 1);
	const lineMode = $derived(flashKey !== undefined || showNumbers);
	const highlighted = $derived(lineMode ? '' : highlight(code, lang));
	const lines = $derived(lineMode ? highlightLines(code, lang) : []);

	// Aufleuchten: flashKey-Wechsel setzt die Zeilen „heiß", kurz darauf faden sie
	// über die CSS-Transition wieder aus. flashKey 0 = Initialzustand, kein Flash.
	let hot = $state<ReadonlySet<number>>(new Set());
	$effect(() => {
		if (!flashKey) return;
		hot = new Set(flashLines);
		const t = setTimeout(() => (hot = new Set()), 80);
		return () => clearTimeout(t);
	});

	// Collapse: erst ab deutlicher Länge kappen, sonst bringt der Klick nichts.
	const canCollapse = $derived(collapsible && lineCount > 7);
	let expanded = $state(false);
	const clipped = $derived(canCollapse && !expanded);
</script>

<figure class="code-block">
	<figcaption class="code-block__head">
		<span class="code-block__title">{title}</span>
		<CopyButton class="code-block__copy" value={code} label="Kopieren" />
	</figcaption>
	<div class="code-block__clip" class:clipped>
		{#if lineMode}
			<pre class="code-block__pre" class:code-block__pre--numbered={showNumbers}><code
					>{#each lines as line, i (i)}<span class="code-block__line" class:hot={hot.has(i)}
							>{@html line}</span
						>{/each}</code
				></pre>
		{:else}
			<pre class="code-block__pre"><code>{@html highlighted}</code></pre>
		{/if}
		{#if clipped}
			<div class="code-block__fade" aria-hidden="true"></div>
		{/if}
	</div>
	{#if canCollapse}
		<div class="code-block__expand">
			<button type="button" onclick={() => (expanded = !expanded)}>
				{expanded ? 'Code einklappen' : `Code aufklappen (${lineCount} Zeilen)`}
				<ChevronIcon
					width={10}
					height={10}
					stroke-width="2.5"
					style={expanded ? 'transform: rotate(180deg)' : undefined}
				/>
			</button>
		</div>
	{/if}
</figure>

<style>
	/*
    Theme-adaptiv: Struktur erbt z-ds-Tokens, die Syntax-Farben liegen als
    Custom-Properties auf .code-block und werden im Dark-Mode aufgehellt (Hue bleibt,
    Helligkeit steigt). So bricht der Block nicht mehr im Dark-Mode (ADR-011).
  */
	.code-block {
		/* Struktur (theme-adaptiv über Tokens) */
		--cb-bg: var(--ds-surface-raised);
		--code-block__head-bg: var(--ds-surface);
		--cb-border: var(--ds-border-soft);
		--cb-text: var(--ds-text);
		--cb-muted: var(--ds-text-muted);
		--cb-accent: var(--ds-accent);
		/* Syntax (Light) */
		--cb-comment: #6b7280;
		--cb-tag: #2563c9;
		--cb-attr: #985e00;
		--cb-string: #1a7f4b;
		--cb-number: #c0392b;
		--cb-selector: #7a3e9d;
		--cb-brace: #b91109;
		--cb-punct: #5b6068;
		/* Zeilennummern bleiben deutlich hinter dem Code zurück — Orientierung, kein Inhalt. */
		--cb-line-number: color-mix(in srgb, var(--cb-muted) 55%, transparent);
		--cb-block-gap: 18px; /* kein z-ds-Space zwischen 16 und 20 */

		margin: 0 0 var(--cb-block-gap);
		border: 1px solid var(--cb-border);
		border-radius: var(--ds-radius);
		overflow: hidden;
		background: var(--cb-bg);
		font-family: var(--ds-font-mono);
	}
	/* Der Block-Abstand trennt vom FOLGENDEN Inhalt. Steht der Code-Block am Ende
	   seines Gehäuses (z. B. als letztes Element im Playground), bliebe unten sonst
	   ein toter Streifen. */
	.code-block:last-child {
		margin-bottom: 0;
	}

	/* Syntax (Dark) — aufgehellte Varianten, gleicher Farbton.
     Der globale html-Vorfahre muss in :global(), sonst prunt Svelte den Selektor. */
	@media (prefers-color-scheme: dark) {
		:global(html:not(.color-scheme-light)) .code-block {
			--cb-comment: #8b94a3;
			--cb-tag: #7aa2f7;
			--cb-attr: #e0af68;
			--cb-string: #6ece9b;
			--cb-number: #f7768e;
			--cb-selector: #c4a7e7;
			--cb-brace: #ff8b8b;
			--cb-punct: #8b94a3;
		}
	}
	:global(html.color-scheme-dark) .code-block {
		--cb-comment: #8b94a3;
		--cb-tag: #7aa2f7;
		--cb-attr: #e0af68;
		--cb-string: #6ece9b;
		--cb-number: #f7768e;
		--cb-selector: #c4a7e7;
		--cb-brace: #ff8b8b;
		--cb-punct: #8b94a3;
	}

	.code-block__head {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: var(--z-ds-space-12);
		padding: var(--z-ds-space-8) var(--z-ds-space-12);
		border-bottom: 1px solid var(--cb-border);
		background: var(--code-block__head-bg);
	}
	.code-block__title {
		font-size: var(--ds-text-xs);
		letter-spacing: 0.06em;
		text-transform: uppercase;
		color: var(--cb-muted);
	}
	/* :global, weil die Klasse auf dem <button> der CopyButton-Komponente landet. */
	:global(.code-block__copy) {
		font-size: var(--ds-text-xs);
		color: var(--cb-accent);
		padding: var(--z-ds-space-4) var(--z-ds-space-10);
		border-radius: var(--ds-radius-sm);
		white-space: nowrap;
		transition: background-color var(--ds-dur) var(--ds-ease);
	}
	@media (hover: hover) and (pointer: fine) {
		:global(.code-block__copy:hover) {
			background: color-mix(in srgb, var(--cb-accent) 12%, transparent);
		}
	}
	.code-block__pre {
		margin: 0;
		padding: var(--z-ds-space-14) var(--z-ds-space-16);
		overflow: auto;
		font-size: var(--ds-text-sm);
		line-height: 1.6;
		color: var(--cb-text);
		/* gegen globales pre{background:…} der Doku-Seite */
		background: var(--cb-bg);
		border-radius: 0;
	}
	.code-block__pre code {
		font-family: inherit;
		white-space: pre;
	}
	/* Flash: Zeile leuchtet auf (transition: none beim Setzen) und fadet dann
	   ease-out wieder aus, sobald .hot entfernt wird. */
	/* display:block statt Newlines: white-space:pre würde inline-Zeilen nicht
	   umbrechen lassen (alle Spans in einer Zeile). min-height hält Leerzeilen offen. */
	.code-block__line {
		display: block;
		min-width: 100%;
		min-height: 1.6em;
		border-radius: 3px;
		transition: background-color 0.45s var(--ds-ease-out);
	}
	/* Zeilennummern-Rinne — reine Generated Content (::before), damit Kopieren (Button
	   wie Text-Selektion) NUR den Code liefert. Der Counter läuft auf dem <code>-Element,
	   nicht auf dem <pre>: so zählt er auch nach einem Re-Render sauber ab 1.
	   A11y-Hinweis: Pseudo-Element-Inhalt lässt sich nicht per aria-hidden ausblenden
	   (es gibt kein Element). Die Nummern sind daher bewusst Generated Content mit
	   `user-select: none` — kein zusätzlicher Fokus-/Tab-Stopp, kein kopierbarer Text. */
	.code-block__pre--numbered code {
		counter-reset: code-line;
	}
	.code-block__pre--numbered .code-block__line::before {
		counter-increment: code-line;
		content: counter(code-line);
		display: inline-block;
		width: 2.5ch;
		margin-right: var(--z-ds-space-12);
		text-align: right;
		color: var(--cb-line-number);
		user-select: none;
		-webkit-user-select: none;
	}
	.code-block__line.hot {
		background-color: color-mix(in srgb, var(--cb-accent) 18%, transparent);
		transition: none;
	}
	/* Collapse: auf ~4 Zeilen gekappt, Fade-out-Gradient zeigt „da ist mehr". */
	.code-block__clip {
		position: relative;
	}
	.code-block__clip.clipped .code-block__pre {
		max-height: calc(4 * 1.6em + var(--z-ds-space-14));
		overflow: hidden;
	}
	.code-block__fade {
		position: absolute;
		inset: auto 0 0 0;
		height: 44px;
		background: linear-gradient(transparent, var(--cb-bg));
		pointer-events: none;
	}
	.code-block__expand {
		display: flex;
		justify-content: center;
		border-top: 1px solid var(--cb-border);
	}
	.code-block__expand button {
		display: inline-flex;
		align-items: center;
		gap: 6px;
		border: none;
		background: none;
		font-family: 'TabletGothic', 'Helvetica Neue', Helvetica, Arial, sans-serif;
		font-size: var(--ds-text-xs);
		color: var(--cb-muted);
		cursor: pointer;
		padding: var(--z-ds-space-6) var(--z-ds-space-12);
		width: 100%;
		justify-content: center;
		transition: color var(--ds-dur) var(--ds-ease);
	}
	/* Chevron liegt in einer Kind-Komponente → :global, sonst greift das Scoping nicht. */
	.code-block__expand button :global(svg) {
		transition: transform var(--ds-dur) var(--ds-ease-out);
	}
	@media (hover: hover) and (pointer: fine) {
		.code-block__expand button:hover {
			color: var(--cb-text);
			background: color-mix(in srgb, var(--cb-muted) 8%, transparent);
		}
	}
	.code-block__expand button:focus-visible {
		outline: 2px solid var(--ds-focus-ring);
		outline-offset: -2px;
	}
	@media (prefers-reduced-motion: reduce) {
		.code-block__line,
		.code-block__expand button :global(svg) {
			transition: none;
		}
	}
	.code-block__pre :global(.t-comment) {
		color: var(--cb-comment);
		font-style: italic;
	}
	.code-block__pre :global(.t-tag) {
		color: var(--cb-tag);
	}
	.code-block__pre :global(.t-attr) {
		color: var(--cb-attr);
	}
	.code-block__pre :global(.t-string) {
		color: var(--cb-string);
	}
	.code-block__pre :global(.t-property) {
		color: var(--cb-tag);
	}
	.code-block__pre :global(.t-func) {
		color: var(--cb-attr);
	}
	.code-block__pre :global(.t-number) {
		color: var(--cb-number);
	}
	.code-block__pre :global(.t-selector) {
		color: var(--cb-selector);
	}
	.code-block__pre :global(.t-brace) {
		color: var(--cb-brace);
	}
	.code-block__pre :global(.t-punct) {
		color: var(--cb-punct);
	}
</style>
