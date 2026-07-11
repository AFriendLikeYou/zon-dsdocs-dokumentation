<script lang="ts">
	import type { A11yItem } from '$data/a11y-issues';

	let { issues }: { issues: A11yItem[] } = $props();

	let search = $state('');

	let openCategories = $state<{ [category: string]: boolean }>({
		'Status Messages': true,
		Forms: true,
		'Form Validation': false,
		Meta: false
	});

	/** Filter issues by search (title, description, solution, label, category) */
	const filteredIssues = $derived(() =>
		issues.filter((issue) =>
			[issue.title, issue.description, issue.solution, issue.label, issue.category]
				.filter(Boolean)
				.some((str) => str.toLowerCase().includes(search.toLowerCase()))
		)
	);

	/** Group issues by category */
	const groupedIssues = $derived(() => {
		const map = new Map<string, A11yItem[]>();
		for (const issue of filteredIssues()) {
			if (!map.has(issue.category)) map.set(issue.category, []);
			map.get(issue.category)!.push(issue);
		}
		return map;
	});

	function toggleCategory(category: string) {
		openCategories[category] = !openCategories[category];
	}

	/** Small visual chip for label */
	function getLabelChip(label: A11yItem['label']) {
		const text = label === 'issue' ? 'Issue' : 'Good practice';
		const cls = label === 'issue' ? 'chip--issue' : 'chip--good';
		return `<span class="chip ${cls}" aria-label="${text}">${text}</span>`;
	}

	function getCategoryIcon(category: string): string {
		switch (category.toLowerCase()) {
			case 'screen reader':
				return `
				<svg aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="18" height="18"
					viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
					stroke-linecap="round" stroke-linejoin="round">
					<rect width="7" height="12" x="2" y="6" rx="1"/>
					<path d="M13 8.32a7.43 7.43 0 0 1 0 7.36"/>
					<path d="M16.46 6.21a11.76 11.76 0 0 1 0 11.58"/>
					<path d="M19.91 4.1a15.91 15.91 0 0 1 .01 15.8"/>
				</svg>
			`;
			case 'focus management':
				return `
				<svg aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="18" height="18"
					viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
					stroke-linecap="round" stroke-linejoin="round">
					<circle cx="12" cy="12" r="3"/>
					<path d="M3 7V5a2 2 0 0 1 2-2h2"/>
					<path d="M17 3h2a2 2 0 0 1 2 2v2"/>
					<path d="M21 17v2a2 2 0 0 1-2 2h-2"/>
					<path d="M7 21H5a2 2 0 0 1-2-2v-2"/>
				</svg>
			`;
			case 'color':
				return `
				<svg aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="18" height="18"
					viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
					stroke-linecap="round" stroke-linejoin="round">
					<path d="M12 22a1 1 0 0 1 0-20 10 9 0 0 1 10 9 5 5 0 0 1-5 5h-2.25a1.75 1.75 0 0 0-1.4 2.8l.3.4a1.75 1.75 0 0 1-1.4 2.8z"/>
					<circle cx="13.5" cy="6.5" r=".5" fill="currentColor"/>
					<circle cx="17.5" cy="10.5" r=".5" fill="currentColor"/>
					<circle cx="6.5" cy="12.5" r=".5" fill="currentColor"/>
					<circle cx="8.5" cy="7.5" r=".5" fill="currentColor"/>
				</svg>
			`;
			default:
				return '';
		}
	}

	/**
	 * Highlights the search term in the given HTML string with <mark>, preserving existing HTML structure.
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
		<input
			type="text"
			placeholder="Search issues…"
			value={search}
			oninput={(e) => (search = (e.target as HTMLInputElement).value)}
		/>
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

									<!-- Label chip -->
									<span
										class={`accordion__label chip ${issue.label === 'issue' ? 'chip--issue' : 'chip--good'}`}
										aria-live="polite"
									>
										{@html getLabelChip(issue.label)}
									</span>

									<!-- Links (WCAG / GitHub) -->
									<div class="accordion__links" role="group" aria-label="Reference links">
										{#if issue.links?.wcag}
											<a
												class="link--wcag"
												aria-label="Open related WCAG Understanding page in new tab"
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
												aria-label="Open related GitHub reference in new tab"
												href={issue.links.github}
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
													class="lucide lucide-github-icon lucide-github"
													><path
														d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4"
													/><path d="M9 18c-4.51 2-5-2-7-2" /></svg
												>
												<span class="sr-only">GitHub</span>
											</a>
										{/if}
									</div>
								</header>

								<p class="accordion__description">{@html highlightHTML(issue.description)}</p>

								<p class="accordion__solution">
									<strong>Solution:</strong>
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
	.search-bar {
		margin-bottom: 1rem;
	}
	.search-bar input {
		width: 100%;
		padding: 0.5rem;
		font-size: 1rem;
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
