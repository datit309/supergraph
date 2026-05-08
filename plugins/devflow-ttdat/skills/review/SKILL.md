---
name: devflow-review
description: Code review với graph enhancement. Tự động kích hoạt trước khi merge và sau khi task hoàn tất.
autoTrigger: pre_merge
---

# Skill: Review

> Auto-trigger: Before merge, after task completion.

## Purpose

Graph-enhanced code review. CRITICAL issues block merge.

## Steps

### 1. Get Changed Files

    git diff --name-only HEAD~1

### 2. Detect Language and Commands

### 3. Graph Analysis

    mcp__code-review-graph__blast_radius(files=[changed], depth=3, direction="both")
    mcp__code-review-graph__find_hub_nodes(threshold=5)
    mcp__code-review-graph__find_communities()
    mcp__code-review-graph__find_cycles()
    mcp__code-review-graph__find_bridge_nodes()

For each changed file:

    mcp__code-review-graph__surprise_score(file=[file])
    mcp__code-review-graph__find_tests_for(file=[file])

### 4. Run Tests and Lint

Use detected language commands.

### 5. Checklist

**Blast radius:**

- All blast_radius files intentionally changed or verified
- No unexpected files

**Hub safety:**

- If hub modified: all callers tested
- Hub API unchanged or dependents updated

**Community:**

- Cross-community imports justified
- No new circular deps

**Surprise:**

- surprise_score > 0.5 investigated

**Node.js specific:**

- No unhandled rejections
- require/import consistency
- No console.log in prod

**Flutter specific:**

- const constructors where possible
- No unnecessary rebuilds
- State management follows pattern

**PHP specific:**

- Type hints on params and returns
- No raw SQL without parameterized queries
- PSR-12 compliance

### 6. Output

    ## Devflow Review
    - Changed: N files
    - Blast radius: M files
    - Hub nodes: [list]
    - Communities: [list]
    - New cycles: [list]
    - Surprise flags: [list]
    - Tests: [PASS or FAIL]
    - Lint: [PASS or FAIL]
    CRITICAL: [count]
    WARNING: [count]
    INFO: [count]
    Verdict: [PASS | BLOCKED | NEEDS_CHANGES]

### Severity

- CRITICAL: New cycles, broken hub API, test fail → BLOCK
- WARNING: High surprise, missing tests, cross-community → FIX FIRST
- INFO: Token savings, clean structure → NOTE
