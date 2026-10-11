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

The reference check uses Python 3 and Shapely only for tests. Create `.venv` and install `requirements-test.txt`. Run `.venv/bin/ruff format --check tests/reference.py` and `.venv/bin/python tests/reference.py`. It compares independent polygon clearances and samples accepted route segments at 800 intervals. The recorded baseline covers the two successful presets and four regression fixtures, including vertical and horizontal positioned doorways, for 6,408 route poses total. The vertical positioned doorway fixture has 30 cm clearance. The horizontal fixture has 20 cm clearance. Their centred controls collide. Sampling is a bug detector, not a continuous proof. The verifier's displacement bound is the continuous certificate.

Keep user measurements in centimetres internally. Persisted documents are untrusted and must pass schema validation. Any geometry edit invalidates a route. Search must stay in a worker and return only after a complete path has passed a fresh verification.
