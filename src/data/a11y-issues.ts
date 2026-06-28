/**
 * Accessibility catalog item.
 */
export interface A11yItem {
	/** Short, scannable title */
	title: string;
	/** What’s happening / why it matters */
	description: string;
	/** Practical fix or mitigation (can include HTML/ARIA snippets) */
	solution: string;
	/** Classify whether this is an "issue" to fix or a "good-practice" to adopt */
	label: 'issue' | 'good-practice';
	/** Thematic area to help grouping & filtering */
	category: 'Status Messages' | 'Forms' | 'Form Validation' | 'Screen Reader' | 'Meta';
	/** Deep links for further reading and/or code refs */
	links: {
		wcag?: string; // Prefer WCAG Understanding pages
		github?: string; // Point to the relevant line/PR when known
	};
	/** Optional preview image or diagram if you want to add later */
	img?: string;
}

/**
 * Curated list of A11Y issues & practices.
 */
export const A11Y_ITEMS: A11yItem[] = [
	{
		title: 'Live region updates not announced on reload',
		description:
			'On page reload or immediate render, screen readers may miss aria-live changes if the update happens before assistive tech finishes initializing.',
		solution:
			'Render the live region empty first, then update its text after a short delay (~500ms). Prefer <code>role="status"</code> (polite) or <code>aria-live="polite"</code> for non-critical info; use <code>aria-live="assertive"</code> or <code>role="alert"</code> only for urgent messages.',
		label: 'issue',
		category: 'Status Messages',
		links: {
			wcag: 'https://www.w3.org/WAI/WCAG22/Understanding/status-messages.html',
			github:
				'https://github.com/ZeitOnline/login/blob/main/src/zeit-online-theme/src/main/resources/themes/zeit-online-public/login/resources/js/script.js#L22' // add repo/line when available
		}
	},
	{
		title: 'Error message not associated with its field',
		description:
			'Screen reader users do not hear which field an error belongs to because the error text is not programmatically tied to the input.',
		solution:
			'Give the error element an <code>id</code> and reference it from the input with <code>aria-describedby</code>. Optionally use <code>aria-errormessage</code> together with <code>aria-invalid="true"</code> for clearer semantics.',
		label: 'issue',
		category: 'Forms',
		links: {
			wcag: 'https://www.w3.org/WAI/WCAG22/Understanding/error-identification.html',
			github:
				'https://github.com/ZeitOnline/login/blob/main/src/zeit-online-theme/src/main/resources/themes/zeit-online-public/login/login.ftl#L48'
		}
	},
	{
		title: 'Error messages are not read immediately',
		description:
			'When validation fails, assistive tech does not announce the new error text right away.',
		solution:
			'Place errors in a live region. For critical validation, use <code>role="alert"</code> or <code>aria-live="assertive"</code>. Initialize the region empty so that setting its text constitutes a detectable change.',
		label: 'issue',
		category: 'Status Messages',
		links: {
			wcag: 'https://www.w3.org/WAI/WCAG22/Understanding/status-messages.html',
			github:
				'https://github.com/ZeitOnline/login/blob/main/src/zeit-online-theme/src/main/resources/themes/zeit-online-public/login/resources/js/script.js#L38'
		}
	},
	{
		title: 'Invalid fields not marked programmatically',
		description:
			'Inputs that fail validation aren’t flagged for assistive tech, so users can’t quickly locate errors.',
		solution:
			'Set <code>aria-invalid="true"</code> on fields that fail validation. Optionally pair with <code>aria-errormessage</code> pointing to the error text.',
		label: 'issue',
		category: 'Forms',
		links: {
			wcag: 'https://www.w3.org/WAI/WCAG22/Understanding/error-identification.html',
			github:
				'https://github.com/ZeitOnline/login/blob/main/src/zeit-online-theme/src/main/resources/themes/zeit-online-public/login/resources/js/script.js#L84'
		}
	},
	{
		title: 'Provide an error summary for large forms',
		description:
			'When multiple fields are invalid, users need a quick overview and a way to jump to each problem.',
		solution:
			'Render an error summary at the top (after the main heading), move focus to it after submit, list each error as a link that anchors to its field, and keep per-field errors in place.',
		label: 'good-practice',
		category: 'Form Validation',
		links: {
			wcag: 'https://www.w3.org/WAI/WCAG22/Understanding/error-suggestion.html',
			github: ''
		}
	},
	{
		title: 'Reflect errors in the document title',
		description:
			'Users switching tabs (or using screen readers) benefit when the page title signals that validation failed.',
		solution:
			'On validation failure, update <code>document.title</code> to include an error indicator and (optionally) the number of errors, e.g., <code>"(3) Errors — Checkout"</code>. Keep it concise.',
		label: 'good-practice',
		category: 'Meta',
		links: {
			wcag: 'https://www.w3.org/WAI/WCAG22/Understanding/page-titled.html',
			github: ''
		}
	}
];
