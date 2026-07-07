// Redaktioneller Inhalt der Component-Doku — VON HAND PFLEGBAR.
// Diese Datei wird vom zeit-de-Exporter NICHT überschrieben (einmalig als Stub erzeugt).
// Die Felder überschreiben die generierten Werte aus spec.generated.ts.
//
//   zweck       – Beschreibung im Hero
//   status      – ready_for_dev | completed | changed
//   version     – Snapshot-/Versions-Label im Hero
//   variantInfo – Wann welche Variante nutzen (Label → Text)
//   callouts    – Anatomie-Beschriftungen ({ nr, text })
//   a11y        – Barrierefreiheit-Hinweise ({ label, wert, status })
//   doDont      – { do: [...], dont: [...] }
import type { ComponentSpec } from '$types/spec';

export const content = {
	"zweck": "Umrandeter Shortcut zu einem Seitenziel — ein einzelner Stil mit Hover- und Focus-State, bewusst ohne Varianten.",
	"status": "ready_for_dev"
} satisfies Partial<ComponentSpec>;
