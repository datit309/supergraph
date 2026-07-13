# Changelog

## Unreleased

### Fixed

- Completed a full Codex hook contract audit: normalized `Stop`, `PreCompact`, `PostToolUse`, and `PreToolUse` JSON, fixed Codex stdin handling, and added executable coverage for every configured hook.
- Fixed `UserPromptSubmit` hook output for Codex by emitting the required `hookSpecificOutput` envelope with `hookEventName` and `additionalContext`.
- Added the required top-level `name` to the Codex marketplace manifest so `codex plugin marketplace upgrade supergraph` passes marketplace validation.

### Changed

- Migrated all active graph configuration, workflows, hooks, CI, and documentation to Codebase Memory MCP 0.9.0 with project-scoped indexing and executable query-contract tests.

## 2.2.3

### Docs

- README/README-VI Team Setup rewritten: correct install flow (plugin → MCP deps → `/supergraph:scan`), removed manual file copying
- Serena setup: `uv tool install -p 3.13 serena-agent` only — plugin `.mcp.json` handles Claude Code registration automatically
- Quick Start: added `/supergraph:analyze` as Step 2
- README-VI synced with README

## 2.2.2

### Updated Skills (1)

- **analyze** — added 4-signal ambiguity scoring (scope, path, intent, session context) → Tier 0/1/2 routing before grilling; added 5-persona debate on recommended approach (Architect/Security/Performance/UX/Devil's Advocate) → GO/CAUTION/STOP verdict

### Updated Skills — scan (1)

- **scan** — graph build logic: calls `list_graph_stats_tool` first; `index_directory` on empty graph; `index_incremental` on existing same-branch; full `index_directory` rebuild on branch change; hard STOP if `index_directory` fails

### Infrastructure

- **`.mcp.json`** — plugin now declares `code-review-graph` and `serena` MCP server configs; users only need to install the binaries
- **`bin/bump-version.sh`** — script to update version in both `plugin.json` and `marketplace.json` in one command
- **`.github/`** — added issue templates (bug report, feature request, skill submission), release workflow on `v*` tag push
- **`docs/GITHUB-LABELS.md`** — full label system (Type/Priority/Size/Triage/Workflow) with `gh` CLI commands

### Docs

- README Team Setup rewritten: install plugin → install MCP deps → `/supergraph:scan` (no manual file copying)
- Serena setup section: `uv tool install -p 3.13 serena-agent` only; plugin `.mcp.json` handles Claude Code registration
- Quick Start: added `/supergraph:analyze` as Step 2 with note on what it covers

## 2.2.1

### New Skills (1)

- **flutter-ui** — build pixel-faithful Flutter UI from Figma MCP or image input; scans src for design tokens (colors, text styles, spacing), existing widgets, state management pattern, and import convention before writing a single line; token mapping table required before code; never hard-codes values; uses `flutter_gen` for asset references with naming convention (`ic_`, `img_`, `bg_` prefix + state suffix); self-verifies with grep before handoff

### Key behaviors

- Figma URL parsing built-in: extracts `fileKey` and converts `node-id` `123-456` → `123:456` automatically
- Unmapped token gate: STOP and ask user before Step 4 if any design value has no matching token
- Figma variant support: maps Normal/Disabled/Active variants to boolean/enum params on a single widget
- `flutter_gen` setup proposal: if package absent, proposes full `pubspec.yaml` + `build_runner` setup
- ThemeData branch: detects whether project uses direct class references (`AppColors.primary`) or `Theme.of(context).colorScheme.*` and matches generated code accordingly
- Asset declarations: verifies `flutter.assets:` in `pubspec.yaml` before any asset reference

## 2.2.0

### New Skills (8)

- **diagnose** — 6-phase structured debugging: build feedback loop → reproduce → hypothesize (3-5 ranked falsifiable theories) → instrument one variable at a time → fix + regression test → cleanup + post-mortem
- **handoff** — compact current session state to `$TMPDIR` for seamless continuation across sessions or agents; references artifacts by path, never duplicates content
- **triage** — formal issue state machine: needs-triage → needs-info → ready-for-agent → ready-for-human → wontfix; `ready-for-agent` is the handoff trigger to the supergraph pipeline
- **caveman** — persistent token-compression mode (~75% output reduction); strips filler while keeping code/numbers exact; auto-suspends for safety warnings
- **prd** — convert conversation into a structured PRD (problem, solution, user stories, acceptance criteria, out-of-scope); optionally posts to GitHub Issues with `ready-for-agent` label
- **architecture** — 3-phase architecture review: explore graph → self-contained HTML report with Mermaid before/after diagrams and recommendation strength badges → grilling loop
- **prototype** — throwaway code validation in two branches: Logic (terminal state machine) or UI (multiple designs on one route with URL-param switcher); no persistence, no tests, delete after
- **zoom-out** — one-shot module map using domain vocabulary; re-orient fast after deep-dive sessions

### Updated Skills (3)

- **analyze** — added structured grill phase (one question at a time with recommended answers, max 3 questions); reads CONTEXT.md for domain vocabulary; updates CONTEXT.md when new terms crystallize
- **plan** — reads CONTEXT.md step 0; uses domain vocabulary in task descriptions
- **review** — updates CONTEXT.md when review surfaces hidden domain invariants

### CONTEXT.md Convention

Cross-skill shared vocabulary system: `analyze`, `plan`, and `review` read CONTEXT.md before acting and write to it when new domain concepts emerge. Reduces token waste and inconsistency across the skill chain.

### Automation — 4 Smart Hooks

- **`SessionStart` (enhanced)** — loads CONTEXT.md vocabulary into context; reminds about handoff file if one exists in `$TMPDIR` (< 48h); activates caveman mode if `SUPERGRAPH_CAVEMAN=true` in `.supergraph-env`; suggests `/supergraph:zoom-out` when no active plan exists
- **`PostToolUse Bash` (new)** — detects test failure patterns (`exit_code ≠ 0` + output match across jest/pytest/cargo/flutter/phpunit/go test) → injects `/supergraph:diagnose` suggestion into context
- **`PreCompact` (new)** — fires immediately before context compaction; injects urgent handoff reminder with active plan status (`pending`/`in_progress`/`stuck` counts)
- **`UserPromptSubmit` (new)** — detects caveman trigger phrases ("caveman", "compress", "token diet"...) → activates compression mode; detects "normal mode"/"verbose" → deactivates; detects triage keywords → suggests `/supergraph:triage`

## 2.1.0

### Features

- 13 skills: scan, analyze, plan, tdd, execute, fix, integration, verify, review, database-migrations, flutter-dart-code-review, frontend-design, webapp-testing
- 4 agents: executor, plan-writer, code-reviewer, plan-reviewer
- Refactored core skills (scan → analyze → plan → execute → fix → verify → review) for enhanced clarity
- Enhanced executor with graph-assisted parallel dispatch (independent tasks run concurrently)
- New skill: **database-migrations** — patterns for PostgreSQL, Prisma, Drizzle, Kysely, Django, golang-migrate
- New skill: **flutter-dart-code-review** — 15-section checklist covering widgets, state management, Dart idioms, performance, accessibility, security
- New skill: **frontend-design** — distinctive, production-grade frontend interfaces avoiding generic AI aesthetics
- New skill: **webapp-testing** — Playwright-based web application testing toolkit with helper scripts
- Standardized machine-readable plan format with task status tracking
- Plan-aware fix/review cycle (auto-updates task status)
- Mandatory "read-before-edit" guardrails in documentation
- Auto-fix loop: max 3 iterations (test → lint → graph review)
- Dead code detection in fix loop
- Report progress after each phase

## 1.0.1

### Features

- 9 skills: scan, design, plan, tdd, execute, fix, integration, verify, review
- 4 agents: executor, plan-writer, code-reviewer, plan-reviewer
- MCP integration with code-review-graph
- Auto language detection: Node.js, Flutter, PHP
- Auto-fix loop: test + lint + graph review, max 3 iterations
- Blast radius analysis for change impact
- Hub node protection — requires user approval
- Community boundary detection
- Surprise score flagging
- Hook system for pre/post code write tracking

### Supported Languages

- Node.js / TypeScript (jest, vitest, mocha, eslint)
- Flutter / Dart (flutter test, flutter analyze)
- PHP (phpunit, pest, phpstan, phpcs)
