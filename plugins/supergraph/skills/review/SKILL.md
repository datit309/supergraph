---
name: review
description: Plan-aware graph-enhanced code review before merge. CRITICAL issues block merge. Use after fix/verify.
mcp: code-review-graph
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
```
mcp__code-review-graph__detect_changes_tool()
mcp__code-review-graph__get_impact_radius_tool(files=[changed], depth=3)
mcp__code-review-graph__get_surprising_connections_tool()
mcp__code-review-graph__get_affected_flows_tool(files=[changed])
mcp__code-review-graph__get_knowledge_gaps_tool()
```
Per file: `query_graph(query_type="tests", target=file)`.

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

Plan requirements: [task sections or none]

Focus: plan alignment, bugs, security, architecture, tests, graph risks.
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
