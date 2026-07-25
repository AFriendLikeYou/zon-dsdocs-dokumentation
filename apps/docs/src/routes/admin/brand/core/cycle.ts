/**
 * Zyklischer Listen-Index: bewegt `i` um `dir` Schritte (±1) durch eine Liste
 * der Länge `n` und wickelt an beiden Enden um. Leere Liste → 0. Ersetzt die
 * mehrfach handgeschriebene `(i ± 1 + n) % n`-Arithmetik (Insert-/Slash-Menü,
 * Token-Picker).
 */
export function cycleIndex(i: number, n: number, dir: number): number {
	if (n <= 0) return 0;
	return (((i + dir) % n) + n) % n;
}
