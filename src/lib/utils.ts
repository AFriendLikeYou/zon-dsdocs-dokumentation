import type { Icon } from '$types/global';

export const uppercaseFirstLetter = (str: string) => {
	return str.charAt(0).toUpperCase() + str.slice(1);
};

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
