# Devflow — Mandatory Workflows

> CRITICAL: These are MANDATORY. Not suggestions. Not optional.
> Every coding task MUST follow this process.

---

## Skills

This project uses devflow skills located in `.claude/skills/`.
Agent MUST read and follow the relevant skill before each phase.

| Skill                          | When to read                            |
| ------------------------------ | --------------------------------------- |
| `.claude/skills/context.md`    | Start of every session                  |
| `.claude/skills/brainstorm.md` | Before understanding a non-trivial task |
| `.claude/skills/plan.md`       | Before writing any code                 |
| `.claude/skills/tdd.md`        | When implementing any feature or fix    |
| `.claude/skills/review.md`     | Before merging or when review is needed |
| `.claude/skills/blast.md`      | When analyzing impact of changes        |
| `.claude/skills/fix.md`        | After all coding is complete            |
| `.claude/skills/refactor.md`   | When refactoring code                   |
| `.claude/skills/inspect.md`    | When deep-diving into a file or symbol  |

---

## Auto Language Detection

At session start, detect project type:

- `pubspec.yaml` → Flutter/Dart
- `package.json` → Node.js (JS/TS)
- `composer.json` → PHP

Use the correct test/lint commands for the detected language.

---

## Mandatory Workflow

### Step 0: Context

Read `.claude/skills/context.md` and execute it.
NEVER start work without graph context.

### Step 1: Understand

Non-trivial task → Read `.claude/skills/brainstorm.md` and execute it.
Ask questions. Confirm with user.

### Step 2: Plan

Read `.claude/skills/plan.md` and execute it.
blast_radius → identify affected files. Tasks 2-5 min each. User approval.

### Step 3: Execute TDD

Read `.claude/skills/tdd.md` and execute it.
Each task: RED → GREEN → REFACTOR. No exceptions.

### Step 4: Auto-Fix Loop

After ALL coding, read `.claude/skills/fix.md` and execute it.

    iteration = 0
    while iteration < 3:
        run tests → if fail: fix, iteration++, continue
        run lint  → if fail: fix, iteration++, continue
        graph review → if critical: fix, iteration++, continue
        break
    if iteration >= 3: STOP, ask user

### Step 5: Final Review

Read `.claude/skills/review.md` and execute it.
All checks pass before merge.

---

## Hard Rules

1. NEVER code without a plan
2. NEVER implement without a failing test
3. NEVER read entire codebase — use blast_radius
4. NEVER modify hub nodes without user approval
5. NEVER skip the auto-fix loop
6. NEVER commit if tests fail or review has CRITICAL
7. ALWAYS use graph MCP tools before assuming relationships
8. ALWAYS detect language and use correct commands
9. ALWAYS read the relevant skill file before executing each phase

---

## Escalation

| Condition                   | Action                   |
| --------------------------- | ------------------------ |
| Blast radius > 20 files     | STOP — discuss with user |
| Hub node modification       | REQUIRE user approval    |
| Community boundary crossing | REQUIRE justification    |
| Surprise score > 0.7        | REQUIRE investigation    |
| New circular dependency     | BLOCK                    |
| Fix fails 3 times           | STOP — ask user          |

---

## MCP Tools

| Tool                     | Purpose                   |
| ------------------------ | ------------------------- |
| `get_stats`              | Repo overview             |
| `index_directory`        | Index codebase            |
| `index_incremental`      | Fast reindex              |
| `blast_radius`           | Find affected files       |
| `blast_radius_visualize` | Visual impact             |
| `find_dependencies`      | What does X depend on?    |
| `find_dependents`        | What breaks if X changes? |
| `find_transitive_deps`   | Deep chains               |
| `find_communities`       | Module boundaries         |
| `find_hub_nodes`         | Central risky files       |
| `find_bridge_nodes`      | Cross-module coupling     |
| `find_cycles`            | Circular deps             |
| `find_symbol`            | Locate symbol             |
| `find_callers`           | Who calls X?              |
| `find_callees`           | What does X call?         |
| `find_similar`           | Pattern match             |
| `surprise_score`         | Unexpected deps           |
| `find_tests_for`         | Tests for file            |
| `find_untested_files`    | Coverage gaps             |
