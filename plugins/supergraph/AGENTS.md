# Supergraph — Mandatory Workflows

> CRITICAL: These are MANDATORY. Not suggestions. Not optional.
> Every coding task MUST follow this process.

---

## Skills

This project uses supergraph skills:
- **Claude Code & Codex**: invoke with `/supergraph:` prefix (e.g. `/supergraph:scan`, `/supergraph:plan`).
- **DeepSeek Harness (DSH) & OpenCode**: invoke bare skill names without prefix (e.g. `/scan`, `/plan`, `/tdd`, `/verify`, or via tool `skill(name="scan")` on DSH). DSH skill names follow `/^[a-z0-9]+(?:-[a-z0-9]+)*$/` and do not use colons.
Your AI agent MUST read and follow the relevant skill before each phase.

| Skill (Claude/Codex) | Skill (DSH/OpenCode) | When to read |
| --- | --- | --- |
| `/supergraph:scan` | `/scan` | Start of every session |
| `/supergraph:explore` | `/explore` | Codebase exploration, architectural research, tracing flows |
| `/supergraph:analyze` | `/analyze` | Ambiguous scope, touching hub/bridge |
| `/supergraph:sdd` | `/sdd` | Standalone design document (only when explicitly requested by user) |
| `/supergraph:plan` | `/plan` | Before writing any code (single source of truth for design + tasks) |
| `/supergraph:tdd` | `/tdd` | When implementing any feature or fix |
| `/supergraph:execute` | `/execute` | When executing saved plans |
| `/supergraph:fix` | `/fix` | After all coding is complete |
| `/supergraph:integration` | `/integration` | After unit tests pass |
| `/supergraph:playwright-tester` | `/playwright-tester` | Comprehensive Web E2E testing, QA/QC matrix & failure simulation |
| `/supergraph:vibesec` | `/vibesec` | Security audit, vulnerability prevention (IDOR, XSS, CSRF, SSRF, SQLi, Auth/JWT) |
| `/supergraph:verify` | `/verify` | Before claiming done/ready or committing |
| `/supergraph:review` | `/review` | Before merging or when review is needed |
| `/supergraph:diagnose` | `/diagnose` | Bug exists and cause is unknown |
| `/supergraph:serena` | `/serena` | Before complex refactors, cross-file symbol analysis, or type diagnostics |
| `/supergraph:zoom-out` | `/zoom-out` | Lost in unfamiliar code, need re-orientation |
| `/supergraph:architecture` | `/architecture` | Pre-refactor, onboarding, architectural planning |
| `/supergraph:prd` | `/prd` | Requirements came from conversation, not a formal spec |
| `/supergraph:triage` | `/triage` | Processing issue backlog, preparing work for automation |
| `/supergraph:prototype` | `/prototype` | Approach is uncertain before planning |
| `/supergraph:handoff` | `/handoff` | Agent context window exhausted or switching sessions |
| `/supergraph:caveman` | `/caveman` | Long session or token budget — activate compression |


---

## Auto Language Detection

At session start, detect project type:

- `pubspec.yaml` → Flutter/Dart
- `package.json` → Node.js (JS/TS)
- `composer.json` → PHP

Use the correct test/lint commands for the detected language.

---

## Tiered Workflow — Pick the right tier FIRST

| Tier | Condition | Path |
|---|---|---|
| **Explore** | Codebase exploration, architectural research, tracing flows (no code changes) | `/explore` (or `/zoom-out` → `/explore`) — zero code/test mutation |
| **Micro** | < 20 lines, ≤2 files, no hub/bridge, complexity <10 | `/supergraph:tdd` directly → `/supergraph:verify` (skip analyze/plan) |
| **Standard** | ≤5 files, clear requirement, no cross-boundary | `/supergraph:analyze` → `/supergraph:plan` (lightweight) → `/supergraph:execute` → `/supergraph:fix` → `/supergraph:playwright-tester` (if web) → `/supergraph:verify` |
| **Full** | >5 files, ambiguous, hub/bridge, cross-boundary, or blast radius >5 | Full pipeline below (`scan → analyze → plan [with embedded contracts] → tdd → fix → playwright-tester → verify → review`) |

**When in doubt, pick one tier lower — upgrade if complexity reveals itself.**

---

## Full Pipeline (Tier 3)

### Step 0: Context

Read `/supergraph:scan` and execute it.
NEVER start full-pipeline work without graph context.

### Step 1: Analyze & Architecture

Read `/supergraph:analyze` and execute it.
Frame problem, check graph risk (hub/bridge/cross-boundary), propose approaches, get approval.
Do NOT create a separate SDD file — architecture and data contracts are embedded directly into the plan.
(Invoke `/supergraph:sdd` only if the user explicitly asks for a standalone formal SDD).

### Step 2: Plan (Single Source of Truth)

Read `/supergraph:plan` and execute it.
Embed architectural contracts, API schemas, and invariants directly in `## Architecture & Contracts` at the top of the plan file.
blast_radius → identify affected files. Tasks 2-5 min each. User approval.
Save plan to `docs/supergraph/plans/` for resume capability.

### Step 3: Execute TDD

Read `/supergraph:tdd` and execute it.
Each task: RED → GREEN → REFACTOR. No exceptions.

### Step 4: Auto-Fix Loop

After ALL coding, read `/supergraph:fix` and execute it.

    iteration = 0
    while iteration < 3:
        run tests → if fail: fix, iteration++, continue
        run lint  → if fail: fix, iteration++, continue
        graph review → if critical: fix, iteration++, continue
        break
    if iteration >= 3: STOP, ask user

### Step 5: Integration & E2E (MANDATORY for Web)

Read `/supergraph:integration` and execute it.
For Web / UI features: ALWAYS automatically execute `/supergraph:playwright-tester` to generate the QA matrix and run Playwright E2E tests (Happy, Sad, Boundary, Network 500 fault injection, RBAC) before claiming verification.

### Step 6: Verify

Read `/supergraph:verify` and execute it.
NO completion claims without fresh verification evidence.

### Step 7: Final Review

Read `/supergraph:review` and execute it.
All checks pass before merge.

---

## Hard Rules

1. NEVER code without a plan
2. NEVER implement without a failing test
3. Target code reading with graph tools (`search_graph`, `trace_path`) and Serena symbol lookups instead of blindly dumping directories; in exploration and research phases, reading relevant source files directly is explicitly encouraged.
4. NEVER modify hub nodes without user approval
5. NEVER skip the auto-fix loop
6. NEVER commit if tests fail or review has CRITICAL
7. ALWAYS use graph MCP tools (`search_graph`, `trace_path`, `query_graph`, `detect_changes`) before assuming relationships
8. ALWAYS detect language and use correct commands
9. ALWAYS read the relevant skill file before executing each phase
10. ALWAYS save plan to file for long-running/team work
11. ALWAYS respond in the user's language — announcements, summaries, and all user-facing text must match the language the user wrote in (e.g. if user writes in Vietnamese, respond and announce in Vietnamese; if English, use English). The hardcoded announce strings in skill files are templates only — translate them before output.
12. USE Serena MCP tools when available — `get_diagnostics_for_file` for type errors, `find_referencing_symbols`/`find_implementations` for impact analysis, `replace_symbol_body`/`rename_symbol` for targeted edits (prefer over raw text edits)
13. ALWAYS auto-trigger `/supergraph:playwright-tester` for Web/Frontend tasks after `/fix` to test business flows, failure cases, and system resilience — never wait for the user to request E2E testing manually.

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

| Tool                     | Purpose                                              |
| ------------------------ | ---------------------------------------------------- |
| `search_graph`           | Search symbols, nodes, references, and relationships |
| `trace_path`             | Trace callers, callees, dependencies, and dataflow   |
| `query_graph`            | Run Cypher queries on the code graph (recipes)       |
| `get_architecture`       | Overview of layers, boundaries, clusters, hotspots   |
| `detect_changes`         | Git impact and risk analysis for modified files      |
| `get_code_snippet`       | Extract exact source snippets from indexed nodes     |
| `get_graph_schema`       | Inspect graph schema, node types, and relationship   |
| `search_code`            | Text and pattern search across indexed source code   |
| `index_status`           | Check project indexing status, freshness, and health |
| `index_repository`       | Trigger full/moderate/fast indexing of a repo path   |
| `check_index_coverage`   | Verify which files are included or excluded in index |
| `list_projects`          | List all indexed project names and root paths        |
| `delete_project`         | Remove a project from the knowledge graph            |
| `manage_adr`             | Record and inspect Architecture Decision Records     |
| `ingest_traces`          | Ingest runtime trace data into knowledge graph       |
| **Serena tools** (via `mcp__serena__*`) | |
| `serena.activate_project`         | Activate project by path or name before lookup  |
| `serena.get_symbols_overview`     | Project structure and top-level symbol map      |
| `serena.find_symbol`              | Locate symbol definition across codebase        |
| `serena.find_referencing_symbols` | Find all callers and usages of a symbol         |
| `serena.find_implementations`     | All implementations of interface/abstract class |
| `serena.get_diagnostics_for_file` | IDE-level type errors for a file                |
| `serena.rename_symbol`            | Safe codebase-wide symbol rename                |
| `serena.replace_symbol_body`      | Targeted function body replacement              |
| **Team tools** (via `supergraph-team` / `sg_*`) | |
| `sg_team_init`                    | Initialize team mission and base git branch     |
| `sg_task_create`                  | Register DAG task with wave & dependencies      |
| `sg_task_list`                    | List tasks and dependency readiness             |
| `sg_task_claim`                   | Claim task & spawn isolated git worktree        |
| `sg_task_record_red`              | Enforce TDD RED test failure record             |
| `sg_task_submit`                  | Submit GREEN phase with automated test run      |
| `sg_task_verify_merge`            | Test verification gate & merge into base repo   |
| `sg_worktree_cleanup`             | Clean up worktree and branch                    |
| `sg_team_status`                  | Mission progress overview and DAG status        |
