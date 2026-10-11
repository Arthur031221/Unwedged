[Live-Demo](https://arthur031221.github.io/Unwedged/) | [繁體中文](README.zh-TW.md) | [简体中文](README.zh-CN.md) | [日本語](README.ja.md) | [한국어](README.ko.md) | [Español](README.es.md) | [Français](README.fr.md) | [Deutsch](README.de.md) | [Português brasileiro](README.pt-BR.md)

# Unwedged

<img src="public/unwedged-mark.svg" width="48" height="48" alt="Unwedged Logo">

[![Node.js 22.12+](https://img.shields.io/badge/Node.js-22.12%2B-3157a0?style=flat-square)](docs/install.md) [![MIT](https://img.shields.io/badge/license-MIT-048b78?style=flat-square)](LICENSE)

Finde eine Route mit Kurve, bevor das Sofa ankommt.

Ein lokales Messblatt für einen Grundriss auf einer Ebene, mit dem sich ein starrer rechteckiger Gegenstand in 2D prüfen lässt.

**3,204 Routenposen unabhängig geprüft.** Prüfmethode: beide erfolgreichen Voreinstellungen ausführen und dann jedes zurückgegebene Segment mit Shapely in 800 Intervallen abtasten. [Prüfung nachvollziehen](CONTRIBUTING.md). Die Abtastung testet die Implementierung. Der Verifizierer prüft die kontinuierliche Bewegung im gezeichneten 2D-Modell.

| Vorher                                            | Nachher                                                                             |
| ------------------------------------------------- | ----------------------------------------------------------------------------------- |
| Türbreite, Raum, Hindernisse und Tragehöhe messen | Eine mögliche Wenderoute, deren jedes Bewegungssegment konservativ zertifiziert ist |
| Unklar, ob eine Kurve passt                       | Gespeicherte Messwerte, Routenvorschau und ein bemaßter Routenplan zur Prüfung      |

![Echte Browseraufnahme einer Möbelroute um eine Wand](assets/demo.gif)

Unwedged prüft einen starren rechteckigen Gegenstand, der sich auf einer Ebene bewegt. 3D, Treppen, Kippen, tragende Personen und Verformung werden nicht modelliert. Eine begrenzte Suche kann eine Route übersehen. Sie beweist niemals, dass ein Durchgang unmöglich ist.

Die Zeichnung ist das Modell. Miss, was du einzeichnest.

## Schnellstart

Installiere Node.js 22.12 oder neuer. Dieser Befehl lädt die App einmal herunter und stellt sie anschließend auf diesem Computer unter `127.0.0.1` bereit: Git muss ebenfalls installiert sein.

```sh
npx github:Arthur031221/Unwedged
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

Installiere Node.js 22.12 oder neuer, öffne Terminal und führe `npx github:Arthur031221/Unwedged` aus. Öffne die angezeigte Loopback-Adresse. Beende den Server mit Ctrl+C. Git muss ebenfalls installiert sein.

</details>

<details><summary>Linux</summary>

Installiere Node.js 22.12 oder neuer, öffne ein Terminal und führe `npx github:Arthur031221/Unwedged` aus. Öffne die angezeigte Loopback-Adresse. Beende den Server mit Ctrl+C. Git muss ebenfalls installiert sein.

</details>

<details><summary>Windows</summary>

Installiere Node.js 22.12 oder neuer, öffne PowerShell und führe `npx github:Arthur031221/Unwedged` aus. Öffne die angezeigte Loopback-Adresse. Beende den Server mit Ctrl+C. Git muss ebenfalls installiert sein.

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
