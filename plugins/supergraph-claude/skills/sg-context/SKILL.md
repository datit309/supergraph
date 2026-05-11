---
description: Load codebase graph context at session start. Use when starting a session or switching projects. Run once per session.
---

# Skill: Context

Load codebase graph context. Run once per session — other skills depend on this.

## Steps

### 1. Detect Project

```bash
eval "$(bash bin/detect-project.sh)"
```

Store: `PROJECT_TYPE`, `TEST_CMD`, `LINT_CMD`, `FORMAT_CMD`, `BUILD_CMD`, `BRANCH`.

### 2. Verify Graph

```
mcp__code-review-graph__list_graph_stats_tool()
```

If fails → "Run `pip install code-review-graph && code-review-graph install && code-review-graph build`"

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
- Type: $PROJECT_TYPE | Test: $TEST_CMD | Lint: $LINT_CMD
- Files: N | Communities: N
- Hub nodes: [list]
- Bridge nodes: [list]
- Knowledge gaps: [list]
```

## Output for Other Skills

After running context, these are available:

- `$PROJECT_TYPE` — language/framework
- `$TEST_CMD` — test command
- `$LINT_CMD` — linter command
- `$FORMAT_CMD` — formatter command
- `$BUILD_CMD` — build command
- `$BRANCH` — current git branch
- Graph data (hub nodes, bridge nodes, communities, knowledge gaps)

Other skills should reference "context from /supergraph:context" instead of re-loading.
