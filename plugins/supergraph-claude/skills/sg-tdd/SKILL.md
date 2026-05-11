---
description: Test-Driven Development for every implementation. Use when implementing features or fixes. RED-GREEN-REFACTOR cycle.
---

# Skill: TDD

Write test first, then implement. Uses commands from `/supergraph:context` or plan's Environment Context.

## Prerequisites

- Run `/supergraph:context` first (for $TEST_CMD)
- Or read Environment Context from plan file

## Steps

### 1. Get Commands

From plan's Environment Context, or:

```bash
eval "$(bash bin/detect-project.sh)"
```

### 2. Find Existing Tests

```
mcp__code-review-graph__query_graph_tool(query_type="tests", target="target/file")
```

### 3. RED — Write Failing Test

1. Write MINIMAL failing test
2. Run: `$TEST_CMD`
3. MUST FAIL → Report: `RED: [test_name] fails`

### 4. GREEN — Minimal Implementation

1. Write SIMPLEST code
2. Run: `$TEST_CMD`
3. MUST PASS → Report: `GREEN: [test_name] passes`

### 5. REFACTOR — Safe Improvement

```
mcp__code-review-graph__get_impact_radius_tool(files=["changed"], depth=2)
```

Refactor, keep tests green, run ALL tests for blast radius.

### 6. Verify

```
mcp__code-review-graph__get_impact_radius_tool(files=["all_changed"], depth=3)
```

Run tests for ALL blast radius files.

### 7. Commit

```bash
git add [exact files]
git commit -m "test: [description]"
git commit -m "feat: [description]"
```

### 8. Next

If more tasks in plan → repeat.
If all tasks done → `/supergraph:fix`

## Rules

- Test first, always
- Minimal test, minimal code
- Separate commits for test and implementation
- After all tasks → run `/supergraph:fix`
