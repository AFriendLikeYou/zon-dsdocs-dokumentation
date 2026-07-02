<svelte:head>
	<title>Willkommen - Die Zeit Design System</title>
</svelte:head>

<h1>Willkommen</h1> 

<p>Der ZEIT-Brandguide hilft Mitarbeitern, Partnern und Kollaborateuren bei der Erstellung von Inhalten und Materialien, die unsere Marke konsistent und sicher repräsentieren.</p>

<h2>Für wen ist das Marken-Toolkit gedacht?</h2>

<p>Dieses Toolkit richtet sich an eine Vielzahl von Personen mit unterschiedlichen Aufgaben, Zielen und unterschiedlichen Kenntnissen über Institutionen. Hier ist eine Liste von Rollen, die das Hauptpublikum darstellen:</p>

<div class="tables-wrapper">
	<table aria-label="Externe Mitarbeiter:innen">
		<thead>
			<tr>
				<th>Externe Mitarbeiter:innen</th>
			</tr>
		</thead>
		<tbody>
			<tr>
				<td>Gestalter</td>
			</tr>
			<tr>
				<td>Werbetexter</td>
			</tr>
			<tr>
				<td>Strategen</td>
			</tr>
			<tr>
				<td>Produzenten</td>
			</tr>
			<tr>
				<td>Art Director der Agentur</td>
			</tr>
			<tr>
				<td>Event-Planer</td>
			</tr>
		</tbody>
	</table>
	
	<table aria-label="Interne Mitarbeiter:innen">
		<thead>
			<tr>
				<th>DIE ZEIT-Mitarbeiter:innen</th>
			</tr>
		</thead>
		<tbody>
			<tr>
				<td>Unternehmensmarketing</td>
			</tr>
			<tr>
				<td>Produktmarketing</td>
			</tr>
			<tr>
				<td>DevRel</td>
			</tr>
			<tr>
				<td>Kundenerfolg</td>
			</tr>
			<tr>
				<td>Design/Produkt</td>
			</tr>
			<tr>
				<td>Werbetexter</td>
			</tr>
	
		</tbody>
	</table>
</div>

<h2>Wie man den Brandguide verwendet</h2> 

<p>Der Brandguide ist als praktisches Nachschlagewerk konzipiert. Er bietet klare Richtlinien, konkrete Beispiele und sofort einsetzbare Vorlagen. <strong>Sie finden hier Informationen zu Farben, Typografie, Logos, Symbolen sowie zu Bildsprache, Tonalität und Stimme der Marke.</strong> Ziel ist es, allen Beteiligten Sicherheit bei der Gestaltung zu geben und gleichzeitig genügend Flexibilität zu lassen, damit kreative Lösungen entstehen können. </p>

<p>Ob Sie ein neues Event gestalten, eine digitale Kampagne planen oder ein Produkt-Feature umsetzen – der Brandguide hilft dabei, die Marke ZEIT stimmig und konsistent zu transportieren. Nutzen Sie die Inhalte als Orientierung, Inspiration und verbindliche Grundlage für Ihre Arbeit.</p>

<style>
	.tables-wrapper {
		display: flex;
		gap: 2rem;
		flex-wrap: wrap;
		margin-bottom: var(--z-ds-space-l);
	}

	.tables-wrapper table {
		border-radius: 8px;
		width: 100%;
		max-width: 100%;
	}

	.tables-wrapper th {
		border: 1px solid var(--ds-border);
		background-color: var(--ds-surface-raised);
		color: var(--ds-text);
		font-size: var(--ds-text-base);
		font-weight: 600;
		padding: 0.75rem;
		border-bottom: 1px solid var(--ds-border);
		text-align: left;
	}

	.tables-wrapper td {
		border: 1px solid var(--ds-border);
		padding: 0.75rem;
		text-align: left;
		font-size: var(--ds-text-sm);
		color: var(--ds-text-body);
	}

	@media (min-width: 768px) {
		.tables-wrapper table {
			max-width: calc(50% - var(--z-ds-space-m));
		}
	}
</style>