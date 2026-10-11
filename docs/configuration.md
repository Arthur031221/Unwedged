# Configuration

The browser app has no server configuration, account, analytics or runtime API. The Node launcher accepts `--port PORT` and binds to `127.0.0.1`. Browser preferences for language, theme and display units use local storage. If storage is unavailable, preferences remain active for the current page session.

Search defaults to 10 cm translation steps, 10 degree rotation steps, at most 65,000 explored states and a 9 second time limit. Fine search uses 5 cm and 5 degree steps with the same state and time bounds. These are search bounds, not physical limits. The solver exposes internal options for tests. Schema limits are in `src/core/schema.ts`, while verifier depth and interval budgets are in `src/core/verify.ts`.

The first browser visit needs the app assets. After that, the service worker caches same-origin app files for offline use. Wait until the "Offline ready" indicator appears before relying on offline use. Saved projects can be downloaded as JSON or shared in a URL hash. Shared data is untrusted and is validated and checked in a worker before use.
