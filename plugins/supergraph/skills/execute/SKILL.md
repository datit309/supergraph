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
Count plan files in `docs/superpowers/plans/*.md`:

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
- Commands real, not placeholders?
- Steps clear enough to execute without guessing?
- File paths exact, not `[file]`?
- Plan-reviewer returned `Approved` (or user explicitly approved)?

If missing or not Approved → STOP, dispatch `supergraph:plan-reviewer`, wait for Approval.
Also check: plan has user approval step (step 11 in plan)? If not → ask user: "Plan was not reviewed by you. Proceed anyway? [yes / no]"

Check dependencies: Task X depends on Task Y → is Y `Status: completed`? If not → STOP.

**If any concern: STOP, ask. Never guess.**

### 4. Branch Protection
If main/master → STOP, suggest: worktree for isolation, or new branch.
Worktree: `git worktree add -b <feat-branch> ../<feat-dir> origin/main`
New branch: `git checkout -b <feat-branch>`
User approves → continue.

### 5. Determine Execution Mode

| Condition | Mode |
|---|---|
| No file overlap + no dependencies | Parallel (one agent per task) |
| Any dependency/overlap | Sequential (one agent, in order) |
| Uncertain | Ask user: parallel (faster, risk conflicts) or sequential (safer)? |

### 6. Dispatch Executor(s)

**Sequential mode:**
```
Agent(
  subagent_type="supergraph:executor",
  description="Execute plan tasks [scope] from plan: [plan-name]",
  prompt="Execute tasks from plan at [plan-path]. Mode: SEQUENTIAL.

Environment Context from plan:
[full Environment Context block]

Your job:
1. Run baseline tests
2. Execute tasks IN ORDER (respect dependencies)
3. Per task: RED → GREEN → REFACTOR → Lint → Format
4. Commit once per task AFTER all tests pass (use Checkpoint files/message from plan)
5. Max 3 retries per step → mark stuck if blocked
6. Final verification: tests, lint, build
7. Report: tasks done/stuck, files changed, risks

Stop conditions (ask instead of guessing):
- Plan instruction unclear / test command missing / dependency not met / placeholder found / any blocker"
)
```

**Parallel mode** (one agent per task, self-contained prompts):
```
Agent(
  subagent_type="supergraph:executor",
  description="Execute Task N from plan: [plan-name]",
  prompt="Execute ONLY Task N from plan at [plan-path]. Mode: PARALLEL (independent).

Task context (self-contained):
[full Task N section including Status, Risk, Dependencies, Files, Acceptance, TDD, Steps, Checkpoint]

Environment Context:
[full Environment Context block]

Your job:
1. RED → GREEN → REFACTOR → Lint → Format (do NOT commit during TDD)
2. Commit ONCE after ALL tests pass (use Checkpoint files/message from plan)
3. Do NOT edit files outside Task N
4. Do NOT refactor unrelated code
5. Max 3 retries per step → mark stuck
6. Return: success/fail, files changed, commit hash, risks

Stop conditions (ask instead of guessing):
- File outside scope needed / task unclear / any blocker"
)
```
Spawn all agents in one message (true parallel).

### 7. Post-Execution Integration Safety
After agents return:
```bash
git diff --name-only  # check for same-file edits by different agents
```
If overlap: run `mcp__code-review-graph__detect_changes_tool()` + `get_surprising_connections_tool()`

If conflicts detected → STOP, present options: (review manually, revert & retry sequential, keep X & redo Y)

### 8. Final Verification
Run `$TEST_CMD`, `$LINT_CMD`, `$BUILD_CMD`. Run `mcp__code-review-graph__build_or_update_graph_tool()`.

### 9. Handoff
1. `/supergraph:fix [same plan/scope]` — auto-fix remaining
2. `/supergraph:integration` — run integration tests if configured
3. `/supergraph:verify [same plan/scope]` — evidence gate
4. `/supergraph:review [same plan/scope]` — final review before merge

### 10. Report
```
✅ Execution Complete
Plan: [path] | Scope: [tasks]
Tasks: N/N done | Stuck: [none | list]
Tests: PASS | Lint: PASS | Graph: updated
Next: /supergraph:fix → /supergraph:verify → /supergraph:review
```

Announce task completion to user in their language with a clear summary of what was done.

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
