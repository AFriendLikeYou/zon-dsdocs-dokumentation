<!-- CodeBlock.svelte — Code-Snippet mit Copy-Button + leichter Syntax-Hervorhebung. -->
<script lang="ts">
	import { CopyButton } from '$components/ui/copy-button';

	type Lang = 'html' | 'css' | 'svelte';
	let {
		title = '',
		code = '',
		lang = 'html'
	}: { title?: string; code?: string; lang?: Lang } = $props();

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
		]
	};

	function highlight(src: string, language: Lang) {
		const rules = (GRAMMAR[language] ?? []).map(
			([cls, re]) => [cls, new RegExp(re.source, 'y')] as [string, RegExp]
		);
		let out = '';
		let i = 0;
		while (i < src.length) {
			let hit = false;
			for (const [cls, re] of rules) {
				re.lastIndex = i;
				const m = re.exec(src);
				if (m && m.index === i && m[0].length) {
					out += `<span class="t-${cls}">${esc(m[0])}</span>`;
					i += m[0].length;
					hit = true;
					break;
				}
			}
			if (!hit) {
				out += esc(src[i]);
				i++;
			}
		}
		return out;
	}

	const highlighted = $derived(highlight(code, lang));
</script>

<figure class="cb">
	<figcaption class="cb-head">
		<span class="cb-title">{title}</span>
		<CopyButton class="cb-copy" value={code} label="Kopieren" />
	</figcaption>
	<pre class="cb-pre"><code>{@html highlighted}</code></pre>
</figure>

<style>
	/*
    Theme-adaptiv: Struktur erbt z-ds-Tokens, die Syntax-Farben liegen als
    Custom-Properties auf .cb und werden im Dark-Mode aufgehellt (Hue bleibt,
    Helligkeit steigt). So bricht der Block nicht mehr im Dark-Mode (ADR-011).
  */
	.cb {
		/* Struktur (theme-adaptiv über Tokens) */
		--cb-bg: var(--ds-surface-raised);
		--cb-head-bg: var(--ds-surface);
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
		--cb-block-gap: 18px; /* kein z-ds-Space zwischen 16 und 20 */

		margin: 0 0 var(--cb-block-gap);
		border: 1px solid var(--cb-border);
		border-radius: var(--ds-radius);
		overflow: hidden;
		background: var(--cb-bg);
		font-family: var(--ds-font-mono);
	}

	/* Syntax (Dark) — aufgehellte Varianten, gleicher Farbton.
     Der globale html-Vorfahre muss in :global(), sonst prunt Svelte den Selektor. */
	@media (prefers-color-scheme: dark) {
		:global(html:not(.color-scheme-light)) .cb {
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
	:global(html.color-scheme-dark) .cb {
		--cb-comment: #8b94a3;
		--cb-tag: #7aa2f7;
		--cb-attr: #e0af68;
		--cb-string: #6ece9b;
		--cb-number: #f7768e;
		--cb-selector: #c4a7e7;
		--cb-brace: #ff8b8b;
		--cb-punct: #8b94a3;
	}

	.cb-head {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: var(--z-ds-space-12);
		padding: var(--z-ds-space-8) var(--z-ds-space-12);
		border-bottom: 1px solid var(--cb-border);
		background: var(--cb-head-bg);
	}
	.cb-title {
		font-size: var(--ds-text-xs);
		letter-spacing: 0.06em;
		text-transform: uppercase;
		color: var(--cb-muted);
	}
	/* :global, weil die Klasse auf dem <button> der CopyButton-Komponente landet. */
	:global(.cb-copy) {
		font-size: var(--ds-text-xs);
		color: var(--cb-accent);
		padding: var(--z-ds-space-4) var(--z-ds-space-10);
		border-radius: var(--ds-radius-sm);
		white-space: nowrap;
		transition: background-color var(--ds-dur) var(--ds-ease);
	}
	@media (hover: hover) and (pointer: fine) {
		:global(.cb-copy:hover) {
			background: color-mix(in srgb, var(--cb-accent) 12%, transparent);
		}
	}
	.cb-pre {
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
	.cb-pre code {
		font-family: inherit;
		white-space: pre;
	}
	.cb-pre :global(.t-comment) {
		color: var(--cb-comment);
		font-style: italic;
	}
	.cb-pre :global(.t-tag) {
		color: var(--cb-tag);
	}
	.cb-pre :global(.t-attr) {
		color: var(--cb-attr);
	}
	.cb-pre :global(.t-string) {
		color: var(--cb-string);
	}
	.cb-pre :global(.t-property) {
		color: var(--cb-tag);
	}
	.cb-pre :global(.t-func) {
		color: var(--cb-attr);
	}
	.cb-pre :global(.t-number) {
		color: var(--cb-number);
	}
	.cb-pre :global(.t-selector) {
		color: var(--cb-selector);
	}
	.cb-pre :global(.t-brace) {
		color: var(--cb-brace);
	}
	.cb-pre :global(.t-punct) {
		color: var(--cb-punct);
	}
</style>
