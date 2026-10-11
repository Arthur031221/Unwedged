[Live demo](https://arthur031221.github.io/Unwedged/) | [Traditional Chinese](README.zh-TW.md) | [Simplified Chinese](README.zh-CN.md) | [Japanese](README.ja.md) | [Korean](README.ko.md) | [Spanish](README.es.md) | [French](README.fr.md) | [German](README.de.md) | [Brazilian Portuguese](README.pt-BR.md)

# Unwedged

<img src="public/unwedged-mark.svg" width="48" height="48" alt="Unwedged mark">

[![Node.js 22.12+](https://img.shields.io/badge/Node.js-22.12%2B-3157a0?style=flat-square)](docs/install.md) [![MIT](https://img.shields.io/badge/license-MIT-048b78?style=flat-square)](LICENSE)

Find a turning route before the sofa arrives.

A local measurement tool to check whether a rigid rectangular item can turn through a measured floor plan on one level.

![A real browser recording of a furniture route around a wall](assets/demo.gif)

**Try it:** open the live demo and choose Corner landing. Find and play the route at 74 cm, then change Width to 75 cm. Finding no route doesn't prove passage is impossible.

## Quick start

Install Node.js 22.12 or newer and Git, then run the app locally:

```sh
npx github:Arthur031221/Unwedged#v1.3.0
```

This downloads the app and serves it on your computer at `127.0.0.1`. On your first visit, wait for "Offline ready" before using it offline. Measurements stay in browser storage or files you save.

Unwedged models a rigid rectangle moving on one floor. It doesn't model 3D, stairs, tilting, carriers or deformation. The search has limits and can miss a route. It can't prove passage is impossible.

X and Y are center positions. The origin is at the lower left. X increases right and Y increases up. Positive angles rotate counterclockwise. See [Usage](docs/usage.md) for an example.

The drawing is the model. Measure what you put in it.

## First use

1. Choose Apartment hallway, Corner landing or Blocked corridor, then enter measured room and obstacle dimensions.
2. Enter furniture length, width, fixed carry height and safety margin. Set the start and destination positions and angles.
3. Find a route, then play or scrub through the returned poses. Warnings mark endpoint collisions or clearance at or below the required margin.
4. Save the measurements and checked route as JSON, share a project link, or export a dimensioned SVG route sheet.

See [Usage](docs/usage.md) for coordinates and editing details, and [Accuracy and limits](docs/accuracy.md) for geometric checks and search limits.

## Example project file

Save this as `room.json`, open it in the app, then choose Find route. Dimensions are in centimetres. Angles are in radians.

<!-- prettier-ignore -->
```json
{"format":"unwedged","schemaVersion":1,"project":{
  "schemaVersion":1,"name":"Small room","floor":{"width":500,"height":300},
  "furniture":{"length":150,"width":70,"height":70},"margin":2,"rects":[],
  "start":{"x":100,"y":150,"angle":0},"goal":{"x":400,"y":150,"angle":0}
}}
```

## Install by host

Install Node.js 22.12 or newer and Git. Run the command below in Terminal, a Linux terminal or PowerShell, then open the printed address. Stop the server with Ctrl+C.

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

## Project files

- `src/core/geometry.ts` computes oriented footprints, doorway gaps and physical clearance.
- `src/core/verify.ts` certifies each motion interval with adaptive continuous bounds.
- `src/core/search.ts` runs a deterministic A* search with finite state and time limits.
- `src/worker.ts` runs search and imported-route verification off the interface thread.
- `src/locales` contains nine interface translations.
- [docs/accuracy.md](docs/accuracy.md) covers geometric checks and solver limits.

## Development

From a checkout, run `npm ci`, `npm run dev`, `npm test` and `npm run build`. See [CONTRIBUTING.md](CONTRIBUTING.md) for browser, offline, package and independent Shapely checks. Font files and their OFL notices are included.

Assisted by Claude/Codex.
