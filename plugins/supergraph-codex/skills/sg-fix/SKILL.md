---
description: Auto-fix loop after coding. Runs tests, lint, and graph review iteratively. Use after all coding tasks are complete.
---

# Skill: Fix

Catch and fix issues automatically. Tests pass, lint clean, no graph surprises. Max 3 iterations.

## Steps

### 1. Detect Language

Run: `bash bin/detect-project.sh`

### 2. Get Changed Files

```bash
git diff --name-only
```

### 3. Get Blast Radius

```
mcp__code-review-graph__get_impact_radius_tool(files=[changed_files], depth=3)
```

### 4. Fix Loop (max 3 iterations)

**A. Tests**
Run: `$TEST_CMD`
If failed → for each failing test:

- Read error, find source file
- `get_impact_radius_tool(files=[source], depth=2)`
- Read test + source + blast files
- Fix source (NOT test unless test is wrong)
- Re-run test

**B. Lint**
Run: `$LINT_CMD`
If errors → fix each error.

**C. Graph Review**

```
mcp__code-review-graph__get_surprising_connections_tool()
mcp__code-review-graph__get_knowledge_gaps_tool()
```

- Surprise > 0.7 → CRITICAL, investigate
- Untested files → WARNING

**D. Check**

- If CRITICAL or WARNING → fix, continue loop
- If all clean → break

### 5. Final State

If 3 iterations exhausted → STOP, present remaining issues, NEVER commit broken code.

If clean → report: "Auto-fix complete — tests PASS, lint PASS, review PASS"

## Rules

- NEVER modify tests to make them pass (unless test is wrong)
- NEVER commit if any check fails after 3 iterations
- Use blast radius to understand fix impact
- Re-run full check after each fix
