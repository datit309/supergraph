---
name: supergraph-integration
description: Run integration and end-to-end tests after unit tests pass. Use after /supergraph:fix when unit tests are green. Validates cross-module behavior.
---

# Skill: Integration

Integration + e2e tests. Run after unit tests pass. Validates modules work together.

## Prerequisites

- `/supergraph:fix` completed — unit tests PASS, lint PASS
- Commands from Environment Context

## Steps

### 1. Detect Integration Setup

```bash
# Check for integration test config
[ -f jest.integration.config.js ] && INT_TEST_CMD="npx jest --config jest.integration.config.js"
[ -f pytest.ini ] && grep -q "integration" pytest.ini && INT_TEST_CMD="pytest -m integration"
[ -f cypress.config.js ] && E2E_CMD="npx cypress run"
[ -f playwright.config.js ] && E2E_CMD="npx playwright test"
[ -f docker-compose.test.yml ] && COMPOSE_TEST="docker compose -f docker-compose.test.yml up --abort-on-container-exit"
```

If none found → skip, report: "No integration/e2e config found. Add if needed."

### 2. Run Integration Tests

```bash
$INT_TEST_CMD
```

Failures → read error, trace to source module, fix, re-run (max 3).

### 3. Run E2E Tests (if configured)

```bash
$E2E_CMD
```

Failures → read error, trace to source, fix, re-run (max 2 — e2e flaky ok).

### 4. Graph Validation

```
mcp__code-review-graph__get_affected_flows_tool(files=["all_changed"])
mcp__code-review-graph__get_surprising_connections_tool()
```

Cross-module flows all tested? Surprising connections investigated?

### 5. Report

```
## Integration Report
- Unit tests: PASS
- Integration: [PASS|FAIL|SKIP]
- E2E: [PASS|FAIL|SKIP]
- Cross-module flows: [N tested / M total]
- Issues: [list or "none"]
Next: /supergraph:review
```

## Rules

- Unit tests must pass FIRST — don't skip to integration
- Integration failures take priority over e2e (fix foundation first)
- Max 3 retries for integration, max 2 for e2e
- Flaky e2e tests → mark `@flaky`, don't block
- After integration pass → `/supergraph:review`
