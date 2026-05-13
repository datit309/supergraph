---
name: review
description: Plan-aware graph-enhanced code review before merge. Validates tests, lint, graph health, and plan completion. CRITICAL issues block merge.
---

# Skill: Review

Final gate before merge. Graph-enhanced review with plan awareness. CRITICAL issues block merge.

## Prerequisites

- `/supergraph:fix` completed (tests pass, lint clean)
- Or manual implementation with tests/lint passing

## Usage

```bash
/supergraph:review
/supergraph:review plan auth-login
/supergraph:review plan auth-login task 2
```

## Steps

### 0. Announce

Start by saying:

> "🔍 /supergraph:review — starting graph-enhanced code review..."

### 1. Select Plan Context (optional but preferred)

Check for plan files:

```bash
ls docs/superpowers/plans/*.md
```

Plan selection rules (same as fix):

- 0 plans → continue without plan context
- 1 plan → use it
- >1 plans + no `plan <slug>` arg → STOP and ask user to choose
- `plan <slug>` → match filename containing slug

If plan is selected:

- Read `## Environment Context`
- Parse tasks by `## Task N:` headings
- If `task N` provided → review only that task scope
- Otherwise review all changed files and validate plan completion

### 2. Capture Git Range

Determine review range:

```bash
BASE_SHA=$(git rev-parse origin/master 2>/dev/null || git rev-parse origin/main 2>/dev/null || git rev-parse HEAD~1)
HEAD_SHA=$(git rev-parse HEAD)
git diff --stat "$BASE_SHA..$HEAD_SHA"
git diff --name-only "$BASE_SHA..$HEAD_SHA"
```

If plan context exists and has checkpoint commits, use those as range instead.

If no changed files → check plan for incomplete tasks. If all complete → nothing to review.

### 3. Graph Analysis

Call minimal context first, then detailed analysis:

```text
mcp__code-review-graph__get_minimal_context_tool()
mcp__code-review-graph__detect_changes_tool()
mcp__code-review-graph__get_impact_radius_tool(files=[changed], depth=3)
mcp__code-review-graph__get_hub_nodes_tool()
mcp__code-review-graph__get_bridge_nodes_tool()
mcp__code-review-graph__list_communities_tool()
mcp__code-review-graph__get_surprising_connections_tool()
mcp__code-review-graph__get_knowledge_gaps_tool()
mcp__code-review-graph__get_affected_flows_tool(files=[changed])
mcp__code-review-graph__get_suggested_questions_tool()
```

For each changed file:

```text
mcp__code-review-graph__query_graph_tool(query_type="tests", target="file")
mcp__code-review-graph__refactor_tool(action="suggestions", files=[file])
```

### 4. Dispatch Independent Code Reviewer

Say:

> "⏳ Reviewing code with `code-reviewer` agent..."

Spawn `code-reviewer` agent with self-contained context:

```
Agent(
  subagent_type="supergraph:code-reviewer",
  description="Independent code review: [plan-name or scope]",
  prompt="Review changes from BASE_SHA to HEAD_SHA.

BASE_SHA: [base_sha]
HEAD_SHA: [head_sha]

Description:
[what was implemented - from plan tasks or user description]

Plan/Requirements:
[selected plan section or task sections]

Graph Context Summary:
- Changed files: [list]
- Blast radius: [N files]
- Hub nodes affected: [list or none]
- Bridge nodes affected: [list or none]
- Communities crossed: [list or none]
- Surprising connections: [list or none]
- Affected flows: [list or none]
- Knowledge gaps: [list or none]

Commands:
git diff --stat $BASE_SHA..$HEAD_SHA
git diff $BASE_SHA..$HEAD_SHA

Focus:
- Plan alignment
- Bugs/security/data loss
- Architecture/design
- Tests/coverage
- Production readiness
- Graph risks (hub/bridge/surprise/flows)

Output format:
- Strengths
- Critical issues (must fix)
- Important issues (should fix)
- Minor issues (nice to have)
- Recommendations
- Verdict: YES | WITH_FIXES | NO"
)
```

Wait for reviewer to complete.

### 5. Verify Tests + Lint

```bash
eval "$(bash bin/detect-project.sh)"
$TEST_CMD
$LINT_CMD
```

If either fails → add to Critical issues.

### 6. Combine Findings

Merge code-reviewer findings with graph analysis:

**Critical issues (block merge):**
- Code-reviewer Critical issues
- Tests fail
- Lint fails
- New circular dependencies (from graph)
- Broken hub node API (from graph)
- Surprise score > 0.7 without justification (from graph)
- Plan has `Status: in_progress` tasks

**Important issues (fix recommended):**
- Code-reviewer Important issues
- High surprise (0.5-0.7) without documentation (from graph)
- Missing tests for changed hotspots (from graph)
- Changed bridge node without cross-community validation (from graph)
- Plan has `Status: stuck` tasks without investigation

**Minor issues (note only):**
- Code-reviewer Minor issues
- Clean graph structure (from graph)
- Good coverage (from graph)

### 7. Review Checklist

#### Blast Radius

- All affected files in blast radius handled?
- Unexpected files in blast radius? Investigate why.

#### Hub Safety

- Hub nodes modified?
  - All callers tested?
  - API unchanged or backward-compatible?
  - Breaking changes documented?

#### Bridge Nodes

- Bridge nodes modified?
  - Cross-community impact assessed?
  - Changes justified and minimal?

#### Surprise Connections

- Surprise score > 0.7 → CRITICAL: investigate unexpected coupling
- Surprise score 0.5-0.7 → WARNING: document reason or refactor
- Surprise score < 0.5 → INFO: acceptable

#### Knowledge Gaps

- Changed files are untested hotspots → WARNING: add tests or accept risk
- New code without tests → WARNING: add tests

#### TDD Evidence

- Every behavior task has RED evidence?
- RED failed for expected missing behavior?
- GREEN implementation was minimal?
- Bug fixes include regression tests?
- Tests assert behavior rather than implementation details?
- Mocks avoided unless necessary?
- Implementation does not exceed tested behavior?

#### Testing Anti-Patterns

Use `skills/tdd/testing-anti-patterns.md` as checklist:

- Tests validate real behavior, not mock artifacts?
- No production APIs exist only for tests?
- Mocks isolate external/slow/flaky boundaries only?
- Fake responses/fixtures match real schemas?
- Mock setup is not larger than behavior under test?
- Integration tests are used when mocks become too complex?

#### Plan Completion (if plan context exists)

- All tasks `Status: completed` or `Status: stuck`?
- No tasks left `Status: in_progress`?
- Stuck tasks documented with reason?

### 8. Progress Indicator (while agent running)

If dispatching `code-reviewer` agent takes noticeable time, say:

> "⏳ Waiting for `code-reviewer` agent... [N seconds]"

### 9. Act on Feedback

**Critical issues:**
- Fix immediately
- Cannot merge until resolved
- No exceptions

**Important issues:**
- Fix before proceeding unless user explicitly accepts risk
- If disagreeing with reviewer: push back with technical evidence, tests, or code proof
- Request clarification if issue is unclear

**Minor issues:**
- Note for later
- Optional to fix now
- Can merge with Minor issues present

**If disagreeing with reviewer:**
- Provide technical reasoning
- Show code/tests proving functionality
- Request specific clarification
- Do not ignore valid technical feedback

### 9. Generate Verdict

```markdown
## Combined Review Report

### Code Reviewer Assessment
Verdict: [YES | WITH_FIXES | NO]
Strengths: [list]
Critical: [count]
Important: [count]
Minor: [count]

### Graph Analysis
- Plan: [path or none]
- Scope: [all | task N]
- Changed: N files | Blast radius: M files
- Hub nodes: [list or none]
- Bridge nodes: [list or none]
- Communities crossed: [list or none]
- Surprising connections: [list or none]
- Affected flows: [list or none]
- Tests: PASS|FAIL
- Lint: PASS|FAIL

### Combined Issues
Critical: [count] | Important: [count] | Minor: [count]

[detailed list with file:line references]

### Final Verdict
PASS | NEEDS_CHANGES | BLOCKED

Reasoning: [combine code-reviewer reasoning + graph risks]
```

**Verdict rules:**

- `PASS` → 0 Critical, code-reviewer verdict YES, ready to merge
- `NEEDS_CHANGES` → 0 Critical, but >0 Important or code-reviewer verdict WITH_FIXES
- `BLOCKED` → >0 Critical or code-reviewer verdict NO, cannot merge

### 10. Update Plan (if plan context exists)

If verdict is `BLOCKED`:

- Log blockers to plan file under affected task(s):

```markdown
## Task N: [Name]
Status: stuck

> ⚠️ BLOCKED by review
> Issues:
> - [issue 1]
> - [issue 2]
> Last reviewed: 2026-05-12T10:29:44Z
```

If verdict is `PASS` and all tasks reviewed:

- Ensure all reviewed tasks are `Status: completed`
- Add review timestamp to plan:

```markdown
## Review

- Date: 2026-05-12T10:29:44Z
- Verdict: PASS
- Reviewed by: supergraph:review
```

### 11. Handoff

**PASS:**

- Ready to merge
- Suggest: `git push` or create PR via `gh pr create`

**NEEDS_CHANGES:**

- Return to `/supergraph:fix [same plan/scope]` with issue list
- Max 2 fix-review cycles
- After 2 cycles still not PASS → escalate to human

**BLOCKED:**

- Escalate to human immediately
- Do not attempt auto-fix
- Issues logged to plan if plan context exists

## Rollback Path

If review returns `NEEDS_CHANGES`:

1. List specific issues from review
2. Run `/supergraph:fix [same plan/scope]` with issue list
3. Fix → re-run `/supergraph:review [same plan/scope]`
4. Max 2 cycles
5. If still not PASS after 2 cycles → escalate to human

## Rules

- Always dispatch independent `code-reviewer` agent
- Reviewer gets self-contained context, never session history
- Always capture BASE_SHA and HEAD_SHA review range
- Critical issues block merge — no exceptions
- Important issues must be fixed unless user accepts risk
- Minor issues are optional
- Hub/bridge changes need extra scrutiny
- This is the final gate before merge
- After 2 fix-review cycles still blocked → stop, escalate
- Always update plan status when plan context exists
- Never pass review if tests or lint fail
- Surprise connections must be investigated or documented
- If disagreeing with reviewer, push back with technical evidence, not opinion
