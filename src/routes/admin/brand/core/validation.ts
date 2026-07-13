/**
 * Feld-Validierung fürs Brand-CMS (rein, testbar). Prüft Werte GEGEN das
 * Prop-Schema aus der Registry: Pflichtfelder, URL-Format, Medientyp und
 * Farb-Token (gegen die echte Token-Liste aus global.css). Fehlertexte sind
 * redaktionsfreundlich formuliert — sie sagen, WIE man es richtig macht.
 */
import type { CmsPropDef } from './cms-components';
import { isImagePath, isVideoPath } from './media-types';

/** URL: absolute (http/https/mailto) oder Site-relativ (/pfad) oder Anker. */
const URL_OK = /^(https?:\/\/\S+|mailto:\S+|\/\S*|#\S+)$/i;
/** CSS-Farbe direkt: Hex, rgb()/rgba(), hsl()/hsla(), color-mix(…). */
const CSS_COLOR = /^(#[0-9a-f]{3,8}|rgba?\(.+\)|hsla?\(.+\)|color-mix\(.+\))$/i;

export function validateProp(
	prop: CmsPropDef,
	value: string | boolean | undefined,
	tokens: readonly string[]
): string | null {
	if (prop.type === 'boolean') return null;
	const s = typeof value === 'string' ? value.trim() : '';

	if (s === '') {
		return prop.required ? 'Pflichtfeld — bitte ausfüllen.' : null;
	}
	if (prop.type === 'number') {
		return /^-?\d+$/.test(s) ? null : 'Bitte eine ganze Zahl eingeben.';
	}
	if (prop.type === 'media') {
		if (prop.mediaKind === 'image' && !isImagePath(s))
			return 'Bitte eine Bilddatei wählen (png, jpg, webp, svg …).';
		if (prop.mediaKind === 'video' && !isVideoPath(s))
			return 'Bitte eine Videodatei wählen (mp4, webm …).';
		return null;
	}
	if (prop.format === 'url') {
		return URL_OK.test(s) ? null : 'Ungültige URL — mit https://, / oder mailto: beginnen.';
	}
	if (prop.format === 'token-color') {
		if (s.startsWith('--')) {
			return tokens.includes(s) ? null : 'Unbekanntes Token — z. B. --z-ds-color-…';
		}
		return CSS_COLOR.test(s) ? null : 'Kein gültiger Farbwert — Token (--z-ds-…) oder Hex (#…).';
	}
	return null;
}

/** Alle Fehler eines Werte-Objekts, key → Meldung (leer = valide). */
export function validateValues(
	props: readonly CmsPropDef[],
	values: Record<string, string | boolean>,
	tokens: readonly string[]
): Record<string, string> {
	const errors: Record<string, string> = {};
	for (const p of props) {
		const err = validateProp(p, values[p.key], tokens);
		if (err) errors[p.key] = err;
	}
	return errors;
}

export const countErrors = (errors: Record<string, string>): number => Object.keys(errors).length;
