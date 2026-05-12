---
name: plan
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
mcp__code-review-graph__get_minimal_context_tool()
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
mcp__code-review-graph__find_large_functions_tool()
mcp__code-review-graph__get_docs_section_tool()
```

### 4. Task Breakdown

Each task 2-5 min. Use this exact machine-readable format so `/supergraph:execute` can parse task scope reliably:

```markdown
## Task N: [Short description]
Status: pending
Risk: low|medium|high
Dependencies: none | Task 1, Task 2

Files:
- Create: path/to/new-file.ext
- Modify: path/to/existing-file.ext
- Test: path/to/test-file.ext

Blast radius:
- path/to/affected-file.ext

Acceptance:
- [observable behavior/result]
- [test/assertion that proves completion]

TDD:
- Behavior: [single externally visible behavior]
- Test file: [exact test path]
- Test name: [behavior-focused test name]
- RED command: `$FOCUSED_TEST_CMD`
- Expected RED failure: [missing behavior, not setup/import/syntax error]
- Minimal GREEN change: [smallest implementation idea]
- Refactor candidates: [optional, only after GREEN]
- Mocking: none | [why unavoidable]

Steps:
1. RED: [write exact failing test]
   Command: `$TEST_CMD`
   Expected: FAIL
2. GREEN: [write minimal implementation]
   Command: `$TEST_CMD`
   Expected: PASS
3. REFACTOR: [safe cleanup or "none"]
4. VERIFY:
   - `$TEST_CMD`
   - `$LINT_CMD` (skip if none)

Checkpoint:
- Files: `path/to/test-file.ext path/to/source-file.ext`
- Commit: `type: short description`
```

Task status values:
- `pending` — not started
- `in_progress` — executor is working on it
- `completed` — done and checkpointed
- `stuck` — executor hit max retries or blocker

### 5. Validate

- [ ] Blast radius files covered
- [ ] Code style matches conventions
- [ ] Test commands real (from detect-project.sh)
- [ ] Hub nodes have review steps
- [ ] No placeholders
- [ ] Every task uses `## Task N:` heading
- [ ] Every task has `Status:`, `Risk:`, `Dependencies:`, `Files:`, `Acceptance:`, `TDD:`, `Steps:`, `Checkpoint:`
- [ ] Every behavior task has expected RED failure reason
- [ ] Every behavior task is one behavior only

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

### 7. Review Plan Document

After saving plan, dispatch independent plan reviewer:

```
Agent(
  subagent_type="supergraph:plan-reviewer",
  description="Review plan: [plan-name]",
  prompt="Review implementation plan at docs/superpowers/plans/[plan-file].md.

Spec/Requirements:
[user request or spec path]

Graph Context Summary:
- Blast radius: [list]
- Hub nodes: [list]
- Bridge nodes: [list]
- Communities crossed: [list]
- Surprising connections: [list]
- Affected flows: [list]

Review for:
- Completeness
- Spec alignment
- Task decomposition
- Buildability
- TDD metadata
- Graph-aware safety

Output exactly:
## Plan Review

**Status:** Approved | Issues Found

**Issues (if any):**
- [Task X, Step Y]: [specific issue] - [why it matters]

**Recommendations (advisory, do not block approval):**
- [suggestion]"
)
```

If reviewer returns `Issues Found`:

- Revise plan
- Re-run plan reviewer
- Do not hand off to execute until `Approved`

If reviewer returns `Approved`, append review result to plan:

```markdown
## Plan Review

**Status:** Approved
**Reviewed by:** supergraph:plan-reviewer
**Reviewed at:** [timestamp]

**Issues:** none

**Recommendations:**
- [advisory items or none]
```

### 8. Handoff

> "Plan saved and reviewed. Next: `/supergraph:execute plan <slug>` to dispatch executor agent, or `/supergraph:tdd` for single-task implementation."

## Rules

- Codebase first, plan second
- Environment Context mandatory — executor depends on it
- Exact file paths, commands, code
- Task headings must stay `## Task N:` for executor parsing
- Task status must be updated by executor (`pending`, `in_progress`, `completed`, `stuck`)
- No placeholders
- Never execute code — only plan
