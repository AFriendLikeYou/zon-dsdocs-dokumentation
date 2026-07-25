<script lang="ts">
	import { Banner } from '$components/ui/banner';
	import { WordingList } from '$components/ui/specsheet';
	import type { WordingRule } from '$types/spec';

	// Konkrete „statt X → besser Y"-Paare je Kanal. Bewusst konsistent zu den
	// Component-Wordings: Teaser/Spitzmarke an der Cell-Seite, Fehlermeldung an Input.
	const pushBeispiele: WordingRule[] = [
		{
			schlecht: 'SKANDAL! Das müssen Sie jetzt wissen!!!',
			gut: 'Neue Details zur Reform des Bürgergelds',
			hinweis: 'Präzise statt reißerisch — die Meldung sagt, worum es geht, ohne Alarm.'
		},
		{
			schlecht: 'Sie werden nicht glauben, was passiert ist',
			gut: 'Bundestag beschließt das Klimapaket',
			hinweis: 'Kein Clickbait: Der Push nennt den Kern, nicht ein Rätsel.'
		},
		{
			schlecht: 'Eilmeldung: Alles anders!',
			gut: 'Eilmeldung: EZB senkt den Leitzins um 0,25 Punkte',
			hinweis: '„Eil" verpflichtet zur Substanz — konkret, was gerade passiert ist.'
		}
	];

	const teaserBeispiele: WordingRule[] = [
		{
			schlecht: 'Artikel',
			gut: 'Streit ums Bürgergeld: Was die Reform wirklich ändert',
			hinweis: 'Der Titel ist eine konkrete Schlagzeile, kein Platzhalter (vgl. Cell).'
		},
		{
			schlecht: 'NEWS',
			gut: 'Wirtschaft',
			hinweis:
				'Die Spitzmarke ist das Ressort — kurz, normale Schreibung, keine Versalien (vgl. Cell).'
		},
		{
			schlecht: 'Interessante Entwicklungen in der Politik',
			gut: 'Warum die Koalition beim Haushalt blockiert',
			hinweis: 'Konkret statt vage — der Teaser verrät die These, nicht nur das Thema.'
		}
	];

	const fehlerBeispiele: WordingRule[] = [
		{
			schlecht: 'Ungültig',
			gut: 'Bitte eine gültige E-Mail-Adresse eingeben.',
			hinweis: 'Fehlermeldungen sagen konkret, was zu tun ist (vgl. Input).'
		},
		{
			schlecht: 'Fehler 400: Bad Request',
			gut: 'Das hat nicht geklappt. Bitte später noch einmal versuchen.',
			hinweis: 'Hilfreich statt systemisch — kein Fehlercode, sondern ein nächster Schritt.'
		},
		{
			schlecht: 'Sie haben das Feld nicht korrekt ausgefüllt.',
			gut: 'Das Passwort braucht mindestens 8 Zeichen.',
			hinweis: 'Ruhig und lösungsorientiert, ohne Schuldzuweisung.'
		}
	];
</script>

<svelte:head>
	<title>Voice & Tone - Die Zeit Design System</title>
</svelte:head>

<h1>Voice & Tone</h1>

<p>
	Voice &amp; Tone beschreibt, <em>wie</em> DIE ZEIT spricht — über alle Touchpoints hinweg. Die
	<strong>Voice</strong>
	(die Haltung) bleibt konstant; der
	<strong>Tone</strong> (der konkrete Ton) passt sich dem Kontext an: eine Fehlermeldung klingt anders
	als ein Onboarding.
</p>

<Banner
	variant="default"
	title="Diese Seite ist im Aufbau"
	description="Die finalen Voice-&-Tone-Inhalte werden vom Brand-Team gepflegt. Unten steht die Struktur, die hier mit Inhalt gefüllt wird."
/>

<h2>Unsere Voice</h2>
<p>
	Drei bis fünf Eigenschaften, die unsere Sprache prägen (z. B. klar, fundiert, zugänglich) —
	jeweils mit einem Satz, was sie bedeutet und was nicht.
</p>

<h2>Tone nach Kontext</h2>
<p>
	Wie sich der Ton je Situation verschiebt — als kurze Matrix. Pro Kontext eine Tendenz und ein
	Beispiel:
</p>
<ul>
	<li><strong>Erfolg / Bestätigung</strong> — knapp, bestätigend.</li>
	<li><strong>Fehler / Warnung</strong> — ruhig, lösungsorientiert, ohne Schuldzuweisung.</li>
	<li><strong>Onboarding / Leerzustand</strong> — einladend, orientierend.</li>
</ul>

<h2>Schreibweise: sag / sag nicht</h2>
<p>
	Konkrete Ja/Nein-Satzpaare als Richtschnur — werden hier ergänzt, sobald die Voice-Eigenschaften
	feststehen.
</p>

<h2>Konkrete Beispiele</h2>
<p>
	Voice &amp; Tone wird greifbar an konkreten Formulierungen. Drei Kanäle, je ein paar Paare —
	links, was wir vermeiden, rechts die bessere Fassung. Die Beispiele bleiben bewusst konsistent mit
	den Wording-Regeln der Komponenten.
</p>

<h3>Push-Meldung</h3>
<p>Reißerisch verspielt Vertrauen — der Push nennt präzise, was passiert ist.</p>
<WordingList items={pushBeispiele} />

<h3>Teaser &amp; Spitzmarke</h3>
<p>Vage Platzhalter langweilen — Titel und Spitzmarke sind konkret und benennbar.</p>
<WordingList items={teaserBeispiele} />

<h3>Fehlermeldung &amp; UI-Text</h3>
<p>Systemsprache hilft niemandem — der Text erklärt ruhig den nächsten Schritt.</p>
<WordingList items={fehlerBeispiele} />
