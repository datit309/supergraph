---
name: execute
description: Dispatch and execute implementation plans with TDD checkpoints. Use when plan is ready and needs execution. Orchestrates multi-task runs.
---

# Skill: Execute

Dispatch plan tasks. Run with TDD. Checkpoint after each task.

**Superpowers principle:** Review plan critically before implementation. Ask instead of guessing. Protect main/master.

## Prerequisites

- Plan saved at `docs/superpowers/plans/*.md`
- `/supergraph:context` completed or Environment Context in plan

## Usage

**Single plan file (auto-detected):**

```
/supergraph:execute
/supergraph:execute task 1
/supergraph:execute tasks 1,3,5
/supergraph:execute from task 3
```

**Multiple plan files (must specify):**

```
/supergraph:execute plan auth-login
/supergraph:execute plan auth-login task 2
/supergraph:execute plan 2026-05-12-auth-login
/supergraph:execute plan docs/superpowers/plans/2026-05-12-auth-login.md
```

**Plan selection rules:**
- 0 plans → STOP, run `/supergraph:plan` first
- 1 plan → auto-use it
- >1 plans + no `plan ...` arg → STOP, list available plans, ask user
- `plan <slug>` → match filename containing slug
- Multiple matches → STOP, list matches
- No match → STOP, show available plans

## Steps

### 0. Announce

Start by saying:

> "I'm using /supergraph:execute to implement this plan."

### 1. Select Plan

```bash
ls docs/superpowers/plans/*.md
```

**Plan selection logic:**

1. Count plan files
2. If 0 → STOP: "No plan found. Run `/supergraph:plan` first."
3. If 1 → auto-select it
4. If >1:
   - Parse user args for `plan <slug>`
   - If no `plan ...` arg → STOP: "Multiple plans found: [list]. Specify: `/supergraph:execute plan <slug>`"
   - Match filename containing `<slug>`
   - If 0 matches → STOP: "No plan matches '<slug>'. Available: [list]"
   - If >1 matches → STOP: "Multiple matches for '<slug>': [list]. Be more specific."
   - If 1 match → use it

**Parse task scope and execution mode from remaining args:**

- No scope → execute all incomplete tasks
- `task N` → execute only Task N
- `tasks N,M,K` → execute listed tasks only
- `from task N` → execute Task N and all following incomplete tasks
- `sequential` flag → force sequential execution (one agent, tasks in order)
- Default → parallel if tasks are independent, sequential if dependencies detected

### 2. Critical Plan Review

Read selected plan. Before dispatching executor, critically evaluate:

**Validate structure:**
- Has `## Environment Context` block?
- Has `## Plan Review` with `Status: Approved`?
- Every selected task has `Status:`, `Files:`, `Acceptance:`, `TDD:`, `Steps:`, `Checkpoint:`?
- Commands (TEST_CMD, LINT_CMD, etc.) are real and not placeholders?

If `## Plan Review` is missing or not Approved:
- STOP and dispatch `supergraph:plan-reviewer`
- Do not execute until review returns `Approved`

**Check dependencies:**
- Tasks with `Dependencies: Task N` → is Task N `Status: completed`?
- If not → STOP: "Task N depends on Task M which is not completed."

**Check clarity:**
- Are Steps clear enough to execute without guessing?
- Are Acceptance criteria observable and testable?
- Are file paths exact (not placeholders like `[file]`)?

**If any concerns:**
- STOP and raise them to user
- Ask for clarification instead of guessing
- Do not proceed until plan is clear

**If no concerns:**
- Continue to branch check

### 3. Analyze Task Independence (for parallel mode)

If multiple tasks in scope and no `sequential` flag:

**Graph-assisted independence check:**

```text
mcp__code-review-graph__get_minimal_context_tool()
```

For each task pair (i, j):

```text
mcp__code-review-graph__get_impact_radius_tool(files=[task_i_files], depth=2)
mcp__code-review-graph__get_impact_radius_tool(files=[task_j_files], depth=2)
mcp__code-review-graph__get_affected_flows_tool(files=[task_i_files])
mcp__code-review-graph__get_affected_flows_tool(files=[task_j_files])
mcp__code-review-graph__query_graph_tool(query_type="dependencies", target="task_i_files")
```

**Independence criteria (all must pass for parallel):**

- No explicit `Dependencies:` between tasks in plan
- No overlapping files in `Files:` sections
- Blast radius overlap < 20%
- No shared critical flows
- No both touching same hub/bridge node
- No both crossing same community boundary

**Decision:**

- All pairs independent → **parallel mode** (spawn one agent per task)
- Any pair dependent → **sequential mode** (one agent, tasks in order)
- Uncertain → ask user: "Tasks may have dependencies. Run parallel (faster, risk conflicts) or sequential (safer)?"

### 4. Branch Protection

Check current branch:

```bash
git branch --show-current
```

**If branch is `main` or `master`:**

STOP and ask user:

> "Current branch is [main/master]. Implementation on main/master requires explicit permission. Options:
> 1. Create new branch and execute there
> 2. Continue on [main/master] (requires your approval)
> 3. Cancel
>
> Which option?"

Wait for user choice. Do not proceed without approval.

**If branch is not main/master:**
- Continue to dispatch

### 5. Dispatch Executor Agent(s)

#### Sequential Mode (one agent, tasks in order)

Used when:
- Only one task in scope
- Tasks have dependencies
- User passed `sequential` flag
- Independence check failed

```
Agent(
  subagent_type="supergraph:executor",
  description="Execute plan: [plan-name] (sequential)",
  prompt="Execute [task-scope] from plan at [selected-plan-path]. 

Plan file: [selected-plan-path]
Mode: SEQUENTIAL
Context: Plan contains N tasks with Environment Context (TEST_CMD, LINT_CMD, etc.). User requested scope: [all incomplete | task N | tasks N,M,K | from task N].

Your job:
1. Extract Environment Context from plan
2. Run baseline tests
3. Filter tasks by scope (execute only requested tasks)
4. Execute tasks IN ORDER (respect Dependencies)
5. For each task: RED → GREEN → REFACTOR → Format → Lint → Checkpoint after tests pass, commit once per task
6. Max 3 retries per step, mark stuck if blocked
7. Final verification: tests, lint, build, graph update
8. Report: tasks done, stuck list, next steps

Follow TDD strictly. ONE commit per task after all tests pass. Never commit mid-TDD (no commit during RED/GREEN/REFACTOR).

Stop conditions (ask instead of guessing):
- Plan instruction unclear
- Test command missing or fails baseline
- Dependency not met
- Acceptance criteria not testable
- File path is placeholder
- Any blocker or repeated failure"
)
```

#### Parallel Mode (one agent per task)

Used when:
- Multiple tasks in scope
- All tasks are independent (passed independence check)
- No `sequential` flag

For each task in scope, spawn one agent:

```
Agent(
  subagent_type="supergraph:executor",
  description="Execute Task N from plan: [plan-name]",
  prompt="Execute ONLY Task N from plan at [selected-plan-path].

Plan file: [selected-plan-path]
Mode: PARALLEL (independent task)
Scope: Task N only

Task context (self-contained):
[Full Task N section including Status, Risk, Dependencies, Files, Acceptance, Steps, Checkpoint]

Environment Context:
[Full Environment Context block]

Your job:
1. Execute ONLY Task N
2. RED → GREEN → REFACTOR → Format → Lint (do NOT commit during TDD)
3. Update Status for Task N only
4. Do NOT edit files outside Task N Files list without asking
5. Do NOT refactor unrelated code
6. Commit once after ALL tests pass for Task N (exact checkpoint files and message from plan)
7. Max 3 retries per step, mark stuck if blocked

Return:
- Root cause / implementation summary
- Files changed
- Tests run
- Commit hash
- Risks or conflicts detected

Stop conditions (ask instead of guessing):
- Task instruction unclear
- File outside scope needed
- Acceptance not testable
- Any blocker"
)
```

Spawn all task agents concurrently (one message with multiple Agent calls).

### 6. Monitor Progress

**Sequential mode:**
- One agent reports progress
- Wait for completion

**Parallel mode:**
- Multiple agents report independently
- Wait for all to complete
- Agents may finish in any order

### 7. Review Results

**Sequential mode:**

Agent returns final status. Check:
- Tasks completed vs stuck
- Tests PASS
- Lint PASS
- Graph updated

**Parallel mode:**

For each agent result:
- Read summary, root cause, files changed
- Check commit hash
- Note risks/conflicts reported

Then check integration safety:

```text
mcp__code-review-graph__detect_changes_tool()
mcp__code-review-graph__get_surprising_connections_tool()
```

**Conflict detection:**

- Any agents changed same file?
- Any agents changed same function/class?
- Blast radius overlap increased?
- New surprising connections?
- Any agent reported conflict risk?

**If conflicts detected:**

STOP and present to user:

```
⚠️ Parallel execution detected potential conflicts:
- Agent 1 (Task 2) and Agent 3 (Task 5) both modified src/auth/login.ts
- Blast radius overlap: 35%
- New surprising connection detected

Options:
1. Review diffs manually and merge carefully
2. Revert all and re-run sequential
3. Keep Agent 1 changes, discard Agent 3, re-run Task 5

Which option?
```

**If no conflicts:**

Continue to verification.

### 8. Final Verification

After sequential or parallel execution, always run final verification:

```bash
$TEST_CMD
$LINT_CMD
$BUILD_CMD
```

```text
mcp__code-review-graph__build_or_update_graph_tool()
mcp__code-review-graph__detect_changes_tool()
mcp__code-review-graph__get_affected_flows_tool(files=[all_changed])
```

Only proceed if verification passes. If verification fails after parallel execution, STOP and recommend sequential retry.

### 9. Handoff to Finishing Workflow

After execution complete:

```
Next steps:
1. /supergraph:fix [same plan/scope] — auto-fix any remaining issues
2. /supergraph:integration — run integration tests if configured
3. /supergraph:verify [same plan/scope] — fresh evidence gate
4. /supergraph:review [same plan/scope] — final review before merge
5. Then choose: push, create PR, keep local, or discard
```

### 10. Report

```
✅ Execution Complete
Plan: [path]
Scope: [all | task N | tasks N,M,K]
Tasks: N/N done | Stuck: [list or "none"]
Tests: PASS | Lint: PASS
Graph: updated

Next: /supergraph:fix [same plan/scope] → /supergraph:verify [same plan/scope]
```

## Stop Conditions (Ask Instead of Guessing)

STOP immediately and ask user when:

- Plan file not found or ambiguous
- Plan missing Environment Context
- Task instruction unclear or has placeholders
- Task missing Acceptance criteria
- Dependency task not completed
- Test command missing or empty
- Branch is main/master and no permission given
- Baseline tests fail
- Agent reports blocker
- Agent stuck after 3 retries

**Never guess.** Always ask for clarification.

## Rules

- Default to parallel execution when multiple tasks are independent
- Use sequential execution when tasks depend on each other or independence is uncertain
- User can force sequential with `sequential` flag
- ALWAYS run graph-assisted independence check before parallel dispatch
- ALWAYS spawn one agent per independent task in parallel mode
- ALWAYS give each parallel agent a self-contained prompt
- ALWAYS restrict each parallel agent to its task files
- ALWAYS check for conflicts after parallel agents complete
- ALWAYS run full verification after parallel execution
- ALWAYS announce skill usage at start
- ALWAYS critically review plan before dispatch
- ALWAYS check branch — protect main/master
- ALWAYS ask instead of guessing when unclear
- NEVER create plan — only execute
- NEVER skip Environment Context extraction
- NEVER `git add -A` — always explicit files
- NEVER proceed on main/master without explicit permission
- NEVER parallelize tasks with overlapping files, dependencies, or shared critical flows
- Max 3 retries per step — then mark stuck and ask
- Checkpoint after every task
- Regression at any checkpoint → revert immediately
