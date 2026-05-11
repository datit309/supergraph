---
name: supergraph-fix
description: Auto-fix loop after coding. Runs tests, lint, and graph review. Use after implementation tasks are complete.
---

# Skill: Fix

Auto-fix loop. Tests pass, lint clean, no graph surprises. Max 3 iterations.

## Prerequisites

- All implementation tasks complete
- Commands from `/supergraph:context` or plan's Environment Context

## Steps

### 1. Get Commands

```bash
eval "$(bash bin/detect-project.sh)"
```

### 2. Get Changed Files + Blast Radius

```bash
git diff --name-only
```

```
mcp__code-review-graph__get_impact_radius_tool(files=[changed], depth=3)
```

### 3. Fix Loop (max 3 iterations)

**A. Tests**
Run: `$TEST_CMD`
Failed → for each: read error, find source, fix source (NOT test), re-run.

**B. Lint**
Run: `$LINT_CMD`
Errors → fix each.

**C. Format**
Run: `$FORMAT_CMD`

**D. Graph Review**

```
mcp__code-review-graph__get_surprising_connections_tool()
mcp__code-review-graph__get_knowledge_gaps_tool()
```

- Surprise > 0.7 → CRITICAL, investigate
- Untested → WARNING

**E. Check**

- CRITICAL/WARNING → fix, continue loop
- All clean → break

### 4. Final State

3 iterations exhausted → STOP, present issues, NEVER commit broken.
Clean → report: "Auto-fix complete — tests PASS, lint PASS, review PASS"

### 5. Next

→ `/supergraph:review`

## Rules

- NEVER modify tests to make them pass (unless test is wrong)
- NEVER commit if checks fail after 3 iterations
- After fix → run `/supergraph:review`
