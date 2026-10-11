# Install

## Run from GitHub

Install Node.js 22.12 or newer and Git. An internet connection is needed for the first `npx github:Arthur031221/Unwedged#v1.2.0` install. The command downloads the package and starts a static server on `127.0.0.1`. Open the printed address. Use `--port 8080` to choose another port, `--help` to show options and Ctrl+C to stop it.

The browser downloads the app assets on first use. Its service worker caches the app, local fonts and worker for later offline visits. Wait until the "Offline ready" indicator appears before relying on offline use. No account or runtime API is required. Measurements stay in browser storage or files that you save or export.

## Run from a checkout

Run `npm ci` and then `npm run dev`. `npm run build` creates the static site in `dist`. To serve a package build locally, use `node bin/unwedged.mjs --port 4173`. The server binds to IPv4 loopback only.
