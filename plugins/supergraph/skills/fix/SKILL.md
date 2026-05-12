---
name: fix
description: Plan-aware auto-fix loop after coding. Runs tests, lint, format, and graph checks. Updates plan task status. Use after execute/tdd.
---

# Skill: Fix

Plan-aware auto-fix loop. Ensure tests pass, lint is clean, formatting applied, graph risks handled, and plan status updated.

When failures are unclear or repeated attempts fail, apply `skills/fix/systematic-debugging.md` before changing code again.

## Prerequisites

- Implementation has been attempted via `/supergraph:execute` or `/supergraph:tdd`
- Commands available from `/supergraph:context` or plan `## Environment Context`

## Usage

```bash
/supergraph:fix
/supergraph:fix plan auth-login
/supergraph:fix plan auth-login task 2
```

## Steps

### 1. Select Plan Context (optional but preferred)

Check for plan files:

```bash
ls docs/superpowers/plans/*.md
```

Plan selection rules:

- 0 plans → continue without plan context
- 1 plan → use it
- >1 plans + no `plan <slug>` arg → STOP and ask user to choose
- `plan <slug>` → match filename containing slug
- Multiple matches → STOP and ask for more specific slug

If plan is selected:

- Read `## Environment Context`
- Parse tasks by `## Task N:` headings
- If `task N` provided → fix only that task context
- Otherwise fix all changed files and any `Status: in_progress` or `Status: stuck` tasks

### 2. Get Commands

Prefer commands from selected plan's Environment Context. If absent:

```bash
eval "$(bash bin/detect-project.sh)"
```

If command is missing or empty, skip that phase and report it as `SKIP`.

### 3. Get Changed Files + Impact Radius

```bash
git diff --name-only
git diff --cached --name-only
```

Use changed + staged files as input to code-review-graph. Call minimal context first:

```text
mcp__code-review-graph__get_minimal_context_tool()
mcp__code-review-graph__get_impact_radius_tool(files=[changed_files], depth=3)
mcp__code-review-graph__query_graph_tool(query_type="tests", target="each_changed_file")
mcp__code-review-graph__get_affected_flows_tool(files=[changed_files])
```

If no changed files and no in-progress/stuck plan tasks → STOP: nothing to fix.

### 4. Auto-Fix Loop (max 3 iterations)

For each iteration:

#### A. Tests

Run targeted tests first if graph returns test files; otherwise run `$TEST_CMD`.

- PASS → continue
- FAIL → read failing output, trace to source, fix source
- Do not modify tests unless the test is demonstrably wrong

#### B. Lint

Run `$LINT_CMD` if available.

- PASS/SKIP → continue
- FAIL → fix lint issues

#### C. Format

Run `$FORMAT_CMD` if available.

- Formatting changes are allowed
- Re-run lint if formatter changed files

#### D. Graph Checks

```text
mcp__code-review-graph__detect_changes_tool()
mcp__code-review-graph__get_surprising_connections_tool()
mcp__code-review-graph__get_knowledge_gaps_tool()
mcp__code-review-graph__refactor_tool(action="dead_code")
```

Treat results:

- New cycle or broken dependency → CRITICAL
- Surprise score > 0.7 → CRITICAL
- Surprise score 0.5-0.7 → WARNING
- Changed hub/bridge node without tests → WARNING
- Untested changed hotspot → WARNING

#### E. Decide

- CRITICAL → fix and continue loop
- WARNING → fix if practical; otherwise record for review
- Tests/lint fail → continue loop
- Everything clean → break

### 5. Update Plan Status

If plan context exists:

- Fix succeeded and scoped task exists → set `Status: completed`
- Fix succeeded and in-progress tasks exist → set those tasks to `completed`
- Fix failed after 3 iterations → set affected task(s) to `stuck` and append:

```markdown
> ⚠️ STUCK: fix loop exhausted
> Issues: [summary]
> Last checked: 2026-05-12T10:29:26Z
```

Never mark a task completed if tests or lint fail.

### 6. Final Report

```markdown
## Auto-Fix Report
- Plan: [path or none]
- Scope: [all changed files | task N | tasks N,M]
- Iterations: N/3
- Tests: PASS|FAIL|SKIP
- Lint: PASS|FAIL|SKIP
- Format: PASS|SKIP
- Graph: PASS|WARNING|CRITICAL
- Plan status updated: yes|no

Issues:
- [list or "none"]

Next: /supergraph:verify [same plan/scope] → /supergraph:review [same plan/scope]
```

## Rules

- Max 3 fix iterations
- Never commit broken code
- Never use `git add -A`; use exact files only if staging is needed
- Never hide failures by weakening tests
- Prefer source fixes over test edits
- Always update selected plan status when plan context exists
- CRITICAL graph findings must be fixed or escalated
- Warnings must be fixed or explicitly reported to review
