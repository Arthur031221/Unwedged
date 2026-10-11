[Live-Demo](https://arthur031221.github.io/Unwedged/) | [繁體中文](README.zh-TW.md) | [简体中文](README.zh-CN.md) | [日本語](README.ja.md) | [한국어](README.ko.md) | [Español](README.es.md) | [Français](README.fr.md) | [Deutsch](README.de.md) | [Português brasileiro](README.pt-BR.md)

# Unwedged

<img src="public/unwedged-mark.svg" width="48" height="48" alt="Unwedged Logo">

[![Node.js 22.12+](https://img.shields.io/badge/Node.js-22.12%2B-3157a0?style=flat-square)](docs/install.md) [![MIT](https://img.shields.io/badge/license-MIT-048b78?style=flat-square)](LICENSE)

Finde eine Route mit Kurve, bevor das Sofa ankommt.

Ein lokales Messwerkzeug, um zu prüfen, ob sich ein starres rechteckiges Möbelstück durch einen vermessenen Grundriss auf einer Ebene drehen lässt.

![Echte Browseraufnahme einer Möbelroute um eine Wand](assets/demo.gif)

**Ausprobieren:** Wähle Eckpodest und dann Route suchen und Route abspielen bei der Beispielbreite von 74 cm. Ändere Breite auf 75 cm. Die aktuelle Route wird gelöscht. Mit Rückgängig und Wiederholen kannst du die Änderung nachvollziehen. Findet die begrenzte Suche bei 75 cm keine Route, beweist das nicht, dass kein Durchgang möglich ist.

Wähle Neuen leeren Plan erstellen für einen leeren Grundriss und gib unter Planname einen Namen ein. Das Erstellen ist ein Schritt für Rückgängig, und Messwerte werden lokal gespeichert. Beim Umbenennen bleibt eine verifizierte Route erhalten. Route suchen steht neben dem Plan und wird während der Suche zu Suche abbrechen. Teilen kopiert den Projektlink, wenn die Zwischenablage verfügbar ist. Andernfalls bleibt er in der Adresszeile. Beide Ergebnisse werden gemeldet. Überschriften zeigen die gewählte Einheit. Die SVG-Beschriftung des Routenplans enthält den Plannamen.

Ein Zahlenwert wird beim Verlassen des Feldes oder mit Enter vollständig übernommen. Ungültige Werte erhalten eine sichtbare, barrierefrei angekündigte Meldung und sperren Suche, Teilen, Speichern und Export bis zur Korrektur. Beim Ändern der Wandmaße bleiben gemessene Türbreite und Versatz erhalten. Widersprüchliche Maße werden abgelehnt. Ein erfolgreich geöffnetes Projekt lässt sich rückgängig machen. Ein abgelehnter Import lässt Grundriss und zertifizierte Route unverändert.

Rückgängig und Wiederholen stellen zusammengefasste Messwertänderungen wieder her. Messwerte werden lokal gespeichert und können beim nächsten Besuch wiederhergestellt werden. Routen sind nicht enthalten. Wenn der Browser keinen Speicher bereitstellt, verwende Projekt speichern. Die Felder lassen sich per Tastatur bearbeiten. Auf Mobilgeräten öffnet Maße das Bedienfeld für Hindernisse. Türöffnungen lassen sich entlang einer Wand verschieben. Dateien mit Versatz verwenden Schema-Version 2 und werden von älteren Clients abgelehnt. Dateien der Version 1 mit mittiger Öffnung bleiben kompatibel.

Unwedged prüft einen starren rechteckigen Gegenstand, der sich auf einer Ebene bewegt. 3D, Treppen, Kippen, tragende Personen und Verformung werden nicht modelliert. Eine begrenzte Suche kann eine Route übersehen. Sie beweist niemals, dass ein Durchgang unmöglich ist.

Die Zeichnung ist das Modell. Miss, was du einzeichnest.

## Schnellstart

Installiere Node.js 22.12 oder neuer. Dieser Befehl lädt die App einmal herunter und stellt sie anschließend auf diesem Computer unter `127.0.0.1` bereit: Git muss ebenfalls installiert sein.

```sh
npx github:Arthur031221/Unwedged#v1.2.0
```

Die Browser-App enthält ihre Schriftdateien und den Solver-Worker. Warte nach dem ersten Aufruf auf die Anzeige "Offline bereit", bevor du dich auf die Offline-Nutzung der App und Routensuche verlässt. Projektdateien bleiben im Browser oder im Download-Ordner. Die App ruft während der Nutzung keine API auf.

## Beispiel mit fünf Zeilen

Speichere dies als `room.json`, öffne die Datei in der App und wähle Find route. Maße sind in Zentimetern, Winkel in Radiant angegeben.

<!-- prettier-ignore -->
```json
{"format":"unwedged","schemaVersion":1,"project":{
  "schemaVersion":1,"name":"Small room","floor":{"width":500,"height":300},
  "furniture":{"length":150,"width":70,"height":70},"margin":2,"rects":[],
  "start":{"x":100,"y":150,"angle":0},"goal":{"x":400,"y":150,"angle":0}
}}
```

## Arbeitsablauf

1. Wähle Apartment hallway, Corner landing oder Blocked corridor und gib die gemessenen Maße des Raums und der Hindernisse ein.
2. Gib Länge und Breite des Möbelstücks, die feste Tragehöhe und den Sicherheitsabstand ein. Lege Position und Winkel von Start und Ziel fest.
3. Suche eine Route. Der Worker prüft die Abstände, ohne den Editor einzufrieren. Spiele die zurückgegebenen Posen ab oder gehe sie Schritt für Schritt durch.
4. Speichere Messwerte und erneut geprüfte Route als JSON, teile sie im URL-Fragment oder exportiere einen bemaßten SVG-Routenplan.

Messwerte werden in Zentimetern gespeichert. Die Anzeige lässt sich auf Zoll umstellen. Wenn du Geometrie bearbeitest oder verschiebst, wird die aktuelle Route vor der nächsten Suche verworfen.

## Installation nach Betriebssystem

<details><summary>macOS</summary>

Installiere Node.js 22.12 oder neuer, öffne Terminal und führe `npx github:Arthur031221/Unwedged#v1.2.0` aus. Öffne die angezeigte Loopback-Adresse. Beende den Server mit Ctrl+C. Git muss ebenfalls installiert sein.

</details>

<details><summary>Linux</summary>

Installiere Node.js 22.12 oder neuer, öffne ein Terminal und führe `npx github:Arthur031221/Unwedged#v1.2.0` aus. Öffne die angezeigte Loopback-Adresse. Beende den Server mit Ctrl+C. Git muss ebenfalls installiert sein.

</details>

<details><summary>Windows</summary>

Installiere Node.js 22.12 oder neuer, öffne PowerShell und führe `npx github:Arthur031221/Unwedged#v1.2.0` aus. Öffne die angezeigte Loopback-Adresse. Beende den Server mit Ctrl+C. Git muss ebenfalls installiert sein.

</details>

## Projektdateien

- `src/core/geometry.ts` berechnet orientierte Umrisse, Türöffnungen und den tatsächlichen Freiraum.
- `src/core/verify.ts` zertifiziert jedes Bewegungsintervall mit adaptiven kontinuierlichen Grenzen.
- `src/core/search.ts` führt eine deterministische A*-Suche mit endlichen Zustands- und Zeitlimits aus.
- `src/worker.ts` führt die Suche und die Verifizierung importierter Routen außerhalb des Interface-Threads aus.
- `src/locales` enthält neun Übersetzungen der Benutzeroberfläche.
- `docs/accuracy.md` beschreibt die geometrischen Prüfungen und die Grenzen des Solvers.

## Entwicklung

Führe in einem Checkout `npm ci`, `npm run dev`, `npm test` und `npm run build` aus. `CONTRIBUTING.md` beschreibt die Prüfungen für Browser, Offlinebetrieb, Paket und unabhängige Shapely-Prüfung. Das Repository enthält Schriftdateien und deren OFL-Hinweise.

Assisted by Claude/Codex.
