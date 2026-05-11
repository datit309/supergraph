---
description: Graph-enhanced code review before merge. Use after task completion or before merging. CRITICAL issues block merge.
---

# Skill: Review

Graph-enhanced code review. Find issues that static analysis misses.

## Steps

### 1. Get Changed Files

```bash
git diff --name-only HEAD~1
```

### 2. Detect Language

Run: `bash bin/detect-project.sh`

### 3. Graph Analysis

```
mcp__code-review-graph__get_impact_radius_tool(files=[changed], depth=3)
mcp__code-review-graph__get_hub_nodes_tool()
mcp__code-review-graph__get_bridge_nodes_tool()
mcp__code-review-graph__list_communities_tool()
mcp__code-review-graph__get_surprising_connections_tool()
mcp__code-review-graph__get_knowledge_gaps_tool()
mcp__code-review-graph__detect_changes_tool()
```

For each changed file:

```
mcp__code-review-graph__query_graph_tool(query_type="tests", target="file")
```

### 4. Run Tests and Lint

```bash
$TEST_CMD
$LINT_CMD
```

### 5. Review Checklist

**Blast radius:** All affected files handled? No unexpected files?

**Hub safety:** Hub modifications — all callers tested? API unchanged?

**Bridge nodes:** Changes justified? Cross-community impact assessed?

**Surprise:** Connections > 0.5 investigated?

**Knowledge gaps:** Untested hotspots addressed?

**Language-specific:**

- Node.js: No unhandled rejections, no console.log in prod
- Python: Type hints on public functions, no bare except
- Flutter: const constructors, no unnecessary rebuilds
- Go: Error handling on all returns, context propagation
- Rust: Proper error types, no unwrap in production
- Java: Null checks, resource cleanup

### 6. Output

```
## Graph Review
- Changed: N files
- Blast radius: M files
- Hub nodes: [list]
- Bridge nodes: [list]
- Communities crossed: [list]
- Surprising connections: [list]
- Tests: [PASS or FAIL]
- Lint: [PASS or FAIL]

CRITICAL: [count]
WARNING: [count]
INFO: [count]

Verdict: [PASS | BLOCKED | NEEDS_CHANGES]
```

### Severity

- **CRITICAL:** New cycles, broken hub API, test fail → BLOCK
- **WARNING:** High surprise, missing tests, cross-community → FIX FIRST
- **INFO:** Clean structure, token savings → NOTE

## Rules

- CRITICAL issues block merge — no exceptions
- Graph analysis catches what static analysis misses
- Hub and bridge node changes need extra scrutiny
