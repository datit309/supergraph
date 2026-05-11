---
description: Create graph-informed implementation plans before writing code. Use before any implementation task. Skip for small changes (1-2 files, <10 lines).
---

# Skill: Plan

Scan codebase, analyze blast radius, create plan. Skip for small changes.

## Quick Check

If change is small (1-2 files, <10 lines, no hub/bridge nodes) → skip plan, go to `/supergraph:tdd` directly.

## Steps

### 1. Scan Codebase (MANDATORY)

```bash
eval "$(bash bin/detect-project.sh)"
```

- Read config file → language, framework, versions
- Read 2-3 source files in target area → naming, imports, error handling
- Read 1-2 test files → test structure, assertion style

### 2. Ensure Graph

```
mcp__code-review-graph__list_graph_stats_tool()
```

If stale: `mcp__code-review-graph__build_or_update_graph_tool()`

### 3. Graph Analysis

```
mcp__code-review-graph__get_impact_radius_tool(files=["targets"], depth=3)
mcp__code-review-graph__get_hub_nodes_tool()
mcp__code-review-graph__get_bridge_nodes_tool()
mcp__code-review-graph__list_communities_tool()
mcp__code-review-graph__get_surprising_connections_tool()
mcp__code-review-graph__get_review_context_tool(files=["targets"])
mcp__code-review-graph__query_graph_tool(query_type="tests", target="file")
mcp__code-review-graph__get_affected_flows_tool(files=["targets"])
```

### 4. Task Breakdown

Each task 2-5 min:

```markdown
## Task N: [Description]

**Files:** Create/Modify/Test exact paths
**Blast radius:** [files from get_impact_radius_tool]
**Steps:**

- [ ] Write failing test → [exact code]
- [ ] Run test → expect FAIL → `$TEST_CMD`
- [ ] Write implementation → [exact code]
- [ ] Run test → expect PASS → `$TEST_CMD`
- [ ] Lint → `$LINT_CMD` (skip if none)
- [ ] Commit → `git add [files] && git commit -m "type: desc"`
      **Risk:** [low|medium|high]
      **Dependencies:** [tasks or "none"]
```

### 5. Validate

- [ ] Blast radius files covered
- [ ] Code style matches conventions
- [ ] Test commands real (from detect-project.sh)
- [ ] Hub nodes have review steps
- [ ] No placeholders

### 6. Save Plan

After approval → `docs/superpowers/plans/YYYY-MM-DD-<slug>.md`

**MUST include Environment Context:**

```markdown
## Environment Context

- **Language:** [X] v[Y]
- **Test command:** `[from detect-project.sh]`
- **Linter command:** `[from detect-project.sh]`
- **Formatter command:** `[from detect-project.sh]`
- **Build command:** `[from detect-project.sh]`
- **Branch:** `[current]`
- **Conventional commit style:** `[e.g., "feat: / fix:"]`

**Codebase conventions:** [naming, imports, error handling, test structure]

**Graph Context:**

- Blast radius: M files
- Hub nodes: [list]
- Bridge nodes: [list]
- Communities crossed: [list]
- Surprising connections: [list]
```

### 7. Handoff

> "Plan saved. Next: `/supergraph:tdd` to implement, or dispatch `supergraph-executor` agent."

## Rules

- Codebase first, plan second
- Environment Context mandatory — executor depends on it
- Exact file paths, commands, code
- No placeholders
