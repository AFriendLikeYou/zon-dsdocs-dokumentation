/**
 * foundation-tokens.ts — kuratierte Liste der globalen `--z-ds-*`-Foundation-Tokens
 * für die Referenz-Seite /product/foundations/tokens.
 *
 * Bewusst werden hier nur die Token-NAMEN (und optional ein Usage-Satz) gepflegt —
 * welche Tokens gezeigt werden, in welcher Reihenfolge, gruppiert. Die WERTE liest
 * die Seite zur Laufzeit per getComputedStyle aus dem geladenen styles-zds.css — so
 * können die Werte nie vom Upstream-Paket (@zeitonline/design-system) abweichen.
 * Quelle der Werte bleibt das npm-Paket.
 *
 * Datenmodell: Ein Token ist entweder ein reiner `string` (Name) ODER ein Objekt
 * `{ name, usage }` mit einem Satz zum Einsatzzweck. Beide Formen mischen sich frei
 * in derselben `tokens`-Liste; die Seite normalisiert mit `tokenName()`/`tokenUsage()`.
 * Der Drift-Check (tooling/check-tokens.mjs) matcht Token-Namen per Regex im Dateitext
 * und ist von der Objekt-Form unberührt.
 *
 * Usage-Sätze speisen sich aus: den Gruppen-`beschreibung`en, den Rollen-Mappings in
 * static/global.css (welches --ds-* konsumiert welches --z-ds-*?) und der tatsächlichen
 * Verwendung in den pattern.css der Komponenten. Wo keine belastbare Quelle existiert,
 * steht „—".
 */

/** Ein Token: reiner Name ODER Name + Einsatzzweck-Satz. */
export type FoundationToken = string | { name: string; usage: string };

export type FoundationGroup = {
  kategorie: string;
  /** Ein Satz zur Rolle/Anwendung der Gruppe (auf der Tokens-Seite unter dem Titel). */
  beschreibung?: string;
  /** true = Wert ist eine Farbe und bekommt eine Swatch-Vorschau. */
  isColor?: boolean;
  tokens: FoundationToken[];
};

/** Normalisierung: Name eines Tokens (egal ob string oder Objekt). */
export const tokenName = (t: FoundationToken): string =>
  typeof t === "string" ? t : t.name;
/** Normalisierung: Usage-Satz eines Tokens (leer, wenn nicht gepflegt). */
export const tokenUsage = (t: FoundationToken): string =>
  typeof t === "string" ? "" : t.usage;

export const FOUNDATION_TOKENS: FoundationGroup[] = [
  // Farbe — gruppiert nach Rolle: Hintergrund → Border/Divider → Fill/Akzent → Text.
  {
    kategorie: "Farbe — Hintergrund",
    beschreibung:
      "Flächen und Ebenen: background-0 ist die Grundfläche, höhere Stufen und der Modal-Ton setzen Bereiche gezielt ab.",
    isColor: true,
    tokens: [
      {
        name: "--z-ds-color-background-0",
        usage:
          "Grundfläche der Seite — Karten, Navbar, Eingabefelder in Ruhe (--ds-surface).",
      },
      {
        name: "--z-ds-color-background-10",
        usage:
          "Leicht abgesetzte Ebene — Pills, Hover-Flächen, Code-Blöcke, Bühnen (--ds-surface-raised).",
      },
      {
        name: "--z-ds-color-background-20",
        usage:
          "Dritte, tiefer sitzende Ebene — aktive/gedrückte Flächen (--ds-surface-sunken).",
      },
      {
        name: "--z-ds-color-background-modal",
        usage:
          "Ton für Modal-/Overlay-Flächen, die sich vom Seitenhintergrund abheben.",
      },
    ],
  },
  {
    kategorie: "Farbe — Border & Fokus",
    beschreibung:
      "Rahmen und Trennlinien; focus-100 markiert den sichtbaren Tastatur-Fokus, accent hebt interaktive oder aktive Elemente hervor.",
    isColor: true,
    tokens: [
      {
        name: "--z-ds-color-border-100",
        usage:
          "Kräftiger Rahmen — Eingabefelder, Stepper, aktive Umrandungen (--ds-border-strong).",
      },
      {
        name: "--z-ds-color-border-70",
        usage:
          "Ruhige Trennlinie zwischen Bereichen und Listenzeilen (--ds-border).",
      },
      {
        name: "--z-ds-color-border-hover",
        usage:
          "Rahmenfarbe beim Hover interaktiver Flächen (--ds-border-hover).",
      },
      {
        name: "--z-ds-color-focus-100",
        usage:
          "Sichtbarer :focus-visible-Ring und Link-/Aktiv-Akzent (--ds-focus-ring, --ds-accent).",
      },
      {
        name: "--z-ds-color-accent-100",
        usage:
          "ZEIT-Rot als Fill/Akzent — Badges, Tipps, aktive Marker (--ds-accent-brand).",
      },
      {
        name: "--z-ds-color-accent-70",
        usage:
          "Abgeschwächter Akzent — z. B. Hover-/Sekundärzustand des Akzents (Button).",
      },
    ],
  },
  {
    kategorie: "Farbe — Basis",
    beschreibung:
      "Theme-invariante Grundfarben: general-white-100 (reines Weiß) und general-black-100 (reines Schwarz) speisen z. B. theme-unabhängige Flächen und Schrift (App-Button) unabhängig vom aktiven Light/Dark-Theme.",
    isColor: true,
    tokens: [
      {
        name: "--z-ds-color-general-white-100",
        usage:
          "Reines Weiß, theme-invariant — bleibt in Light und Dark gleich (--ds-static-white, App-Button).",
      },
      {
        name: "--z-ds-color-general-black-100",
        usage:
          "Reines Schwarz, theme-invariant — bleibt in Light und Dark gleich (--ds-static-black).",
      },
    ],
  },
  {
    kategorie: "Farbe — Status",
    beschreibung:
      "Semantische Zustandsfarben: Erfolg/Do, Warnung und Fehler/Don’t — z. B. in Do-&-Don’t-Listen und A11y-Status.",
    isColor: true,
    tokens: [
      {
        name: "--z-ds-color-background-success",
        usage:
          "Erfolg/Do — grüne Statusfläche in Do-&-Don’t-Listen und A11y-Status (--ds-positive).",
      },
      {
        name: "--z-ds-color-background-warning",
        usage:
          "Warnung — gelbe Statusfläche für Hinweise, die Aufmerksamkeit brauchen (--ds-warning).",
      },
      {
        name: "--z-ds-color-error-70",
        usage:
          "Fehler/Don’t — rote Statusfarbe, u. a. für Eingabefehler (--ds-negative).",
      },
    ],
  },
  {
    kategorie: "Farbe — Text",
    beschreibung:
      "Text-Hierarchie nach Wichtigkeit: text-100 für primären Text, text-70/55/40 für abnehmende Betonung (Sekundärtext, Labels, deaktiviert).",
    isColor: true,
    tokens: [
      {
        name: "--z-ds-color-text-100",
        usage:
          "Primärer Text — Überschriften und tragende UI-Beschriftung (--ds-text).",
      },
      {
        name: "--z-ds-color-text-70",
        usage: "Fließtext und sekundäre UI-Texte (--ds-text-body).",
      },
      {
        name: "--z-ds-color-text-55",
        usage: "Labels, Meta-Angaben, Platzhalter (--ds-text-muted).",
      },
      {
        name: "--z-ds-color-text-40",
        usage: "Tertiärer und deaktivierter Text (--ds-text-faint).",
      },
    ],
  },
  {
    kategorie: "Abstand — semantische Stufen",
    beschreibung:
      "Bevorzugt verwenden. Benannte Stufen (xxs…xxl) skalieren konsistent und bleiben bei Theme- oder Density-Änderungen stabil.",
    tokens: [
      {
        name: "--z-ds-space-xxs",
        usage: "Kleinster semantischer Abstand — enge Icon-/Text-Abstände.",
      },
      {
        name: "--z-ds-space-xs",
        usage: "Sehr kleiner Abstand — Gap in kompakten Zeilen und Chips.",
      },
      {
        name: "--z-ds-space-s",
        usage: "Kleiner Abstand — Innenabstände dichter Komponenten.",
      },
      {
        name: "--z-ds-space-m",
        usage: "Standard-Abstand — Default für Innenabstände und Gaps.",
      },
      {
        name: "--z-ds-space-l",
        usage: "Größerer Abstand — zwischen zusammengehörigen Blöcken.",
      },
      {
        name: "--z-ds-space-xl",
        usage: "Großer Abstand — zwischen Sektionen.",
      },
      {
        name: "--z-ds-space-xxl",
        usage: "Größter semantischer Abstand — großzügige Sektions-Trennung.",
      },
    ],
  },
  {
    kategorie: "Abstand — numerische Skala",
    beschreibung:
      "Nur zur Feinabstimmung, wenn keine semantische Stufe passt — semantische Stufen haben Vorrang (siehe Anwendungsregel oben).",
    tokens: [
      {
        name: "--z-ds-space-4",
        usage: "Feinabstimmung am 4px-Raster — kleinste Schrittweite.",
      },
      "--z-ds-space-6",
      {
        name: "--z-ds-space-8",
        usage: "Häufige Feinstufe — z. B. Gap zwischen Icon und Label.",
      },
      "--z-ds-space-10",
      {
        name: "--z-ds-space-12",
        usage: "Feinstufe — Innenabstand von Feldern und kompakten Flächen.",
      },
      "--z-ds-space-14",
      {
        name: "--z-ds-space-16",
        usage: "Feinstufe — verbreiteter Innen-/Grid-Abstand.",
      },
      "--z-ds-space-20",
      {
        name: "--z-ds-space-24",
        usage: "Feinstufe — großzügiger Innenabstand (z. B. Icon-Kachel).",
      },
      "--z-ds-space-32",
      "--z-ds-space-56",
    ],
  },
  {
    kategorie: "Radius",
    beschreibung:
      "Eckenrundung: 2 für dezente, 4 als Standard, 8 für deutlich gerundete Flächen (Karten, Buttons, Inputs).",
    tokens: [
      {
        name: "--z-ds-border-radius-2",
        usage: "Kleinste Rundung — Checkbox, kleine Marker (--ds-radius-xs).",
      },
      {
        name: "--z-ds-border-radius-4",
        usage: "Standard — Button, Input, Karte (--ds-radius-sm).",
      },
      {
        name: "--z-ds-border-radius-8",
        usage: "Große Rundung — Panel, Dialog, Bühne (--ds-radius).",
      },
    ],
  },
  {
    kategorie: "Schriftgröße",
    beschreibung:
      "Diskrete Größenskala. Möglichst über Text-Rollen bzw. -Styles nutzen, statt Größen direkt zu referenzieren.",
    tokens: [
      {
        name: "--z-ds-fontsize-12",
        usage:
          "Kleinster Grad — Labels, Meta, Icon-Bildunterschriften (--ds-text-xs, --ds-label-size).",
      },
      {
        name: "--z-ds-fontsize-14",
        usage: "Kleiner Text — sekundäre UI, Tabellen (--ds-text-sm).",
      },
      {
        name: "--z-ds-fontsize-16",
        usage: "Basisgröße für UI-Text (--ds-text-base).",
      },
      {
        name: "--z-ds-fontsize-18",
        usage: "Fließtext und größere UI-Beschriftung (--ds-text-lg).",
      },
      {
        name: "--z-ds-fontsize-20",
        usage: "Größte UI-Stufe / kleine Überschrift (--ds-text-xl).",
      },
      "--z-ds-fontsize-22",
      "--z-ds-fontsize-24",
      "--z-ds-fontsize-26",
      "--z-ds-fontsize-30",
      "--z-ds-fontsize-32",
      {
        name: "--z-ds-fontsize-34",
        usage:
          "Große Überschrift — Seiten-H1 (Brand-Display-Heading nutzt fontsize-42).",
      },
      "--z-ds-fontsize-36",
      "--z-ds-fontsize-42",
      "--z-ds-fontsize-46",
      "--z-ds-fontsize-54",
    ],
  },
];
