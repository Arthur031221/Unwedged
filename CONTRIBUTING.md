# Contributing

Use Node.js 22.12 or newer.

```sh
npm ci
npm run typecheck
npm run lint
npm run format:check
npm test
npm run build
npx playwright install chromium
npm run test:e2e
npm run test:offline
npm run smoke:package
```

The reference check uses Python 3 and Shapely only for tests. Create `.venv`, install `requirements-test.txt`, then run `.venv/bin/ruff format --check tests/reference.py` and `.venv/bin/python tests/reference.py`. It compares independent polygon clearances and densely samples accepted segments. Sampling is a bug detector, not a continuous proof. The verifier's displacement bound is the continuous certificate.

Keep user measurements in centimetres internally. Persisted documents are untrusted and must pass schema validation. Any geometry edit invalidates a route. Search must stay in a worker and return only after a complete path has passed a fresh verification.
