---
name: review
description: Plan-aware graph-enhanced code review before merge. CRITICAL issues block merge. Use after fix/verify.
mcp: codebase-memory-mcp
---

# /supergraph:review

Final gate before merge. Graph-enhanced review with plan awareness.

## Prerequisites

- `/supergraph:fix` completed (tests pass, lint clean)

## Usage

`/supergraph:review` | `plan auth-login` | `plan auth-login task 2`

## Steps

### 0. Announce
"🔍 /supergraph:review — starting graph-enhanced code review..."

### 1. Select Plan Context
0 plans → skip | 1 → use | >1 → ask | `plan <slug>` → match.
Parse tasks, scope to `task N` if provided.

### 2. Capture Git Range
```bash
BASE_SHA=$(git rev-parse origin/master || git rev-parse origin/main || git rev-parse HEAD~1)
HEAD_SHA=$(git rev-parse HEAD)
git diff --stat "$BASE_SHA..$HEAD_SHA" && git diff --name-only "$BASE_SHA..$HEAD_SHA"
```
Use plan checkpoint commits as range if available. No changed files → check plan for incomplete tasks.

### 3. Graph Analysis
Reindex changed files first so graph reflects current code (not stale pre-edit state):
```
index_status(project=CBM_PROJECT); stale/degraded → index_repository(repo_path=<absolute>, name=CBM_PROJECT, mode=CBM_INDEX_MODE)
```
```
detect_changes(project=CBM_PROJECT)
trace_path(project=CBM_PROJECT, mode="inbound/outbound/data_flow")
# After get_graph_schema, run validated cycles, hubs, bridges, test-gaps,
# complexity, and cross-boundary recipes.
```
Per file: `query_graph(query_type="tests", target=file)`.

**3b. Serena code intelligence (optional):**
If `/supergraph:scan` was not run this session, call `mcp__serena__initial_instructions()` first.
For each changed symbol/function:
```
mcp__serena__find_referencing_symbols(symbol=<changed_symbol>)
mcp__serena__find_implementations(symbol=<changed_symbol>)
```
For each changed file:
```
mcp__serena__get_diagnostics_for_file(file=<changed_file>)
```
Pass results to code-reviewer agent prompt under "Serena findings: [callers, implementations, diagnostics]".
Skip gracefully if Serena unavailable — log "Serena unavailable, skipping code intelligence".

### 4. Dispatch Code Reviewer (2-Stage Review)

**Stage 1 — Spec Compliance:** Verify implementation matches plan requirements.
**Stage 2 — Code Quality:** Verify code is clean, tested, maintainable.

Never start code quality review before spec compliance is verified.

```
Agent(
  subagent_type="supergraph:code-reviewer",
  description="Independent review: [plan-name or scope]",
  prompt="Review BASE_SHA..HEAD_SHA. First verify spec compliance, then code quality.

BASE_SHA: [base] | HEAD_SHA: [head]

Changes:
[git diff --stat + git diff output]

Graph context:
- Hub/Bridge affected: [list/none]
- Surprise connections: [list/none]
- Affected flows: [list/none]
- Knowledge gaps: [list/none]

Serena findings (if available):
- find_referencing_symbols: [callers per changed symbol]
- get_diagnostics_for_file: [diagnostics per changed file]

Plan requirements: [task sections or none]

Focus: plan alignment, bugs, security, architecture, tests, graph risks, Serena diagnostics (if provided).
Output: strengths, Critical, Important, Minor, verdict (YES|WITH_FIXES|NO)"
)
```

### 5. Verify Tests + Lint
Run `$TEST_CMD` and `$LINT_CMD`. Failures → add to Critical.

### 6. Classify Issues

| Severity | Sources | Action |
|---|---|---|
| **Critical** | Reviewer Critical, tests/lint fail, circular deps, broken hub API, surprise>0.7, `in_progress` tasks | Block merge |
| **Important** | Reviewer Important, surprise 0.5-0.7, missing hotspot tests, bridge node without validation, `stuck` tasks | Fix unless risk accepted |
| **Minor** | Reviewer Minor, clean graph, good coverage | Note only |

### 7. Apply Checklist

| Gate | Check |
|---|---|
| **Blast radius** | All affected files handled? Unexpected files? |
| **Hub safety** | Callers tested? API backward-compatible? Breaking changes documented? |
| **Bridge nodes** | Cross-community impact assessed? |
| **Surprise** | >0.7: investigate coupling. 0.5-0.7: document or refactor. <0.5: ok |
| **Knowledge gaps** | Untested hotspots changed? Add tests or accept risk |
| **TDD** | RED/GREEN evidence per behavior? Regression tests for bugs? Tests assert behavior not internals? |

### 8. Act on Feedback

Critical → fix immediately, no exceptions.
Important → fix unless user accepts risk. Push back with evidence, not opinion.
Minor → note, optional.

**When human gives review feedback:**
- Clarify ALL unclear items first, implement together
- Grep codebase before implementing suggested "professional" features (YAGNI)
- Push back gracefully if reviewer is wrong — technical reasoning + tests/proof
- Never performative agreement ("You're absolutely right!")

### 9. Generate Verdict

```markdown
## Review Report
- Verdict: PASS | NEEDS_CHANGES | BLOCKED
- Changed: N files | Blast radius: M
- Hub/Bridge: [list/none] | Surprise: [list/none]
- Tests: PASS|FAIL | Lint: PASS|FAIL
- Critical: N | Important: N | Minor: N
- Reasoning: [summary]
```

Verdict rules:
- `PASS` → 0 Critical, reviewer YES
- `NEEDS_CHANGES` → 0 Critical, >0 Important or reviewer WITH_FIXES
- `BLOCKED` → >0 Critical or reviewer NO

### 10. Update Plan

PASS + all tasks reviewed → mark `Status: completed`, add review log.
BLOCKED → mark affected tasks `stuck`, append blocker list.

### 10b. Update CONTEXT.md (if review surfaced new domain invariants)

If review revealed undocumented domain rules, invariants, or terminology:
```bash
printf '\n## <term or invariant>\n[what was discovered]\n' >> CONTEXT.md
```
Examples: hidden ordering constraints, shared state assumptions, boundary rules between modules.

**Serena memory (optional — for non-PASS verdicts):**
On BLOCKED or NEEDS_CHANGES, persist findings for the next fix cycle:
```
mcp__serena__write_memory(
  title="<plan-slug>-review-verdict",
  content="Verdict: [BLOCKED|NEEDS_CHANGES]. Critical: [...]. Callers affected: [...]. Diagnostics: [...]"
)
```
Skip if Serena unavailable or verdict is PASS.

### 11. Handoff

PASS → ready to merge.
NEEDS_CHANGES → `/supergraph:fix`, then re-review. Max 2 cycles, then escalate.
BLOCKED → escalate immediately, no auto-fix.

## Rules

- Always dispatch independent code-reviewer agent
- Critical issues block merge — no exceptions
- Hub/bridge changes need extra scrutiny
- Max 2 fix-review cycles, then escalate
- Never pass if tests or lint fail
- Surprise connections must be investigated or documented
