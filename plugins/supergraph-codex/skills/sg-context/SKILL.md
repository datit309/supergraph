---
description: Load codebase graph context at session start. Use when starting a session, switching projects, or before any coding task to understand the codebase structure.
---

# Skill: Context

Load codebase graph context so every subsequent decision is data-informed.

## Steps

### 1. Detect Project Type

Run: `bash bin/detect-project.sh`

Store: PROJECT_TYPE, TEST_CMD, LINT_CMD, FORMAT_CMD, BUILD_CMD, BRANCH.

### 2. Verify Graph Available

```
mcp__code-review-graph__list_graph_stats_tool()
```

If fails → inform user: "Run `pip install code-review-graph && code-review-graph install && code-review-graph build`"

### 3. Load Context

```
mcp__code-review-graph__list_graph_stats_tool()
mcp__code-review-graph__list_communities_tool()
mcp__code-review-graph__get_hub_nodes_tool()
mcp__code-review-graph__get_bridge_nodes_tool()
mcp__code-review-graph__get_knowledge_gaps_tool()
mcp__code-review-graph__get_architecture_overview_tool()
```

### 4. Present

```
## Graph Context
- Type: [language]
- Test: [command]
- Lint: [command]
- Files: N
- Communities: N — [name]: [count] files
- Hub nodes: [list]
- Bridge nodes: [list]
- Knowledge gaps: [list or none]
```

### 5. Re-index if Stale

```
mcp__code-review-graph__build_or_update_graph_tool()
```

## Rules

- Load context before any coding task
- Re-index if graph is stale
- If graph unavailable, proceed without it but warn user
