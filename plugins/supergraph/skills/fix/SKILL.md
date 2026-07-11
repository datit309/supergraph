---
name: fix
description: Plan-aware auto-fix loop after coding. Runs tests, lint, format, and graph checks. Updates plan task status. Use after execute/tdd.
mcp: codebase-memory-mcp
---

# /supergraph:fix

Plan-aware auto-fix loop. Ensure tests pass, lint clean, format applied, graph risks handled.

## Usage

`/supergraph:fix` | `/supergraph:fix plan auth-login` | `/supergraph:fix plan auth-login task 2`

## Steps

### 0. Announce
"🔧 /supergraph:fix — starting auto-fix loop..."

### 1. Select Plan Context

0 plans → skip | 1 → use | >1 → ask | `plan <slug>` → match.
Read `## Environment Context`, fix scoped task or all in-progress/stuck tasks.

### 2. Get Commands

Read from plan `## Environment Context` or `.supergraph-env` (set by `/supergraph:scan`). Missing → STOP, run scan first.
Missing command → skip phase, report as `SKIP`.

### 3. Get Changed Files

```bash
git diff --name-only && git diff --cached --name-only
```
Reindex changed files before graph analysis (graph may be stale after edits):
```
index_status(project=CBM_PROJECT); if stale/degraded, index_repository(repo_path=<absolute>, name=CBM_PROJECT, mode=CBM_INDEX_MODE)
```
Graph: project-scoped `detect_changes`, `trace_path` call/data-flow, and validated
`cycles`, `test-gaps`, `complexity`, and `cross-boundary` recipes.
No changed files and no in-progress/stuck tasks → STOP: nothing to fix.

### 3b. Serena pre-loop diagnostics (optional)

If `/supergraph:scan` was not run this session, call `mcp__serena__initial_instructions()` first. Skip entire step if `SERENA_ACTIVE=false` in `.supergraph-env`.

Before starting the fix loop, triage IDE-level errors with Serena:
```
for each changed_file:
    mcp__serena__get_diagnostics_for_file(file=changed_file)
```
Fix any type errors found before entering the loop — reduces iterations by catching obvious errors early.
Skip if Serena unavailable.

### 4. Auto-Fix Loop (max 3 iterations)

At iteration start: "🔧 Fix iteration N/3 — running tests..."

| Phase | Action |
|---|---|
| **Reproduce** | Smallest failing command + expected vs actual. Classify: assertion / crash / timeout / env / data pollution / race. |
| **Tests** | Run targeted tests (from graph) else `$TEST_CMD`. FAIL → trace to root cause, fix source. Don't modify tests unless demonstrably wrong. |
| **Serena fix** | After source fix: `mcp__serena__get_diagnostics_for_file(file=<fixed_file>)` — confirm fix didn't introduce new type errors before re-running suite. For body fixes: prefer `mcp__serena__replace_symbol_body(symbol=<fn>)`. For renames: `mcp__serena__rename_symbol(old, new)`. Skip if Serena unavailable. |
| **Format+Lint** | `$FORMAT_CMD` then `$LINT_CMD`. If format changed files → re-run lint. |
| **Graph** | Check `index_status`; stale/degraded triggers `index_repository`. Then `detect_changes`, `trace_path`, and contract recipes `cycles`, `test-gaps`, `complexity`, `cross-boundary`. CRITICAL → fix. WARNING → fix or record. |
| **Decide** | All clean → break. Tests/lint fail → continue loop. |

### 5. Update Plan Status (if plan exists)

- Succeeded → `Status: completed`
- Failed after 3 → `stuck` + append STUCK log
- Never mark completed if tests or lint fail

### 6. Report

```
## Auto-Fix Report
- Iterations: N/3 | Tests: PASS|FAIL|SKIP | Lint: PASS|FAIL|SKIP | Format: PASS|SKIP
- Graph: PASS|WARNING|CRITICAL | Plan status: updated|none
- Issues: [list or "none"]
Next: /supergraph:verify → /supergraph:review
```

## Rules

- Max 3 fix iterations
- Never commit broken code
- Never use `git add -A`
- Never hide failures by weakening tests
- Prefer source fixes over test edits
- CRITICAL graph findings: fix or escalate
- Warnings: fix or report
- Prefer `mcp__serena__replace_symbol_body` for body fixes and `mcp__serena__rename_symbol` for renames when Serena is available
