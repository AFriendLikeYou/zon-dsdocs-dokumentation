import type { Icon } from '$types/global';

export const uppercaseFirstLetter = (str: string) => {
	return str.charAt(0).toUpperCase() + str.slice(1);
};

/**
 * Erzeugt einen URL-tauglichen Slug aus einem beliebigen Text — eine gemeinsame
 * Implementierung für Heading-Anker (TableOfContents + AnchorLinks). Deutsche
 * Umlaute werden ausgeschrieben, übrige Diakritika entfernt, Rest zu Bindestrichen.
 */
export function slugify(text: string): string {
	return text
		.trim()
		.toLowerCase()
		.replace(/ä/g, 'ae')
		.replace(/ö/g, 'oe')
		.replace(/ü/g, 'ue')
		.replace(/ß/g, 'ss')
		.normalize('NFD')
		.replace(/[̀-ͯ]/g, '')
		.replace(/[^a-z0-9]+/g, '-')
		.replace(/^-+|-+$/g, '');
}

/**
 * Löst einen CSS-Custom-Property-Wert live gegen :root auf (nur im Browser).
 * Bündelt das getComputedStyle(document.documentElement)-Muster, das mehrere
 * Token-/Farb-Komponenten teilen — liest den aufgelösten Wert aus dem geladenen
 * styles-zds.css (kein Drift zum Upstream-Paket).
 *
 * @param name - CSS-Variablenname, mit oder ohne umschließendes `var( … )`.
 * @returns Getrimmter Wert; '' außerhalb des Browsers oder wenn ungesetzt.
 */
export function resolveCssVar(name: string): string {
	if (typeof window === 'undefined') return '';
	const varName = name.replace(/^var\(\s*|\s*\)$/g, '');
	return getComputedStyle(document.documentElement).getPropertyValue(varName).trim();
}

export const downloadIcon = (icon: Icon) => {
	if (!icon.svg) return;
	const element = document.createElement('a');
	const file = new Blob([icon.svg], { type: 'image/svg+xml' });
	element.href = URL.createObjectURL(file);
	element.download = `${icon.slug}.svg`;
	document.body.appendChild(element);
	element.click();
};

export async function copySVGToClipboard(icon: Icon) {
	try {
		const svg = icon.svg;
		await navigator.clipboard.writeText(svg as string);
	} catch (err) {
		console.error('Fehler beim Kopieren:', err);
	}
}

/**
 * Creates a debounced version of a function, which delays its invocation
 * until after `delay` milliseconds have elapsed since the last call.
 *
 * @param func - The function to debounce.
 * @param delay - The number of milliseconds to delay.
 * @returns A debounced function with the same parameters.
 */
export function debounce<Args extends unknown[]>(
	func: (...args: Args) => void,
	delay: number
): (...args: Args) => void {
	let timer: ReturnType<typeof setTimeout>;

	return (...args: Args) => {
		clearTimeout(timer);
		timer = setTimeout(() => func(...args), delay);
	};
}
