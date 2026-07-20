<!--
  IssuesList.svelte — durchsuchbare, nach Kategorie gruppierte A11y-Issue-Liste
  (Akkordeon je Kategorie, Issue/Good-practice-Chips). Genau ein Consumer:
  /brand/accessibility/issues; Daten aus $data/a11y-issues.
-->
<script lang="ts">
	import type { A11yItem } from '$data/a11y-issues';
	import { Field } from '$components/ui/field';
	import { GithubIcon, SearchIcon } from '$lib/icons';

	let {
		/** A11y-Einträge (Kategorie, Titel, Beschreibung, Lösung, Links). */
		issues
	}: { issues: A11yItem[] } = $props();

	type Category = A11yItem['category'];

	/** Alle Kategorien in Erst-Auftritts-Reihenfolge (einmaliger Snapshot). */
	function categoriesInOrder(items: A11yItem[]): Category[] {
		return [...new Set(items.map((issue) => issue.category))];
	}

	let search = $state('');

	// Initialzustand aus den Daten abgeleitet (nicht hartkodiert): die erste
	// vorkommende Kategorie ist offen, alle weiteren zu.
	let openCategories = $state<Partial<Record<Category, boolean>>>(
		Object.fromEntries(categoriesInOrder(issues).map((category, index) => [category, index === 0]))
	);

	/** Filtert die Einträge über die Suche (Titel, Beschreibung, Lösung, Label, Kategorie). */
	const filteredIssues = $derived(() =>
		issues.filter((issue) =>
			[issue.title, issue.description, issue.solution, issue.label, issue.category]
				.filter(Boolean)
				.some((str) => str.toLowerCase().includes(search.toLowerCase()))
		)
	);

	/** Gruppiert die Einträge nach Kategorie. */
	const groupedIssues = $derived(() => {
		const map = new Map<Category, A11yItem[]>();
		for (const issue of filteredIssues()) {
			if (!map.has(issue.category)) map.set(issue.category, []);
			map.get(issue.category)!.push(issue);
		}
		return map;
	});

	function toggleCategory(category: Category) {
		openCategories[category] = !openCategories[category];
	}

	/** Sichtbarer Text des Label-Chips (reiner Text, kein String-HTML). */
	function getLabelText(label: A11yItem['label']): string {
		return label === 'issue' ? 'Issue' : 'Good practice';
	}

	/** Modifier-Klasse des Label-Chips. */
	function getLabelChipClass(label: A11yItem['label']): string {
		return label === 'issue' ? 'chip--issue' : 'chip--good';
	}

	// Ein Icon je Kategorie — als Record über den Kategorie-Typ, damit TypeScript
	// Drift meldet, sobald a11y-issues.ts eine Kategorie ergänzt/umbenennt.
	const CATEGORY_ICONS: Record<Category, string> = {
		'Status Messages': `
			<svg aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="18" height="18"
				viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
				stroke-linecap="round" stroke-linejoin="round">
				<path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
				<path d="M12 7v4"/><path d="M12 15h.01"/>
			</svg>
		`,
		Forms: `
			<svg aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="18" height="18"
				viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
				stroke-linecap="round" stroke-linejoin="round">
				<rect width="8" height="4" x="8" y="2" rx="1" ry="1"/>
				<path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/>
				<path d="M12 11h4"/><path d="M12 16h4"/><path d="M8 11h.01"/><path d="M8 16h.01"/>
			</svg>
		`,
		'Form Validation': `
			<svg aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="18" height="18"
				viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
				stroke-linecap="round" stroke-linejoin="round">
				<path d="M21.801 10A10 10 0 1 1 17 3.335"/><path d="m9 11 3 3L22 4"/>
			</svg>
		`,
		'Screen Reader': `
			<svg aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="18" height="18"
				viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
				stroke-linecap="round" stroke-linejoin="round">
				<rect width="7" height="12" x="2" y="6" rx="1"/>
				<path d="M13 8.32a7.43 7.43 0 0 1 0 7.36"/>
				<path d="M16.46 6.21a11.76 11.76 0 0 1 0 11.58"/>
				<path d="M19.91 4.1a15.91 15.91 0 0 1 .01 15.8"/>
			</svg>
		`,
		Meta: `
			<svg aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="18" height="18"
				viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
				stroke-linecap="round" stroke-linejoin="round">
				<circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/>
			</svg>
		`
	};

	function getCategoryIcon(category: Category): string {
		return CATEGORY_ICONS[category] ?? '';
	}

	/**
	 * Hebt den Suchbegriff im übergebenen HTML mit <mark> hervor — die vorhandene
	 * HTML-Struktur bleibt dabei erhalten.
	 */
	function highlightHTML(html: string): string {
		if (!search.trim()) return html;

		const parser = new DOMParser();
		const doc = parser.parseFromString(`<div>${html}</div>`, 'text/html');
		const div = doc.body.firstChild as HTMLElement;

		const walk = (node: Node) => {
			if (node.nodeType === Node.TEXT_NODE) {
				const text = node.textContent!;
				const regex = new RegExp(`(${escapeRegExp(search)})`, 'gi');
				if (regex.test(text)) {
					const frag = document.createDocumentFragment();
					let lastIndex = 0;

					text.replace(regex, (match, _p1, offset) => {
						if (offset > lastIndex) {
							frag.appendChild(document.createTextNode(text.slice(lastIndex, offset)));
						}
						const mark = document.createElement('mark');
						mark.textContent = match;
						frag.appendChild(mark);
						lastIndex = offset + match.length;
						return match;
					});

					if (lastIndex < text.length) {
						frag.appendChild(document.createTextNode(text.slice(lastIndex)));
					}

					node.parentNode!.replaceChild(frag, node);
				}
			} else if (node.nodeType === Node.ELEMENT_NODE) {
				node.childNodes.forEach(walk);
			}
		};

		walk(div);

		return div.innerHTML;
	}

	function escapeRegExp(string: string) {
		return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
	}
</script>

<section class="faq__section">
	<div class="search-bar">
		<Field
			bind:value={search}
			type="text"
			placeholder="Themen durchsuchen…"
			aria-label="Themen durchsuchen"
		>
			{#snippet icon()}<SearchIcon width={18} height={18} />{/snippet}
		</Field>
	</div>

	<div class="faq__inner">
		{#each Array.from(groupedIssues()) as [category, items]}
			<div class="accordion">
				<!-- Header -->
				<h2>
					<button
						class="accordion__header"
						aria-expanded={openCategories[category] ? 'true' : 'false'}
						aria-controls={`content-${category}`}
						onclick={() => toggleCategory(category)}
					>
						<div class="faq__question">
							<span class="faq__question__icon badge" aria-hidden="true">
								{@html getCategoryIcon(category)}
							</span>

							<span>{category}</span>
						</div>
						<svg
							width="14"
							height="14"
							viewBox="0 0 14 14"
							fill="none"
							xmlns="http://www.w3.org/2000/svg"
							style="transform: rotate({openCategories[category] ? '180deg' : '0deg'});"
							aria-hidden="true"
						>
							<path d="M13 4L7 10L1 4" stroke="currentColor" stroke-width="1.5" />
						</svg>
					</button>
				</h2>

				<!-- Content -->
				<div
					id={`content-${category}`}
					class="accordion__content faq__content"
					class:open={openCategories[category]}
					inert={!openCategories[category]}
				>
					<div class="accordion__inner">
						{#each items as issue}
							<article class="issue">
								<header class="accordion__title">
									<svg
										aria-hidden="true"
										xmlns="http://www.w3.org/2000/svg"
										width="18"
										height="18"
										viewBox="0 0 24 24"
										fill="none"
										stroke="currentColor"
										stroke-width="2"
										stroke-linecap="round"
										stroke-linejoin="round"
										><circle cx="12" cy="12" r="10" /><circle cx="12" cy="12" r="1" /></svg
									>
									<h3>{@html highlightHTML(issue.title)}</h3>

									<!-- Label chip (ein einzelnes Span, reiner Text — kein String-HTML) -->
									<span class="accordion__label chip {getLabelChipClass(issue.label)}">
										{getLabelText(issue.label)}
									</span>

									<!-- Links (WCAG / GitHub) -->
									<div class="accordion__links" role="group" aria-label="Weiterführende Links">
										{#if issue.links?.wcag}
											<a
												class="link--wcag"
												aria-label="Zugehörige WCAG-Understanding-Seite in neuem Tab öffnen"
												href={issue.links.wcag}
												target="_blank"
												rel="noopener noreferrer"
											>
												<svg
													aria-hidden="true"
													xmlns="http://www.w3.org/2000/svg"
													width="18"
													height="18"
													viewBox="0 0 24 24"
													fill="none"
													stroke="currentColor"
													stroke-width="2"
													stroke-linecap="round"
													stroke-linejoin="round"
													><path d="M12 7v14" /><path d="M16 12h2" /><path d="M16 8h2" /><path
														d="M3 18a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1h5a4 4 0 0 1 4 4 4 4 0 0 1 4-4h5a1 1 0 0 1 1 1v13a1 1 0 0 1-1 1h-6a3 3 0 0 0-3 3 3 3 0 0 0-3-3z"
													/><path d="M6 12h2" /><path d="M6 8h2" /></svg
												>
											</a>
										{/if}
										{#if issue.links?.github}
											<a
												class="link--github"
												aria-label="Zugehörige GitHub-Referenz in neuem Tab öffnen"
												href={issue.links.github}
												target="_blank"
												rel="noopener noreferrer"
											>
												<GithubIcon width={18} height={18} />
												<span class="sr-only">GitHub</span>
											</a>
										{/if}
									</div>
								</header>

								<p class="accordion__description">{@html highlightHTML(issue.description)}</p>

								<p class="accordion__solution">
									<strong>Lösung:</strong>
									{@html highlightHTML(issue.solution)}
								</p>

								{#if issue.img}
									<img src={issue.img} alt={issue.title} />
								{/if}
							</article>
						{/each}
					</div>
				</div>
			</div>
		{/each}
	</div>
</section>

<style>
	/* Nur Layout — Fläche, Kontur und Fokus-Ring bringt das Field-Atom mit (K11). */
	.search-bar {
		margin-bottom: var(--z-ds-space-16);
	}

	.issue {
		margin-bottom: 1rem;
		padding-left: 1.5rem;
		border-left: 2px solid var(--ds-border);
	}

	:global(mark) {
		border: 1px solid var(--ds-accent);
		padding: 0.1rem 0.4rem;
		margin: 0 0.25rem;
		border-radius: 0.2rem;
	}

	.accordion__title {
		display: flex;
		align-items: center;
		gap: var(--z-ds-space-xs);
	}

	.accordion h3 {
		margin-block: 0;
		font-size: var(--ds-text-sm);
	}

	.accordion__description {
		margin-block: var(--z-ds-space-xs);
		font-size: var(--ds-text-sm);
		color: var(--ds-text-body);
	}

	.accordion__solution {
		margin-block: var(--z-ds-space-xs);
		font-size: var(--ds-text-sm);
		color: var(--ds-text-body);
	}

	.accordion__links {
		display: inline-flex;
		gap: 0.5rem;
	}

	.accordion__links a {
		text-decoration: underline;
		display: inline-flex;
		align-items: center;
	}

	@media (hover: hover) and (pointer: fine) {
		.accordion__links a:hover {
			color: var(--ds-accent-brand);
		}
	}

	.accordion__links a:focus-visible {
		color: var(--ds-accent-brand);
	}

	.accordion svg {
		transition: transform var(--ds-dur) var(--ds-ease-out);
	}

	.accordion__header {
		padding: 0;
		border: none;
		opacity: 0.8;
		transition: opacity var(--ds-dur) var(--ds-ease);
	}

	@media (hover: hover) and (pointer: fine) {
		.accordion__header:hover {
			opacity: 1;
		}
	}

	.accordion__header:focus-visible {
		opacity: 1;
	}

	/* Akkordeon via grid-template-rows statt height-Animation (kein Layout-Trigger,
	   unterbrechbar) — gleiches Muster wie MenuCollapsible. Scroll übernimmt __inner. */
	.accordion__content {
		display: grid;
		grid-template-rows: 0fr;
		transition: grid-template-rows var(--ds-dur-slow) var(--ds-ease-out);
	}

	.accordion__content.open {
		grid-template-rows: 1fr;
	}

	.accordion__inner {
		min-height: 0;
		max-height: 250px;
		overflow-y: auto;
		display: flex;
		flex-direction: column;
		gap: var(--z-ds-space-xs);
		padding-right: var(--z-ds-space-m);
		opacity: 0;
		transition: opacity var(--ds-dur) var(--ds-ease);
	}

	.accordion__content.open .accordion__inner {
		opacity: 1;
	}

	@media (prefers-reduced-motion: reduce) {
		.accordion__content,
		.accordion svg {
			transition: none;
		}
	}

	.faq__section .accordion__header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		width: 100%;
		background-color: transparent;
		text-align: left;
		cursor: pointer;
		color: var(--ds-text); /* vorher: nicht existentes --z-ds-general-color-black-100 */
	}

	.faq__section {
		display: flex;
		width: 100%;
		flex-direction: column;
		justify-content: center;
		padding: var(--z-ds-space-s) 0 var(--z-ds-space-56);
	}

	.faq__question {
		font-size: var(--ds-text-xl);
		font-weight: 700;
		display: flex;
		align-items: center;
		gap: var(--z-ds-space-8);
	}

	.faq__question__icon {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		border-radius: 50%;
		padding: 0.25rem;
		background-color: var(--ds-accent);
		color: var(--ds-surface);
	}

	/* Abstand nur im offenen Zustand (zu = kompakt, wie vorher mit display:none) */
	.faq__content {
		margin-block: 0;
	}

	.faq__content.open {
		margin-block: var(--z-ds-space-12);
	}

	/* Label chip styles */
	.chip {
		display: inline-flex;
		align-items: center;
		padding: 0 0.5rem;
		border-radius: 999px;
		font-size: 12px;
		line-height: 22px;
		border: 1px solid currentColor;
	}

	.chip--issue {
		background-color: var(--ds-surface-sunken);
		color: var(--ds-text); /* vorher: nicht existentes --z-ds-color-text-0 */
	}

	.sr-only {
		position: absolute;
		width: 1px;
		height: 1px;
		padding: 0;
		margin: -1px;
		overflow: hidden;
		clip: rect(0, 0, 0, 0);
		white-space: nowrap;
		border: 0;
	}
</style>
