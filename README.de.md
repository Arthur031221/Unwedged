[Live Demo](https://arthur031221.github.io/Unwedged/) | [繁體中文](README.zh-TW.md) | [简体中文](README.zh-CN.md) | [日本語](README.ja.md) | [한국어](README.ko.md) | [Español](README.es.md) | [Français](README.fr.md) | [Deutsch](README.de.md) | [Português brasileiro](README.pt-BR.md)

# Unwedged

<img src="public/unwedged-mark.svg" width="48" height="48" alt="Unwedged Logo">

[![Node.js 22.12+](https://img.shields.io/badge/Node.js-22.12%2B-3157a0?style=flat-square)](docs/install.md) [![MIT](https://img.shields.io/badge/license-MIT-048b78?style=flat-square)](LICENSE)

Finde eine Route mit Kurve, bevor das Sofa ankommt.

Ein lokales Messwerkzeug, das prüft, ob sich ein starres rechteckiges Möbelstück durch einen vermessenen Grundriss auf einer Ebene drehen lässt.

![Echte Browseraufnahme einer Möbelroute um eine Wand](assets/demo.gif)

**Ausprobieren:** Öffne die Live-Demo und wähle Eckpodest. Suche und spiele die Route bei 74 cm ab, ändere dann Breite auf 75 cm. Findet die begrenzte Suche keine Route, ist damit nicht bewiesen, dass der Durchgang unmöglich ist.

## Schnellstart

Installiere Node.js 22.12 oder neuer und Git, dann starte die App lokal:

```sh
npx github:Arthur031221/Unwedged#v1.3.0
```

Der Befehl lädt die App herunter und stellt sie auf deinem Computer unter `127.0.0.1` bereit. Warte nach dem ersten Aufruf auf "Offline bereit", bevor du dich auf die Offline-Nutzung verlässt. Messwerte bleiben im Browser oder in gespeicherten Dateien.

Unwedged bildet ein starres Rechteck ab, das sich auf einer Ebene bewegt. 3D, Treppen, Kippen, tragende Personen und Verformung werden nicht modelliert. Die Suche ist begrenzt, kann eine Route übersehen und beweist nicht, dass ein Durchgang unmöglich ist.

X und Y geben Mittelpunkte an. Der Ursprung liegt links unten, X wächst nach rechts und Y nach oben. Positive Winkel drehen gegen den Uhrzeigersinn. Ein Beispiel steht unter [Bedienung](docs/usage.md).

Die Zeichnung ist das Modell. Miss, was du einzeichnest.

## Erste Schritte

1. Wähle Apartment hallway, Corner landing oder Blocked corridor und gib die gemessenen Raum- und Hindernismaße ein.
2. Gib Länge und Breite des Möbelstücks, feste Tragehöhe und Sicherheitsabstand ein. Lege Start und Ziel mit Position und Winkel fest.
3. Suche eine Route und spiele die zurückgegebenen Posen ab. Warnungen markieren Kollisionen an Start oder Ziel sowie Freiraum unter dem erforderlichen Sicherheitsabstand.
4. Speichere Messwerte und geprüfte Route als JSON, teile einen Projektlink oder exportiere einen bemaßten SVG-Routenplan.

[Bedienung](docs/usage.md) erklärt Koordinaten und Bearbeitung. [Genauigkeit und Grenzen](docs/accuracy.md) beschreibt Geometrieprüfung und Suchgrenzen.

## Beispiel mit fünf Zeilen

Speichere dies als `room.json`, öffne die Datei in der App und wähle Route suchen. Maße sind in Zentimetern, Winkel in Radiant angegeben.

<!-- prettier-ignore -->
```json
{"format":"unwedged","schemaVersion":1,"project":{
  "schemaVersion":1,"name":"Small room","floor":{"width":500,"height":300},
  "furniture":{"length":150,"width":70,"height":70},"margin":2,"rects":[],
  "start":{"x":100,"y":150,"angle":0},"goal":{"x":400,"y":150,"angle":0}
}}
```

## Installation nach Betriebssystem

Installiere Node.js 22.12 oder neuer und Git, dann führe den Befehl in Terminal, einem Linux-Terminal oder PowerShell aus. Öffne die angezeigte Adresse und beende den Server mit Ctrl+C.

<details><summary>macOS</summary>

```sh
npx github:Arthur031221/Unwedged#v1.3.0
```

</details>

<details><summary>Linux</summary>

```sh
npx github:Arthur031221/Unwedged#v1.3.0
```

</details>

<details><summary>Windows</summary>

```powershell
npx github:Arthur031221/Unwedged#v1.3.0
```

</details>

## Projektdateien

- `src/core/geometry.ts` berechnet orientierte Umrisse, Türöffnungen und den tatsächlichen Freiraum.
- `src/core/verify.ts` zertifiziert jedes Bewegungsintervall mit adaptiven kontinuierlichen Grenzen.
- `src/core/search.ts` führt eine deterministische Suche mit A* und begrenzten Zuständen sowie Zeitlimits aus.
- `src/worker.ts` führt die Suche und die Verifizierung importierter Routen außerhalb des Hauptthreads aus.
- `src/locales` enthält neun Übersetzungen der Benutzeroberfläche.
- [docs/accuracy.md](docs/accuracy.md) beschreibt die geometrischen Prüfungen und die Grenzen des Solvers.

## Entwicklung

Führe in einem Checkout `npm ci`, `npm run dev`, `npm test` und `npm run build` aus. [CONTRIBUTING.md](CONTRIBUTING.md) beschreibt Browserprüfungen, Offlineprüfungen, Paketprüfungen und unabhängige Shapely-Prüfungen. Schriftdateien und OFL-Hinweise sind enthalten.

Assisted by Claude/Codex.
