---
name: supergraph-execute
description: Dispatch and execute implementation plans with TDD checkpoints. Use when plan is ready and needs execution. Orchestrates multi-task runs.
---

# Skill: Execute

Dispatch plan tasks. Run with TDD. Checkpoint after each task.

## Prerequisites

- Plan saved at `docs/superpowers/plans/*.md`
- `/supergraph:context` completed or Environment Context in plan

## Steps

### 1. Load Plan

```bash
ls docs/superpowers/plans/*.md
```

Read latest plan. Extract `## Environment Context` block.

**If missing → STOP:** "Plan missing Environment Context. Re-run `/supergraph:plan`."

### 2. Pre-flight

```bash
eval "$(bash bin/detect-project.sh)"
$TEST_CMD
```

If baseline tests fail → STOP, report failures.

### 3. Execute Tasks (sequential, TDD per task)

For each incomplete task in plan:

**A. RED — Write failing test**

- Write test per plan spec
- Run: `$TEST_CMD`
- MUST FAIL → Report: `RED: Task N — [test_name]`

**B. GREEN — Implement**

- Write minimal implementation
- Run: `$TEST_CMD`
- MUST PASS → Report: `GREEN: Task N — [test_name]`
- **Stuck?** Max 3 attempts, then mark `> ⚠️ STUCK` in plan, skip

**C. REFACTOR**

- Clean up, run blast radius tests
- Keep green

**D. Format + Lint**

```bash
$FORMAT_CMD
$LINT_CMD
```

**E. Checkpoint**

```bash
git add [exact files]
git commit -m "feat: Task N — [description]"
```

**F. Verify**

- Run full `$TEST_CMD` — regression check
- If regression → STOP, revert checkpoint, debug

### 4. Final Verification

```bash
$TEST_CMD
$LINT_CMD
$BUILD_CMD
git status --porcelain
```

```
mcp__code-review-graph__build_or_update_graph_tool()
mcp__code-review-graph__detect_changes_tool()
```

### 5. Report

```
✅ Execution Complete
Tasks: N/N done | Tests: PASS | Lint: PASS
Stuck: [list or "none"]
Next: /supergraph:fix → /supergraph:review
```

## Parallel Dispatch (multi-agent)

For large plans (5+ tasks), dispatch sub-agents:

1. Group tasks by dependency (independent tasks can parallel)
2. Spawn sub-agent per group:
   ```
   sessions_spawn(task="Execute tasks [N,M] from plan [path]", runtime="subagent")
   ```
3. Wait for completion, merge results
4. Run final verification on combined output

## Rules

- NEVER create plan — only execute
- NEVER skip Environment Context extraction
- NEVER `git add -A` — always explicit files
- Max 3 retries per GREEN step — then skip + mark stuck
- Checkpoint after every task
- Regression at any checkpoint → revert immediately
