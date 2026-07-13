/**
 * Medientyp-Erkennung anhand der Datei-Endung — EINE Quelle für den ganzen
 * Brand-Editor (Picker, Vorschau, Validierung). Vorher lagen dieselben Regexe
 * mehrfach byte-nah verstreut (MediaPicker, BlockPreview, validation.ts).
 * Reine Endungs-Prüfung; die Tag-Form-Erkennung `<img …>` lebt getrennt in
 * segment.ts (IMG_ONLY_ISLAND), weil sie eine andere Frage beantwortet.
 */

/** Bild-Endungen (inkl. SVG). */
export const IMAGE_EXT = /\.(png|jpe?g|webp|svg|gif|avif)$/i;
/** Video-Endungen. */
export const VIDEO_EXT = /\.(mp4|webm|mov|m4v)$/i;

/** Ist der Pfad eine Bilddatei (Endung)? */
export const isImagePath = (path: string): boolean => IMAGE_EXT.test(path);
/** Ist der Pfad eine Videodatei (Endung)? */
export const isVideoPath = (path: string): boolean => VIDEO_EXT.test(path);
