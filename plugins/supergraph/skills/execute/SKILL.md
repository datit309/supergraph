---
name: execute
description: Dispatch and execute implementation plans with TDD and checkpoints. Use when plan is ready. Parallel by default for independent tasks.
mcp: code-review-graph
---

# /supergraph:execute

Dispatch plan tasks with TDD. Parallel by default when tasks are independent.

Usage: `/supergraph:execute` | `task N` | `tasks N,M` | `from task N` | `plan auth-login task 2` | `plan auth-login sequential`

## Steps

### 0. Announce
"I'm using /supergraph:execute to implement this plan."

### 1. Load Context
- `/supergraph:scan` should already be done. If `.supergraph-env` missing → STOP: "Run `/supergraph:scan` first."
- Commands from `.supergraph-env` (if present) or plan `## Environment Context`

### 2. Select Plan
Count plan files in `docs/supergraph/plans/*.md`:

| Count | Action |
|---|---|
| 0 | STOP: "Run `/supergraph:plan` first" |
| 1 | Auto-select |
| >1, no `plan <slug>` arg | STOP: list plans, ask user |
| `plan <slug>` provided | Match filename. If >1 match ask. |

Parse task scope: `task N`, `tasks N,M,K`, `from task N`, or all incomplete.
Parse `sequential` flag → force sequential mode.

### 3. Critical Review
Read plan before dispatch:
- Has `## Environment Context`?
- Selected tasks have all required fields (Status, Risk, Dependencies, Files, Acceptance, TDD, Steps, Checkpoint)?
- Commands real, not placeholders? File paths exact?
- Plan-reviewer returned `Approved` (or user explicitly approved)?

If missing or not Approved → STOP, dispatch `supergraph:plan-reviewer`, wait for Approval.
Also check: plan has user approval step (step 11)? If not → ask user: "Plan was not reviewed by you. Proceed anyway? [yes / no]"
Check dependencies: Task X depends on Task Y → is Y `Status: completed`? If not → STOP.
**If any concern: STOP, ask. Never guess.**

### 4. Branch Protection
If main/master → STOP, suggest new branch or worktree.
User approves → continue.

### 5. Determine Execution Mode

| Condition | Mode |
|---|---|
| No file overlap + no dependencies | Parallel (one agent per task) |
| Any dependency/overlap | Sequential |
| Uncertain | Ask user |

### 6. Dispatch Executor(s)

Shared executor instructions (apply to both modes):
```
- Call mcp__serena__initial_instructions() once before any Serena tool (skip if scan ran this session)
- Per task: RED → GREEN → REFACTOR → Lint → Format
- After GREEN: mcp__serena__get_diagnostics_for_file() per modified file (skip if Serena unavailable)
- Prefer Serena surgery: replace_symbol_body(), rename_symbol(), insert_after/before_symbol() over raw edits
- Commit ONCE after all tests pass using Checkpoint from plan
- Max 3 retries per step → mark stuck
- Stop and ask on: unclear instruction, missing file, placeholder, any blocker
```

**Sequential:** `Agent(subagent_type="supergraph:executor")` — run baseline tests first, execute tasks IN ORDER respecting dependencies, report tasks done/stuck + files changed + risks.

**Parallel:** one `Agent(subagent_type="supergraph:executor")` per task — each gets self-contained Task N section + Environment Context. Do NOT edit files outside Task N scope. Do NOT refactor unrelated code. Spawn all in one message.

### 7. Post-Execution Integration Safety
```bash
git diff --name-only  # check for same-file edits by different agents
```
If overlap: `index_incremental(files=[overlapping])` → `detect_changes_tool()` + `get_surprising_connections_tool()`

Serena conflict check (optional): `find_referencing_symbols()` on symbols changed by multiple agents. Skip if Serena unavailable.

If conflicts → STOP: review manually / revert & retry sequential / keep X & redo Y.

### 8. Final Verification
Run `$TEST_CMD`, `$LINT_CMD`, `$BUILD_CMD`. Run `mcp__code-review-graph__build_or_update_graph_tool()`.

### 9. Handoff
`/supergraph:fix` → `/supergraph:integration` → `/supergraph:verify` → `/supergraph:review`

### 10. Report
```
✅ Execution Complete
Plan: [path] | Scope: [tasks]
Tasks: N/N done | Stuck: [none | list]
Tests: PASS | Lint: PASS | Graph: updated
```
Announce completion in user's language.

## Stop Conditions (Ask Instead of Guessing)
- Plan not found or ambiguous | Missing Environment Context | Unclear instruction or placeholder
- Branch is main/master without permission | Baseline tests fail | Dependency not completed
- Agent stuck after 3 retries

## Rules
- Parallel when zero file overlap + no dependencies | Sequential for dependencies
- One commit per task, NEVER mid-TDD | Never `git add -A`
- Max 3 retries per step | Self-contained prompt per parallel agent
- Always verify after parallel | Always review plan before dispatch
- Never create plan — only execute
- Prefer Serena symbol tools over text edits when available
