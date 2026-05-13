---
name: integration
description: Run integration and e2e tests after unit tests pass. Use after /supergraph:fix when unit tests are green.
mcp: code-review-graph
---

# /supergraph:integration

Integration + e2e tests. Validates modules work together. Run AFTER unit tests pass.

## Steps

### 0. Announce
"🔗 /supergraph:integration — running integration and e2e tests..."

### 1. Detect Setup
Check for integration configuration:

| Config | Command |
|---|---|
| `jest.integration.config.js` | `npx jest --config jest.integration.config.js` |
| `pytest.ini` with "integration" | `pytest -m integration` |
| `cypress.config.js` | `npx cypress run` |
| `playwright.config.js` | `npx playwright test` |
| `docker-compose.test.yml` | `docker compose -f docker-compose.test.yml up --abort-on-container-exit` |

If none found → skip: "No integration/e2e config found."

### 2. Run Integration Tests
Max 3 retries. Failures → trace to source module, fix, re-run.

### 3. Run E2E (if configured)
Max 2 retries (e2e can be flaky). Mark `@flaky` tests, don't block.

### 4. Graph Validation
`get_affected_flows_tool(files=[all_changed])`, `get_surprising_connections_tool()`.
Cross-module flows all tested? Surprising connections investigated?

### 5. Report
```
✅ /supergraph:integration complete
- Unit: PASS | Integration: PASS|FAIL|SKIP | E2E: PASS|FAIL|SKIP
- Cross-module flows: N/M | Next: /supergraph:review
```

## Rules
- Unit tests MUST pass FIRST
- Integration failures > e2e failures (fix foundation first)
- Max 3 retries integration, 2 retries e2e
- After integration pass → `/supergraph:review`
