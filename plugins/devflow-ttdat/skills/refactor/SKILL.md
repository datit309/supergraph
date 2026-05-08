---
name: devflow-refactor
description: Refactoring an toàn có graph-aware. Tự động kích hoạt khi refactoring code.
autoTrigger: refactor
---

# Skill: Refactor

> Auto-trigger: When refactoring code.

## Purpose

Refactor safely using graph analysis.

## Steps

### 1. Impact Assessment

    mcp__code-review-graph__blast_radius(files=[targets], depth=5, direction="both")
    mcp__code-review-graph__find_dependents(files=[targets])
    mcp__code-review-graph__find_hub_nodes(threshold=5)
    mcp__code-review-graph__find_communities()
    mcp__code-review-graph__find_cycles()
    mcp__code-review-graph__find_bridge_nodes()

If hub nodes involved → REQUIRE user approval.

### 2. Baseline

Run all tests for blast_radius files. Record pass/fail.

### 3. Incremental

NEVER refactor everything at once:

1. Leaf nodes first (safest)
2. Work inward toward hubs
3. After EACH step: blast_radius + tests + find_cycles + surprise_score

### 4. Community Order

    mcp__code-review-graph__find_communities()
    mcp__code-review-graph__find_bridge_nodes()

- Within communities first
- Bridge nodes last
- Full test suite after each community

### 5. Verify

- blast_radius matches plan?
- No new cycles?
- All tests pass?

### 6. Post-Refactor

Execute auto-fix skill to catch regressions.

### Rules

- NEVER refactor hubs without user approval
- NEVER cross community boundaries in one step
- ALWAYS test after each step
- ALWAYS check for new cycles
