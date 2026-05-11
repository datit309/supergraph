# Skills Overview

This document describes all available skills in the supergraph plugin.

## Skill Index

| Skill | Auto-Trigger | Description |
|-------|---------------|-------------|
| `sg-context` | Session start | Load codebase graph context |
| `sg-brainstorm` | Pre-task | Understand requirements with graph data |
| `sg-plan` | Pre-implementation | Create graph-informed task breakdown |
| `sg-tdd` | Implementation | Test-driven development cycle |
| `sg-fix` | Post-implementation | Automated fix loop |
| `sg-review` | Pre-merge | Graph-enhanced code review |
| `sg-finish` | Completion | Merge, PR, or discard options |
| `sg-blast` | Impact analysis | Find affected files |
| `sg-refactor` | Refactoring | Safe incremental refactoring |
| `sg-inspect` | Deep dive | File/symbol/module analysis |
| `sg-execute` | Execution | Run saved plan with checkpoints |

---

## sg-context

**Trigger:** Start of every session

**Purpose:** Load codebase graph context so every subsequent decision is data-informed.

**Steps:**
1. Detect project type (Flutter/Node.js/PHP/Python/Go/Rust)
2. Verify MCP available (code-review-graph)
3. Load full context: stats, communities, hub nodes, bridge nodes, cycles, untested files
4. Present context summary to user
5. Re-index if stale

---

## sg-brainstorm

**Trigger:** Before any non-trivial task

**Purpose:** Use graph data to ask informed questions instead of guessing.

**Steps:**
1. Load context (get_stats)
2. Explore based on task type (feature/bug/refactor)
3. Ask informed questions using graph data
4. Summarize understanding, blast radius, risk assessment
5. Get explicit user confirmation

---

## sg-plan

**Trigger:** Before writing any code

**Purpose:** Never write code without a plan. Use blast_radius to know exact scope.

**Steps:**
1. Identify likely change targets
2. Run graph analysis (blast_radius, hub_nodes, communities, tests, surprise_score)
3. Create task breakdown (2-5 min each)
4. Validate plan
5. Present plan with self-review
6. Get user approval
7. Save plan to file

---

## sg-tdd

**Trigger:** When implementing any feature or fix

**Purpose:** Write test first, then implement. No exceptions.

**Steps:**
1. Detect language and test commands
2. RED: Write failing test, run → MUST FAIL
3. GREEN: Minimal implementation, run → MUST PASS
4. REFACTOR: Check impact, improve while keeping green
5. Verify blast radius
6. Commit

---

## sg-fix

**Trigger:** After all coding is complete

**Purpose:** Catch and fix issues automatically. Max 3 iterations.

**Steps:**
1. Setup: detect language, get changed files, run blast_radius
2. Fix Loop (max 3):
   - Run tests → if fail, fix source
   - Run lint → if errors, fix
   - Graph review → if critical found, fix
3. Report status

---

## sg-review

**Trigger:** Before merge, after task completion

**Purpose:** Graph-enhanced code review. CRITICAL issues block merge.

**Steps:**
1. Get changed files
2. Detect language and commands
3. Run graph analysis (blast_radius, hub_nodes, communities, cycles, bridge_nodes)
4. Run tests and lint
5. Verify checklist (blast radius, hub safety, community, surprise)
6. Output report with verdict

---

## sg-finish

**Trigger:** When implementation is complete

**Purpose:** Guide completion with clear options: merge, PR, keep, or discard.

**Steps:**
1. Verify tests pass
2. Detect environment (normal repo / worktree / detached HEAD)
3. Present options based on environment
4. Execute choice (merge / push PR / keep / discard)
5. Cleanup if needed

---

## sg-blast

**Trigger:** When analyzing impact of changes

**Purpose:** Find exactly which files are affected by a change.

**Steps:**
1. Determine target files
2. Run blast_radius analysis (depth=3, direction=both)
3. Enrich results (surprise_score, find_tests_for, hub status)
4. Present blast radius report with risk level

---

## sg-refactor

**Trigger:** When refactoring code

**Purpose:** Refactor safely using graph analysis.

**Steps:**
1. Impact assessment (blast_radius depth=5, find_dependents, hub_nodes, communities, cycles, bridge_nodes)
2. Baseline: run all tests for blast_radius files
3. Incremental: leaf nodes first, work inward toward hubs
4. Community order: within communities first, bridge nodes last
5. Verify: no new cycles, all tests pass
6. Post-refactor: execute sg-fix

---

## sg-inspect

**Trigger:** When deep-diving into a file, symbol, or module

**Purpose:** Deep inspection of any code element using graph analysis.

**Steps:**
1. If file: blast_radius, find_dependencies, find_dependents, surprise_score, find_tests_for
2. If symbol: find_symbol, find_callers, find_callees
3. If module: find_communities, blast_radius, find_bridge_nodes
4. Present comprehensive inspection report

---

## sg-execute

**Trigger:** When executing a saved plan

**Purpose:** Execute tasks from saved plans with checkpoint resume capability.

**Steps:**
1. Load plan file
2. Detect resume point (check completed tasks)
3. Execute tasks with TDD
4. Complete: run sg-finish, verify tests, present options