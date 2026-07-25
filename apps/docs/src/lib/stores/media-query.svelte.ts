/**
 * useMediaQuery — reaktiver Media-Query-Hook (Runes).
 * Im Komponenten-Script aufrufen: der $effect ist an deren Lebenszyklus gebunden
 * (läuft nur im Browser, räumt automatisch auf). SSR-Default: false.
 *
 *   const mq = useMediaQuery('(min-width: 768px)');
 *   const isDesktop = $derived(mq.matches);
 */
export function useMediaQuery(query: string) {
	let matches = $state(false);

	$effect(() => {
		const mql = window.matchMedia(query);
		matches = mql.matches;
		const onChange = (event: MediaQueryListEvent) => (matches = event.matches);
		mql.addEventListener('change', onChange);
		return () => mql.removeEventListener('change', onChange);
	});

	return {
		get matches() {
			return matches;
		}
	};
}
