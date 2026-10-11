[Live demo](https://arthur031221.github.io/Unwedged/) | [Traditional Chinese](README.zh-TW.md) | [Simplified Chinese](README.zh-CN.md) | [Japanese](README.ja.md) | [Korean](README.ko.md) | [Spanish](README.es.md) | [French](README.fr.md) | [German](README.de.md) | [Brazilian Portuguese](README.pt-BR.md)

# Unwedged

<img src="public/unwedged-mark.svg" width="48" height="48" alt="Unwedged mark">

[![Node.js 22.12+](https://img.shields.io/badge/Node.js-22.12%2B-3157a0?style=flat-square)](docs/install.md) [![MIT](https://img.shields.io/badge/license-MIT-048b78?style=flat-square)](LICENSE)

Find a turning route before the sofa arrives.

A local field sheet for measuring a single-floor layout and checking a rigid rectangular piece in 2D.

**3,204 route poses checked independently.** Run both successful presets, then sample each returned segment at 800 intervals in Shapely to check. [Reproduce the check](CONTRIBUTING.md). Sampling tests the implementation. The verifier checks continuous motion in the drawn 2D model.

| Before                                                | After                                                                       |
| ----------------------------------------------------- | --------------------------------------------------------------------------- |
| Door width, room, obstacles and carry height measured | A candidate turning route with each motion segment conservatively certified |
| Turning clearance uncertain                           | Saved measurements, route playback and a dimensioned route sheet to review  |

![A real browser recording of a furniture route around a wall](assets/demo.gif)

Unwedged checks a rigid rectangle moving on one floor. It doesn't model 3D, stairs, tilting, human carriers or deformation. A bounded search can miss a route. It never proves passage is impossible.

The drawing is the model. Measure what you put in it.

## Quick start

Install Node.js 22.12 or newer and Git. This command downloads the app once, then serves it on your computer at `127.0.0.1`:

```sh
npx github:Arthur031221/Unwedged
```

The browser app bundles its fonts and solver worker. After your first visit, wait for "Offline ready" before relying on the app and route search offline. Project files stay in the browser or downloads. The app makes no runtime API calls.

## Five-line example

Save this as `room.json`, open it in the app, then choose Find route. Dimensions are in centimeters. Angles are in radians.

<!-- prettier-ignore -->
```json
{"format":"unwedged","schemaVersion":1,"project":{
  "schemaVersion":1,"name":"Small room","floor":{"width":500,"height":300},
  "furniture":{"length":150,"width":70,"height":70},"margin":2,"rects":[],
  "start":{"x":100,"y":150,"angle":0},"goal":{"x":400,"y":150,"angle":0}
}}
```

## Workflow

1. Choose Apartment hallway, Corner landing or Blocked corridor, then enter measured room and obstacle dimensions.
2. Enter furniture length, width, fixed carry height and safety margin. Set start and destination positions and angles.
3. Find a route. The worker checks clearances without freezing the editor. Replay or scrub the returned poses.
4. Save the measurements and rechecked route as JSON, share them in a URL hash, or export a dimensioned SVG route sheet.

Measurements are stored in centimetres. You can switch the display to inches. Editing or moving any geometry discards the current route before the next search.

## Install by host

<details><summary>macOS</summary>

Install Node.js 22.12 or newer and Git. Open Terminal and run `npx github:Arthur031221/Unwedged`. Open the printed loopback address. Stop the server with Ctrl+C.

</details>

<details><summary>Linux</summary>

Install Node.js 22.12 or newer and Git. Open a terminal and run `npx github:Arthur031221/Unwedged`. Open the printed loopback address. Stop the server with Ctrl+C.

</details>

<details><summary>Windows</summary>

Install Node.js 22.12 or newer and Git. Open PowerShell and run `npx github:Arthur031221/Unwedged`. Open the printed loopback address. Stop the server with Ctrl+C.

</details>

## Project files

- `src/core/geometry.ts` computes oriented footprints, doorway gaps and physical clearance.
- `src/core/verify.ts` certifies each motion interval with adaptive continuous bounds.
- `src/core/search.ts` runs a deterministic A* search with finite state and time limits.
- `src/worker.ts` runs search and imported-route verification away from the interface thread.
- `src/locales` contains nine interface translations.
- `docs/accuracy.md` describes the geometric checks and solver limits.

## Development

From a checkout, use `npm ci`, `npm run dev`, `npm test` and `npm run build`. `CONTRIBUTING.md` lists browser, offline, package and independent Shapely checks. The repository includes font files and their OFL notices.

Assisted by Claude/Codex.
