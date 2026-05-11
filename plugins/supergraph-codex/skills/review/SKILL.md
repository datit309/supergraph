---
name: supergraph-review
description: Graph-enhanced code review before merge. Use after /supergraph:fix or before merging. CRITICAL issues block merge.
---

# Skill: Review

Final gate. Graph-enhanced review. CRITICAL issues block merge.

## Prerequisites

- `/supergraph:fix` completed (tests pass, lint clean)

## Steps

### 1. Get Changed Files

```bash
git diff --name-only HEAD~1
```

### 2. Graph Analysis

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

### 3. Verify

```bash
eval "$(bash bin/detect-project.sh)"
$TEST_CMD
$LINT_CMD
```

### 4. Checklist

**Blast radius:** All affected files handled? No unexpected files?

**Hub safety:** Hub modifications — callers tested? API unchanged?

**Bridge nodes:** Changes justified? Cross-community impact assessed?

**Surprise:** Connections > 0.5 investigated?

**Knowledge gaps:** Untested hotspots addressed?

### 5. Output

```
## Graph Review
- Changed: N files | Blast radius: M files
- Hub nodes: [list] | Bridge nodes: [list]
- Communities crossed: [list]
- Surprising connections: [list]
- Tests: [PASS|FAIL] | Lint: [PASS|FAIL]

CRITICAL: [count] | WARNING: [count] | INFO: [count]
Verdict: [PASS | BLOCKED | NEEDS_CHANGES]
```

### Severity

- **CRITICAL:** New cycles, broken hub API, test fail → BLOCK
- **WARNING:** High surprise, missing tests → FIX FIRST
- **INFO:** Clean structure → NOTE

### 6. Handoff

- **PASS** → Ready to merge. `/supergraph:merge` or manual merge.
- **NEEDS_CHANGES** → Return to `/supergraph:fix` with specific issues listed.
- **BLOCKED** → Escalate to human. Log blockers in plan file.

## Rollback Path

If review returns NEEDS_CHANGES:

1. List specific issues from review
2. Return to `/supergraph:fix` with issue list
3. Fix → re-review (max 2 cycles)
4. If still blocked after 2 cycles → escalate to human

## Rules

- CRITICAL blocks merge — no exceptions
- Hub/bridge changes need extra scrutiny
- This is the final gate before merge
- After 2 review cycles still blocked → stop, escalate
