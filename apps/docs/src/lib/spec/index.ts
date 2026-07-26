/**
 * $lib/spec — die Merge-Regel des Component-Doku-Modells (Maschine + Mensch +
 * begründete Widersprüche). Jede generierte Component-Seite importiert von hier;
 * die Regel steht damit EINMAL im Repo statt vierzehnmal im Generat.
 */
export { mergeSpec, setzePfadWert } from './merge';
export { buehnenAlign, type BuehnenAlign } from './buehne';
export {
	MASCHINE_FELDER,
	MENSCH_FELDER,
	MENSCH_ERGAENZEND,
	CONTENT_FELDER,
	CONTENT_FELDER_SET,
	pfadIstMaschinenfeld
} from './feldklassen';
