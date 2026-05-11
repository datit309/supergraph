---
description: Create graph-informed implementation plans before writing code. Use before any implementation task to scan codebase, analyze blast radius, and create a detailed task breakdown.
---

# Skill: Plan

Never write code without understanding the codebase. Scan first, then plan with graph analysis.

## Steps

### 1. Scan Codebase (MANDATORY)

```bash
ls -la
find . -maxdepth 2 -type f \( -name "*.json" -o -name "*.toml" -o -name "*.yaml" -o -name "Makefile" \) | head -30
```

- Read config file → identify language, framework, test runner, linter, formatter, versions
- Read 2-3 source files in target area → note naming, imports, error handling, style
- Read 1-2 test files → note test structure, assertion style

Run: `bash bin/detect-project.sh` for commands.

### 2. Ensure Graph is Built

```
mcp__code-review-graph__list_graph_stats_tool()
```

If stale: `mcp__code-review-graph__build_or_update_graph_tool()`

### 3. Identify Change Targets

Based on task + codebase understanding → exact file paths.

### 4. Graph Analysis

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

### 5. Create Task Breakdown

Each task 2-5 minutes:

```markdown
## Task N: [Description]

**Files:**

- Create: `exact/path/to/file`
- Modify: `exact/path/to/existing:123-145`
- Test: `tests/exact/path/to/test`

**Blast radius:** [files from get_impact_radius_tool]

**Steps:**

- [ ] Step 1: Write failing test → [exact test code]
- [ ] Step 2: Run test → expect FAIL → `[test command]`
- [ ] Step 3: Write implementation → [exact code]
- [ ] Step 4: Run test → expect PASS → `[test command]`
- [ ] Step 5: Lint & format → `[command]` (skip if none)
- [ ] Step 6: Commit → `git add [files] && git commit -m "type: desc"`

**Risk:** [low | medium | high]
**Dependencies:** [prerequisite tasks or "none"]
```

### 6. Validate Plan

- [ ] Codebase scanned
- [ ] Blast radius files covered
- [ ] Code style matches conventions
- [ ] Test commands are real
- [ ] Hub nodes have review steps
- [ ] No placeholders (TBD, TODO)

### 7. Save Plan

After user approval:

```bash
mkdir -p docs/superpowers/plans/
```

Write to `docs/superpowers/plans/YYYY-MM-DD-<feature-slug>.md`.

**Plan MUST include Environment Context block:**

```markdown
## Environment Context

- **Language:** [X] v[Y]
- **Test command:** `[exact]`
- **Linter command:** `[exact or "none"]`
- **Formatter command:** `[exact or "none"]`
- **Build command:** `[exact or "none"]`
- **Branch:** `[current or "create: feature/xxx"]`
- **Conventional commit style:** `[e.g., "feat: / fix: / chore:"]`

**Codebase conventions:**

- [naming pattern]
- [import style]
- [error handling]
- [test structure]

**Graph Context:**

- Blast radius: M files
- Hub nodes: [list]
- Bridge nodes: [list]
- Communities crossed: [list]
- Surprising connections: [list]
```

### 8. Handoff

> "Plan saved. Choose execution:
>
> 1. **Subagent-Driven** — fresh subagent per task, review between tasks
> 2. **Inline** — execute in this session with checkpoints"

## Rules

- Codebase first, plan second
- Environment Context is mandatory
- Exact file paths, exact commands, exact code
- Never write placeholders
