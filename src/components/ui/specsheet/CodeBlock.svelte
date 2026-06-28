<!-- CodeBlock.svelte — Code-Snippet mit Copy-Button + leichter Syntax-Hervorhebung. -->
<script>
  export let title = '';
  export let code = '';
  /** @type {'html' | 'css' | 'svelte'} */
  export let lang = 'html';

  let copied = false;
  /** @type {ReturnType<typeof setTimeout> | undefined} */
  let timer;

  function copy() {
    navigator.clipboard?.writeText(code);
    copied = true;
    clearTimeout(timer);
    timer = setTimeout(() => (copied = false), 1500);
  }

  /** @param {string} s */
  const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

  /** @type {Record<'html' | 'css' | 'svelte', [string, RegExp][]>} */
  const GRAMMAR = {
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

  /** @param {string} src @param {'html' | 'css' | 'svelte'} language */
  function highlight(src, language) {
    const rules = (GRAMMAR[language] ?? []).map(
      ([cls, re]) => /** @type {[string, RegExp]} */ ([cls, new RegExp(re.source, 'y')])
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

  $: highlighted = highlight(code, lang);
</script>

<figure class="cb">
  <figcaption class="cb-head">
    <span class="cb-title">{title}</span>
    <button type="button" class="cb-copy" on:click={copy}>{copied ? 'Kopiert ✓' : 'Kopieren'}</button>
  </figcaption>
  <pre class="cb-pre"><code>{@html highlighted}</code></pre>
</figure>

<style>
  .cb {
    margin: 0 0 18px;
    border: 1px solid #e6e8ec;
    border-radius: 10px;
    overflow: hidden;
    background: #fbfbfc;
    font-family: ui-monospace, 'SF Mono', 'JetBrains Mono', Menlo, monospace;
  }
  .cb-head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    padding: 8px 12px;
    border-bottom: 1px solid #e6e8ec;
    background: #f4f5f6;
  }
  .cb-title {
    font-size: 11px;
    letter-spacing: 0.06em;
    text-transform: uppercase;
    color: #5b6068;
  }
  .cb-copy {
    all: unset;
    cursor: pointer;
    font-size: 11px;
    color: #2563c9;
    padding: 4px 9px;
    border-radius: 6px;
    white-space: nowrap;
  }
  .cb-copy:hover {
    background: #e8eefb;
  }
  .cb-copy:focus-visible {
    outline: 2px solid #2563c9;
    outline-offset: 2px;
  }
  .cb-pre {
    margin: 0;
    padding: 14px 16px;
    overflow: auto;
    font-size: 12.5px;
    line-height: 1.6;
    color: #16181d;
    /* gegen globales pre{background:…} der Doku-Seite — Code-Theme bleibt hell */
    background: #fbfbfc;
    border-radius: 0;
  }
  .cb-pre code {
    font-family: inherit;
    white-space: pre;
  }
  .cb-pre :global(.t-comment) { color: #6b7280; font-style: italic; }
  .cb-pre :global(.t-tag) { color: #2563c9; }
  .cb-pre :global(.t-attr) { color: #985e00; }
  .cb-pre :global(.t-string) { color: #1a7f4b; }
  .cb-pre :global(.t-property) { color: #2563c9; }
  .cb-pre :global(.t-func) { color: #985e00; }
  .cb-pre :global(.t-number) { color: #c0392b; }
  .cb-pre :global(.t-selector) { color: #7a3e9d; }
  .cb-pre :global(.t-brace) { color: #b91109; }
  .cb-pre :global(.t-punct) { color: #5b6068; }
</style>
