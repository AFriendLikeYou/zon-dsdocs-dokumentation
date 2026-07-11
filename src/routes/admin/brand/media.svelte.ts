/**
 * Reaktive Media-Query als Rune-Helfer. In der Komponenten-Init aufrufen:
 * `const mobile = matchesMedia('(max-width: 640px)'); … mobile.value`.
 * SSR-sicher (startet `false`, aktualisiert im Effect am Client).
 */
export function matchesMedia(query: string): { readonly value: boolean } {
	let matches = $state(false);
	$effect(() => {
		const mq = window.matchMedia(query);
		matches = mq.matches;
		const on = (e: MediaQueryListEvent) => (matches = e.matches);
		mq.addEventListener('change', on);
		return () => mq.removeEventListener('change', on);
	});
	return {
		get value() {
			return matches;
		}
	};
}
