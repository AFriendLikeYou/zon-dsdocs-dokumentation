/**
 * Eintrag im Barrierefreiheits-Katalog.
 */
export interface A11yItem {
	/** Kurzer, scanbarer Titel */
	title: string;
	/** Was passiert / warum es relevant ist */
	description: string;
	/** Praktische Lösung oder Abmilderung (darf HTML-/ARIA-Snippets enthalten) */
	solution: string;
	/** Einordnung: zu behebendes „Problem“ oder zu übernehmende „gute Praxis“ */
	label: 'problem' | 'gute-praxis';
	/** Themenfeld für Gruppierung & Filterung */
	category: 'Statusmeldungen' | 'Formulare' | 'Formularvalidierung' | 'Screenreader' | 'Meta';
	/** Deep-Links zum Weiterlesen und/oder Code-Referenzen */
	links: {
		wcag?: string; // Bevorzugt WCAG-Understanding-Seiten
		github?: string; // Wenn bekannt, auf die konkrete Zeile/den PR verweisen
	};
	/** Optionales Vorschaubild oder Diagramm, falls später ergänzt */
	img?: string;
}

/**
 * Kuratierte Liste von Barrierefreiheits-Problemen & -Praktiken.
 */
export const A11Y_ITEMS: A11yItem[] = [
	{
		title: 'Aktualisierungen der Live-Region werden beim Neuladen nicht angesagt',
		description:
			'Beim Neuladen der Seite oder beim sofortigen Rendern können Screenreader aria-live-Änderungen verpassen, wenn die Aktualisierung erfolgt, bevor die assistive Technologie ihre Initialisierung abgeschlossen hat.',
		solution:
			'Die Live-Region zunächst leer rendern und ihren Text erst nach kurzer Verzögerung (~500 ms) aktualisieren. Für nicht kritische Informationen <code>role="status"</code> (polite) oder <code>aria-live="polite"</code> bevorzugen; <code>aria-live="assertive"</code> bzw. <code>role="alert"</code> nur für dringende Meldungen verwenden.',
		label: 'problem',
		category: 'Statusmeldungen',
		links: {
			wcag: 'https://www.w3.org/WAI/WCAG22/Understanding/status-messages.html',
			github:
				'https://github.com/ZeitOnline/login/blob/main/src/zeit-online-theme/src/main/resources/themes/zeit-online-public/login/resources/js/script.js#L22' // Repo/Zeile ergänzen, sobald verfügbar
		}
	},
	{
		title: 'Fehlermeldung ist ihrem Feld nicht zugeordnet',
		description:
			'Screenreader-Nutzende erfahren nicht, zu welchem Feld ein Fehler gehört, weil der Fehlertext nicht programmatisch mit dem Eingabefeld verknüpft ist.',
		solution:
			'Dem Fehler-Element eine <code>id</code> geben und sie am Eingabefeld über <code>aria-describedby</code> referenzieren. Optional <code>aria-errormessage</code> zusammen mit <code>aria-invalid="true"</code> für klarere Semantik einsetzen.',
		label: 'problem',
		category: 'Formulare',
		links: {
			wcag: 'https://www.w3.org/WAI/WCAG22/Understanding/error-identification.html',
			github:
				'https://github.com/ZeitOnline/login/blob/main/src/zeit-online-theme/src/main/resources/themes/zeit-online-public/login/login.ftl#L48'
		}
	},
	{
		title: 'Fehlermeldungen werden nicht unmittelbar vorgelesen',
		description:
			'Wenn die Validierung fehlschlägt, sagt die assistive Technologie den neuen Fehlertext nicht sofort an.',
		solution:
			'Fehler in einer Live-Region platzieren. Für kritische Validierungen <code>role="alert"</code> oder <code>aria-live="assertive"</code> verwenden. Die Region leer initialisieren, damit das Setzen des Textes eine erkennbare Änderung darstellt.',
		label: 'problem',
		category: 'Statusmeldungen',
		links: {
			wcag: 'https://www.w3.org/WAI/WCAG22/Understanding/status-messages.html',
			github:
				'https://github.com/ZeitOnline/login/blob/main/src/zeit-online-theme/src/main/resources/themes/zeit-online-public/login/resources/js/script.js#L38'
		}
	},
	{
		title: 'Ungültige Felder werden nicht programmatisch ausgezeichnet',
		description:
			'Eingabefelder, die die Validierung nicht bestehen, werden für assistive Technologien nicht gekennzeichnet — Nutzende können Fehler dadurch nicht schnell auffinden.',
		solution:
			'An Feldern, die die Validierung nicht bestehen, <code>aria-invalid="true"</code> setzen. Optional mit <code>aria-errormessage</code> kombinieren, das auf den Fehlertext verweist.',
		label: 'problem',
		category: 'Formulare',
		links: {
			wcag: 'https://www.w3.org/WAI/WCAG22/Understanding/error-identification.html',
			github:
				'https://github.com/ZeitOnline/login/blob/main/src/zeit-online-theme/src/main/resources/themes/zeit-online-public/login/resources/js/script.js#L84'
		}
	},
	{
		title: 'Fehlerübersicht für große Formulare anbieten',
		description:
			'Wenn mehrere Felder ungültig sind, brauchen Nutzende einen schnellen Überblick und einen Weg, zu jedem Problem zu springen.',
		solution:
			'Eine Fehlerübersicht oben (nach der Hauptüberschrift) rendern, den Fokus nach dem Absenden dorthin verschieben, jeden Fehler als Link auf sein Feld auflisten und die Fehler am jeweiligen Feld zusätzlich bestehen lassen.',
		label: 'gute-praxis',
		category: 'Formularvalidierung',
		links: {
			wcag: 'https://www.w3.org/WAI/WCAG22/Understanding/error-suggestion.html',
			github: ''
		}
	},
	{
		title: 'Fehler im Dokumenttitel abbilden',
		description:
			'Nutzende, die zwischen Tabs wechseln (oder einen Screenreader verwenden), profitieren davon, wenn der Seitentitel signalisiert, dass die Validierung fehlgeschlagen ist.',
		solution:
			'Bei fehlgeschlagener Validierung <code>document.title</code> um einen Fehlerhinweis und (optional) die Anzahl der Fehler ergänzen, z. B. <code>"(3) Fehler — Kasse"</code>. Knapp halten.',
		label: 'gute-praxis',
		category: 'Meta',
		links: {
			wcag: 'https://www.w3.org/WAI/WCAG22/Understanding/page-titled.html',
			github: ''
		}
	}
];
