---
name: plan
description: Create graph-informed implementation plans before writing code. Use before any non-trivial task. Skip for small changes (1-2 files, <10 lines).
mcp: code-review-graph
---

# /supergraph:plan

Scan codebase, map blast radius, create machine-readable plan.

Announce: "📐 /supergraph:plan — scanning codebase, creating plan..."

## Quick Gate
< 10 lines, 1 file, no hub/bridge nodes → skip to `/supergraph:tdd`.

## Steps

**1. Read the codebase (MANDATORY before planning):**
- Read config file → language, framework, versions
- Read 2-3 source files near target area → naming, imports, error handling
- Read 1-2 test files → test structure, assertion style

**2. Ensure graph:**
Reuse graph context from `/supergraph:scan`. If scan not done → run `/supergraph:scan` first.
If graph stale (files changed since last index) → `build_or_update_graph_tool()`.

**3. Graph analysis:**
```
mcp__code-review-graph__get_impact_radius_tool(files=[targets], depth=3)
mcp__code-review-graph__get_hub_nodes_tool()
mcp__code-review-graph__get_bridge_nodes_tool()
mcp__code-review-graph__query_graph_tool(query_type="tests", target="file")
mcp__code-review-graph__get_affected_flows_tool(files=[targets])
```
Fetch additional context (communities, surprising connections) only if task crosses boundaries.

**3b. Serena symbol analysis (optional — deepens blast radius):**
If `/supergraph:scan` was not run this session, call `mcp__serena__initial_instructions()` first.
For key symbols in target files:
```
mcp__serena__find_referencing_symbols(symbol=<key_symbol>)
mcp__serena__find_implementations(symbol=<interface_or_abstract>)
```
Cross-reference with graph blast radius — add any missed callers to task `Blast radius` fields.
Skip gracefully if Serena unavailable — log "Serena unavailable, skipping symbol analysis".

**4. Discuss approach with user (MANDATORY, use user's language):**
Before creating tasks, present findings from steps 1-3 to the user:
- What was found in codebase (naming, conventions, patterns)
- Graph risk (blast radius, hubs, bridges affected)
- Proposed task breakdown (just summaries, not full tasks yet)

Ask for approval in the user's language. If user disagrees with approach → revise.
If user wants changes → incorporate, then re-present.
**Do not proceed to step 5 until user approves the approach.**

**5. Create plan tasks** — each task 2-5 min. Use exact machine-readable format:

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

Task status values: `pending`, `in_progress`, `completed`, `stuck` (managed by executor)

**6. Validate:**
- [ ] Every task uses `## Task N:` heading exactly
- [ ] Every task has all 8 fields: Status, Risk, Dependencies, Files, Acceptance, TDD, Steps, Checkpoint
- [ ] No placeholders (TBD, TODO, "add validation", "similar to Task N")
- [ ] Test commands real (from .supergraph-env)
- [ ] Hub nodes have review steps
- [ ] Each behavior task has expected RED failure reason
- [ ] NO indentation under field lines — `Status: pending` starts at column 0, not spaces
- [ ] No extra blank lines between fields within a task section

**7. Save plan:** `docs/superpowers/plans/YYYY-MM-DD-<slug>.md`

**8. Analysis Review Gate (if /supergraph:analyze was used):**
If analyze step was completed — verify plan aligns with documented analysis decisions:
```markdown
## Analysis Decisions
- Approach: [chosen approach from analyze step]
- Alternatives rejected: [from analyze step with reasons]
```
If analysis was skipped for ambiguous task → WARN user: "No analyze step — proceeding with plan as-is."

**9. Environment Context (MANDATORY at plan end):**
```markdown
## Environment Context
- **Language:** [X] v[Y]
- **Test command:** [from .supergraph-env]
- **Linter command:** [from .supergraph-env]
- **Formatter command:** [from .supergraph-env]
- **Build command:** [from .supergraph-env]
- **Branch:** [current]
- **Conventional commit style:** [e.g., "feat: / fix:"]

**Codebase conventions:** [naming, imports, error handling, test structure]

**Graph Context:**
- Blast radius: M files | Hub nodes: [list]
- Bridge nodes: [list] | Communities crossed: [list]
```

**10. Auto-review:**
Dispatch `supergraph:plan-reviewer` subagent. Fix issues. Do not hand off to execute until `Approved`.

**11. User Review Gate (MANDATORY):**
Present plan summary to user:
```
Plan: [plan path]
Tasks: N ([list summaries])
Blast radius: M files | Hub nodes affected: [list/none]
Review: Approved (by plan-reviewer)
```
Ask user for approval in their language: "[yes / modify / reject]"
If modify → incorporate feedback, re-run auto-review.
If rejected → ask for direction, return to design.

**12. Report:**
```
✅ /supergraph:plan complete
- Plan: docs/superpowers/plans/YYYY-MM-DD-<slug>.md
- Tasks: N | Blast radius: M files | Review: Approved
- User: yes | modify | rejected
- Next: /supergraph:execute plan <slug> (multi-task) or /supergraph:tdd (single-task)
```

## Rules
- Codebase first, plan second — never plan blindly
- Environment Context mandatory — executor depends on it
- Exact file paths, commands, code — no vagueness
- Task headings stay `## Task N:` for executor parsing
- No placeholders, no "TBD", no "similar to Task X"
- Never execute code — only create plans
