# Supergraph — Mandatory Workflows

> CRITICAL: These are MANDATORY. Not suggestions. Not optional.
> Every coding task MUST follow this process.

---

## Skills

This project uses supergraph skills with `/supergraph:` prefix to avoid conflicts with built-in commands.
Agent MUST read and follow the relevant skill before each phase.

| Skill            | When to read                            |
| ---------------- | --------------------------------------- |
| `/supergraph:scan`        | Start of every session                  |
| `/supergraph:analyze`      | Ambiguous scope, touching hub/bridge     |
| `/supergraph:plan`         | Before writing any code                 |
| `/supergraph:tdd`          | When implementing any feature or fix    |
| `/supergraph:execute`      | When executing saved plans              |
| `/supergraph:fix`          | After all coding is complete            |
| `/supergraph:integration`  | After unit tests pass                   |
| `/supergraph:verify`       | Before claiming done/ready or committing |
| `/supergraph:review`       | Before merging or when review is needed |
| `/supergraph:serena`       | Before complex refactors, cross-file symbol analysis, or when type diagnostics are needed |


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

Read `/supergraph:scan` and execute it.
NEVER start work without graph context.

### Step 1: Plan

Read `/supergraph:plan` and execute it.
blast_radius → identify affected files. Tasks 2-5 min each. User approval.
Save plan to `docs/superpowers/plans/` for resume capability.

### Step 2: Execute TDD

Read `/supergraph:tdd` and execute it.
Each task: RED → GREEN → REFACTOR. No exceptions.

### Step 3: Auto-Fix Loop

After ALL coding, read `/supergraph:fix` and execute it.

    iteration = 0
    while iteration < 3:
        run tests → if fail: fix, iteration++, continue
        run lint  → if fail: fix, iteration++, continue
        graph review → if critical: fix, iteration++, continue
        break
    if iteration >= 3: STOP, ask user

### Step 4: Integration (optional)

Read `/supergraph:integration` and execute it.
Run integration/e2e tests if configured.

### Step 5: Verify

Read `/supergraph:verify` and execute it.
NO completion claims without fresh verification evidence.

### Step 6: Final Review

Read `/supergraph:review` and execute it.
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
10. ALWAYS save plan to file for long-running/team work
11. USE Serena MCP tools when available — `get_diagnostics_for_file` for type errors, `find_referencing_symbols`/`find_implementations` for impact analysis, `replace_symbol_body`/`rename_symbol` for targeted edits (prefer over raw text edits)

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
| **Serena tools** (via `mcp__serena__*`) | |
| `serena.find_referencing_symbols` | Find all callers/usages of a symbol       |
| `serena.find_implementations`     | All implementations of interface/abstract |
| `serena.get_diagnostics_for_file` | IDE-level type errors for a file          |
| `serena.rename_symbol`            | Safe codebase-wide symbol rename          |
| `serena.replace_symbol_body`      | Targeted function body replacement        |
| `serena.get_symbols_overview`     | Project structure map                     |
