# Supergraph for AI Coding Agents

> [Tiếng Việt](./README-VI.md)

**Turn AI coding agents from code generators into engineering workflow systems.**

> SuperGraph doesn't make your coding agent smarter.
> It makes your coding agent behave like a disciplined engineer.

SuperGraph enforces planning, TDD, verification, review, and architecture-aware decision making through mandatory workflows, graph intelligence, and LSP-powered code analysis.

## What the plugin does

Supergraph is a workflow system for AI coding agents, not just a collection of prompts. Every non-trivial change follows:

`scan → analyze → plan → TDD → execute → fix → verify → review`

The graph layer is powered by [Codebase Memory MCP](https://github.com/DeusData/codebase-memory-mcp) (`>= 0.9.0`). It indexes the repository locally under a stable project identity, then provides evidence for blast radius, callers/callees, architecture clusters, dependency cycles, test gaps, complexity hotspots, and changed symbols. [Serena](https://github.com/oraios/serena) is optional and adds LSP-level references and diagnostics.

The workflow is evidence-gated: no production change without a verified RED test, no plan execution without an approved plan, and no completion claim without fresh verification and independent review. Hooks provide session reminders, plan guards, failure hints, and asynchronous graph freshness through Codebase Memory auto-watch.

### Windows hook behavior

On Windows, `hooks/run-hook.cmd` resolves Git Bash dynamically: `CLAUDE_CODE_GIT_BASH_PATH`, system Git, user-level Git, then `where git.exe`. This supports Git for Windows installed by winget without administrator rights. If Git Bash is unavailable, hooks print `supergraph: Git Bash not found — hooks skipped` and exit successfully because hooks are non-blocking; skills and MCP remain usable.

[![Version](https://img.shields.io/badge/version-2.2.4-blue)](./plugins/supergraph/CHANGELOG.md)
[![License](https://img.shields.io/badge/license-MIT-green)](./LICENSE)
[![Privacy](https://img.shields.io/badge/privacy-local--first-success)](./plugins/supergraph/PRIVACY.md)

---

## Why Supergraph

| Without Supergraph                      | With Supergraph                                                   |
| --------------------------------------- | ----------------------------------------------------------------- |
| Claude guesses which files are affected | Graph shows exact blast radius before first keystroke             |
| TDD is optional                         | RED test is mandatory — no production code without a failing test |
| "It works on my machine"                | 6-phase diagnose loop with deterministic feedback                 |
| Review is an afterthought               | Independent reviewer agent + graph cross-check before every merge |
| Context lost between sessions           | Handoff skill compacts full session state in seconds              |
| Refactors break hidden callers          | Serena LSP finds every reference before rename runs               |

---

## Supported Platforms

| Platform        | Install path                   | Project memory |
| --------------- | ------------------------------ | -------------- |
| Claude Code     | Marketplace or local plugin    | `CLAUDE.md`    |
| Antigravity CLI | Local installer                | `AGENTS.md`    |
| Codex CLI       | Marketplace or local installer | `AGENTS.md`    |
| OpenCode        | Local installer                | `OPENCODE.md`  |

Antigravity and Codex use `AGENTS.md`; OpenCode uses `OPENCODE.md`. No `CLAUDE.md` is required for those platforms.
Antigravity hook environment variables and event names are best-effort until verified against a real install.

---

## Prerequisites

| Dependency                                                          | Required | Install                                       |
| ------------------------------------------------------------------- | -------- | --------------------------------------------- |
| Claude Code, Antigravity CLI, Codex CLI, or OpenCode                 | ✅ Yes   | See your platform docs                        |
| Python 3.10+                                                        | ✅ Yes   | `brew install python` / `apt install python3` |
| [codebase-memory-mcp](https://github.com/DeusData/codebase-memory-mcp) | ✅ Yes | `pip install codebase-memory-mcp==0.9.0` |
| [uv](https://docs.astral.sh/uv/)                                    | Optional | `brew install uv`                             |
| [Serena MCP](https://github.com/oraios/serena)                      | Optional | See [Serena Setup](#serena-setup)             |
| Git                                                                 | ✅ Yes   | Already installed on most systems             |

---

## Installation

### One-command local installer

macOS, Linux, or WSL:

```bash
curl -fsSL https://raw.githubusercontent.com/datit309/supergraph/master/install.sh | bash
```

Windows PowerShell 5.1+:

```powershell
irm https://raw.githubusercontent.com/datit309/supergraph/master/install.ps1 | iex
```

The installer auto-detects Claude Code, Antigravity CLI, Codex CLI, or OpenCode. To select a platform explicitly on macOS, Linux, or WSL:

```bash
curl -fsSL https://raw.githubusercontent.com/datit309/supergraph/master/install.sh | bash -s -- --platform codex
```

The Git checkout lives at `${XDG_DATA_HOME:-$HOME/.local/share}/supergraph` on POSIX systems and `%LOCALAPPDATA%\supergraph` on Windows. Re-running the command performs `git pull --ff-only`; an uncommitted or diverged checkout is never overwritten. The manual clone instructions below remain available for development and auditing.

Security: inspect both installer scripts before piping remote code into a shell. For example, download the file, review it, then run it locally.

### Option 1 — Claude Code

```bash
# Install from Git marketplace (recommended)
/plugin marketplace add https://github.com/datit309/supergraph.git
/plugin install supergraph

# Or install from a local checkout
git clone https://github.com/datit309/supergraph.git
/plugin marketplace add ./supergraph
/plugin install supergraph

# MCP setup
pip install codebase-memory-mcp==0.9.0

# First run
/supergraph:scan

# Update later
/plugin marketplace update supergraph
```

### Option 2 — Antigravity CLI

```bash
git clone https://github.com/datit309/supergraph.git
cd supergraph

# Install plugin files for Antigravity
plugins/supergraph/install.sh --platform antigravity

# MCP setup
pip install codebase-memory-mcp==0.9.0

# First run
/supergraph:scan
```

Uses `AGENTS.md` for project instructions; no `CLAUDE.md` required.

### Option 3 — Codex CLI

```bash
# Add marketplace + install plugin (recommended)
codex plugin marketplace add datit309/supergraph
codex plugin add supergraph@supergraph

# Or manual install from a local checkout
git clone https://github.com/datit309/supergraph.git
cd supergraph
plugins/supergraph/install.sh --platform codex

# MCP setup
pip install codebase-memory-mcp==0.9.0

# First run
/supergraph:scan

# Update later
codex plugin marketplace upgrade supergraph
```

Uses `AGENTS.md` for project instructions; no `CLAUDE.md` required.

### Option 4 — OpenCode

```bash
git clone https://github.com/datit309/supergraph.git
cd supergraph

# Symlink skills + print opencode.json config snippet
plugins/supergraph/install.sh --platform opencode

# MCP setup
pip install codebase-memory-mcp==0.9.0

# First run
/supergraph:scan
```

The installer symlinks each skill folder into `.opencode/skills/<name>`, copies `OPENCODE.md` to your project root, and prints the config snippet to add to your `opencode.json`:

```json
{
  "instructions": ["OPENCODE.md"],
  "mcp": {
    "codebase-memory-mcp": { "type": "stdio", "command": "codebase-memory-mcp", "args": [] },
    "serena": { "type": "stdio", "command": "serena", "args": ["start-mcp-server", "--context=opencode", "--project-from-cwd"] }
  }
}
```

OpenCode uses `OPENCODE.md` for project instructions. Skills and MCP work out of the box. Hooks (SessionStart, caveman, etc.) are not available on OpenCode — the platform uses a JS/TS plugin model instead of bash hooks.

**Invoking skills on OpenCode:** use `/skills`, then choose `scan`, `plan`, `tdd`, etc. Do not use `/supergraph:*` in OpenCode.

---

## MCP Setup

### Codebase Memory MCP >= 0.9.0 (required)

```bash
pip install codebase-memory-mcp==0.9.0
codebase-memory-mcp --version
codebase-memory-mcp cli index_repository --repo-path "$(pwd)" --name supergraph --mode moderate
```

`/supergraph:scan` registers or builds the graph on first run and records `CBM_PROJECT` in `.supergraph-env`. Codebase Memory `auto_watch=true` keeps the local index fresh asynchronously; quality gates explicitly check index status and reindex before impact analysis.

### Serena Setup

Serena adds LSP-level intelligence: find all callers, safe codebase-wide rename, type diagnostics. Optional but recommended.

```bash
# 1. Install uv (if not already installed)
brew install uv   # macOS
# or: curl -LsSf https://astral.sh/uv/install.sh | sh

# 2. Install Serena
uv tool install -p 3.13 serena-agent
```

The plugin's `.mcp.json` already registers Serena with Claude Code — no extra setup needed.

Verify: run `/mcp` in Claude Code and confirm `serena` appears.

All supergraph skills use Serena automatically when available.

---

## Quick Start

```bash
# 1. Start a session — always run scan first
/supergraph:scan

# 2. Analyze — frames the problem, scores risk, proposes approach
#    (includes ambiguity grilling + 5-persona debate → GO/CAUTION/STOP)
/supergraph:analyze

# 3. Plan before any non-trivial change
/supergraph:plan

# 4. Implement with TDD
/supergraph:tdd

# 5. Auto-fix after coding
/supergraph:fix

# 6. Verify before claiming done
/supergraph:verify

# 7. Review before merge
/supergraph:review
```

**Small change (1-2 files, <10 lines)?** `/supergraph:tdd` → `/supergraph:fix` → `/supergraph:review`

**Ambiguous requirements or touching hub/bridge nodes?** Start with `/supergraph:analyze` — it handles grilling, risk scoring, and approach selection before you plan.

---

## Workflow

```
SESSION START
  → /supergraph:scan
  → Load graph, detect language, save .supergraph-env
         │
         ▼
PLANNING PHASE
  → /supergraph:analyze   (ambiguous scope, hub/bridge nodes)
  → /supergraph:plan      (blast radius, task breakdown, user approval)
  → Save to docs/supergraph/plans/YYYY-MM-DD-*.md
         │
    ┌────┴────────────────────┐
    ▼                         ▼
SMALL CHANGE              LARGE CHANGE
1-2 files, <10 lines      Multi-file, complex
/supergraph:tdd           /supergraph:execute
    │                         │ (parallel tasks)
    └────────┬────────────────┘
             ▼
  Per task: RED → GREEN → REFACTOR → commit
             │
             ▼
  /supergraph:fix
  Tests + lint + format + graph (max 3 iterations)
             │
             ▼
  /supergraph:integration   (if e2e configured)
             │
             ▼
  /supergraph:verify        (evidence gate)
             │
             ▼
  /supergraph:review        (graph-aware, independent agent)
  → APPROVED / NEEDS_CHANGES / BLOCKED
```

---

## Skills

All skills use the `/supergraph:` prefix to avoid conflicts with built-in commands.

### Core Workflow

| Skill                     | Purpose                                                    | When to use                                |
| ------------------------- | ---------------------------------------------------------- | ------------------------------------------ |
| `/supergraph:scan`        | Load graph, detect project language, save env              | **First thing every session**              |
| `/supergraph:analyze`     | Risk analysis + structured grill + approach selection      | Ambiguous scope, hub/bridge nodes involved |
| `/supergraph:plan`        | Graph scan, blast radius, task breakdown with TDD mapping  | Before writing any non-trivial code        |
| `/supergraph:execute`     | Dispatch saved plan, orchestrate parallel/sequential tasks | Plan is saved and approved                 |
| `/supergraph:tdd`         | RED → GREEN → REFACTOR per task                            | Implementing any feature or fix            |
| `/supergraph:fix`         | Auto-fix loop: test + lint + format + graph check          | After all coding, before claiming done     |
| `/supergraph:integration` | Run integration and e2e tests                              | After unit tests pass                      |
| `/supergraph:verify`      | Fresh evidence gate — no claims without proof              | Before done/ready/commit                   |
| `/supergraph:review`      | Independent code reviewer agent + graph cross-check        | Before merge or PR                         |

### Debugging & Investigation

| Skill                      | Purpose                                                   | When to use                                      |
| -------------------------- | --------------------------------------------------------- | ------------------------------------------------ |
| `/supergraph:diagnose`     | 6-phase debug: reproduce → hypothesize → instrument → fix | Bug exists, cause unknown                        |
| `/supergraph:zoom-out`     | One-shot domain-vocabulary module map                     | Lost in unfamiliar code, need re-orientation     |
| `/supergraph:architecture` | HTML + Mermaid architecture review report                 | Pre-refactor, onboarding, architectural planning |

### Planning & Requirements

| Skill                   | Purpose                                                      | When to use                        |
| ----------------------- | ------------------------------------------------------------ | ---------------------------------- |
| `/supergraph:prd`       | Convert conversation → structured PRD + GitHub Issue         | Requirements came from discussion  |
| `/supergraph:triage`    | Issue state machine → ready-for-agent / needs-info / wontfix | Processing backlog                 |
| `/supergraph:prototype` | Throwaway code to validate approach                          | Uncertain approach before planning |

### Session & Productivity

| Skill                 | Purpose                                        | When to use                                  |
| --------------------- | ---------------------------------------------- | -------------------------------------------- |
| `/supergraph:handoff` | Compact session state to file for next session | Context window exhausted, switching sessions |
| `/supergraph:caveman` | ~75% token compression mode                    | Long session, tight token budget             |

### Domain-Specific

| Skill                                  | Purpose                                                                          | When to use                            |
| -------------------------------------- | -------------------------------------------------------------------------------- | -------------------------------------- |
| `/supergraph:serena`                   | LSP setup, tool reference, symbol navigation                                     | Complex refactors, cross-file analysis |
| `/supergraph:database-migrations`      | Schema changes, rollbacks, zero-downtime patterns                                | Any DB migration work                  |
| `/supergraph:flutter-ui`               | Build Flutter UI from Figma MCP or image — scans design tokens, never hard-codes | Flutter UI from Figma or screenshot    |
| `/supergraph:flutter-dart-code-review` | 15-section Flutter/Dart review checklist                                         | Flutter/Dart code review               |
| `/supergraph:frontend-design`          | Production-grade UI — no generic AI aesthetics                                   | Web UI components and layouts          |
| `/supergraph:webapp-testing`           | Playwright-based web application testing                                         | E2E web testing                        |

---

## Smart Hooks

Skills are invoked manually. Hooks inject smart context automatically based on observable signals.

| Hook                     | Fires when                  | What it does                                                                                                                   |
| ------------------------ | --------------------------- | ------------------------------------------------------------------------------------------------------------------------------ |
| `SessionStart`           | Every session               | Loads CONTEXT.md vocabulary; reminds about recent handoff; activates caveman if flagged; suggests zoom-out when no plan exists |
| `UserPromptSubmit`       | Every message               | Detects caveman trigger phrases → activates compression; detects triage keywords → suggests triage                             |
| `PostToolUse Bash`       | After Bash runs             | Detects test failure patterns → injects `/supergraph:diagnose` suggestion                                                      |
| `PreCompact`             | Before context compaction   | Fires urgent handoff reminder with active plan task counts                                                                     |
| `PreToolUse Write/Edit`  | Before writing source files | Checks plan exists and is approved                                                                                             |
| `PostToolUse Write/Edit` | After writing source files  | Codebase Memory `auto_watch=true` refreshes asynchronously                                                                     |
| `Stop`                   | When Claude stops           | Reports plan progress + uncommitted changes                                                                                    |

**Activate caveman permanently** (persists across sessions):

```bash
echo "SUPERGRAPH_CAVEMAN=true" >> .supergraph-env
```

---

## Example Use Cases

**1. Adding a feature to a heavily-coupled service**

> "Add payment webhook handling to our API"

Scan detects `PaymentService` is a hub node connected to 14 modules. Plan shows blast radius before you write a line. TDD enforces a failing test first. Review catches the circular dependency before it ships.

---

**2. Debugging a flaky CI test**

> "Tests fail on CI but pass locally"

`/supergraph:diagnose` — 6-phase structured loop: reproduces the failure, maps involved files via graph traversal, checks for race conditions and env differences, proposes a targeted fix with evidence.

---

**3. Safe large-scale refactor**

> "Rename `UserService` to `AccountService` across the codebase"

Serena's `rename_symbol` + graph impact analysis shows every caller, test, and interface implementation before the rename runs. Zero broken imports.

---

**4. Onboarding to an unfamiliar codebase**

> "I just joined this project. Where do I start?"

`/supergraph:zoom-out` generates a domain-vocabulary module map in seconds. `/supergraph:architecture` produces an HTML + Mermaid report you can share with the team.

---

**5. Processing a messy issue backlog**

> "We have 40 open issues. Which ones can we actually ship?"

`/supergraph:triage` classifies each issue through a formal state machine — **ready-for-agent**, **needs-info**, or **wontfix** — with reasoning. Turns backlog chaos into a sprint queue.

---

**6. Context window running out mid-task**

> "Been coding for 2 hours, context is getting long"

`/supergraph:handoff` compresses full session state — active plan tasks, uncommitted changes, decisions made, next steps — into a compact file. Resume in a fresh session in under 30 seconds.

---

**7. Zero-downtime database migration**

> "Add a NOT NULL column to a 2M-row users table"

`/supergraph:database-migrations` guides the expand-contract pattern: add nullable → backfill → add constraint → drop old column. Rollback scripts at every step, zero-downtime strategies per your ORM.

---

## Supported Languages

Auto-detected from config files at session start:

| Config file                   | Stack                | Test                | Lint            | Format       |
| ----------------------------- | -------------------- | ------------------- | --------------- | ------------ |
| `pubspec.yaml`                | Flutter / Dart       | flutter test        | flutter analyze | dart format  |
| `package.json`                | Node.js / TypeScript | jest, vitest, mocha | eslint          | prettier     |
| `composer.json`               | PHP                  | phpunit, pest       | phpstan         | php-cs-fixer |
| `pyproject.toml` / `setup.py` | Python               | pytest              | ruff            | ruff format  |
| `go.mod`                      | Go                   | go test             | golangci-lint   | gofmt        |
| `Cargo.toml`                  | Rust                 | cargo test          | cargo clippy    | cargo fmt    |

---

## Team Setup

### 1. Install the plugin

```
/plugin marketplace add https://github.com/datit309/supergraph.git
/plugin install supergraph
```

### 2. Install MCP dependencies

```bash
pip install codebase-memory-mcp==0.9.0         # required
uv tool install -p 3.13 serena-agent           # optional — see Serena Setup above
```

### 3. Start working

Open any project in Claude Code and run:

```
/supergraph:scan
```

First run builds the graph automatically. That's it.

---

### Optional: Share workflow with your team

Commit these files to your project repo so every team member gets the same setup automatically when they clone:

**`.mcp.json`** — declares the MCP servers:

```json
{
  "mcpServers": {
    "codebase-memory-mcp": { "command": "codebase-memory-mcp", "args": [] },
    "serena": {
      "command": "serena",
      "args": [
        "start-mcp-server",
        "--context=claude-code",
        "--project-from-cwd"
      ]
    }
  }
}
```

**`CLAUDE.md`** — copy from the installed plugin's CLAUDE.md as a starting point, then customize for your project.

**`.githooks/pre-commit`** — run tests/lint on every commit:

```bash
mkdir -p .githooks
# copy content from: ~/.claude/plugins/cache/supergraph/supergraph/<version>/.githooks/pre-commit
chmod +x .githooks/pre-commit
git config core.hooksPath .githooks
```

Add to `.gitignore`:

```
.claude/settings.local.json
.supergraph-env
```

### What gets committed vs. what stays local

| Path                          | Commit?     | Why                                                            |
| ----------------------------- | ----------- | -------------------------------------------------------------- |
| `.mcp.json`                   | ✅ Yes      | MCP server config — team needs same MCPs                       |
| `CLAUDE.md`                   | ✅ Yes      | Project-level workflow instructions                            |
| `.codebase-memory/graph.db.zst` | Optional | Compressed team bootstrap artifact; local index is in `~/.cache/codebase-memory-mcp` |
| `docs/supergraph/plans/`      | ✅ Yes      | Plans are contracts — visible to whole team                    |
| `.github/`                    | ✅ Yes      | PR templates, CI workflows, issue templates                    |
| `.githooks/pre-commit`        | ✅ Yes      | Shared commit quality gate                                     |
| `.supergraph-env`             | ⚠️ Optional | Contains personal flags like `CAVEMAN` — gitignore if personal |
| `.claude/settings.local.json` | ❌ No       | Personal tool permissions                                      |

See [docs/TEAM-SETUP.md](./plugins/supergraph/docs/TEAM-SETUP.md) for CI/CD pipelines, pre-commit hooks, PR templates, and full onboarding guide.

---

## Hard Rules

These rules are enforced by the skill chain and hooks — not optional:

1. Never write code without a plan (skip only for trivial changes: <10 lines, 1 file)
2. Never implement without a failing test — TDD is mandatory
3. Never read entire codebase — use graph blast radius instead
4. Never modify hub nodes without explicit user approval
5. Never skip the auto-fix loop after coding
6. Never commit if tests fail or review returns CRITICAL
7. Always use graph MCP tools before assuming file relationships
8. Always detect language before running test/lint commands
9. Always read the skill file before executing each phase
10. Always save plans to `docs/supergraph/plans/` for multi-session work

---

## Escalation Table

| Condition                          | Action                                     |
| ---------------------------------- | ------------------------------------------ |
| TDD fails 3 times on the same task | Mark `stuck`, skip, continue next task     |
| Fix loop fails 3 iterations        | STOP — report issues — never commit broken |
| Review returns `NEEDS_CHANGES`     | Return to fix (max 2 review cycles)        |
| Review returns `BLOCKED`           | Escalate to human immediately              |
| Blast radius > 20 files            | STOP — discuss with user before proceeding |
| Hub node modification              | Require explicit user approval             |
| Surprise score > 0.7               | Require investigation and justification    |
| New circular dependency detected   | Block — fix before merge                   |

---

## Project Structure

```
plugins/supergraph/
├── .claude-plugin/
│   └── marketplace.json        # Plugin manifest (v2.2.0)
├── skills/
│   ├── scan/                   # Context loading & graph build
│   ├── analyze/                # Risk analysis + grill + approach selection
│   ├── plan/                   # Graph-informed plan creation
│   ├── execute/                # Plan dispatch & orchestration
│   ├── tdd/                    # RED → GREEN → REFACTOR per task
│   ├── fix/                    # Auto-fix loop (test + lint + graph)
│   ├── integration/            # E2E / integration tests
│   ├── verify/                 # Verification gate
│   ├── review/                 # Final graph-aware review
│   ├── diagnose/               # 6-phase structured debugging
│   ├── zoom-out/               # One-shot domain module map
│   ├── architecture/           # HTML + Mermaid architecture review
│   ├── prd/                    # PRD generation → GitHub Issues
│   ├── triage/                 # Issue state machine
│   ├── prototype/              # Throwaway Logic/UI validation
│   ├── handoff/                # Session compaction
│   ├── caveman/                # Token-compression mode
│   ├── serena/                 # Serena LSP integration
│   ├── database-migrations/    # DB migration patterns
│   ├── flutter-ui/             # Flutter UI from Figma/image
│   ├── flutter-dart-code-review/ # Flutter/Dart review checklist
│   ├── frontend-design/        # Production-grade UI
│   └── webapp-testing/         # Playwright web testing
├── agents/
│   ├── plan-writer.md          # Creates plans, never writes code
│   ├── plan-reviewer.md        # Reviews plans pre-execution
│   ├── executor.md             # Executes plans, never creates them
│   └── code-reviewer.md        # Final independent review agent
├── hooks/
│   ├── session-start           # CONTEXT.md load, handoff reminder
│   ├── user-prompt-submit      # Caveman activation, triage hint
│   ├── post-tool-use-bash      # Test failure detection
│   ├── pre-compact             # Handoff reminder before compaction
│   ├── pre-tool-use            # Plan existence guard
│   ├── post-tool-use           # Auto graph update after writes
│   ├── stop                    # Plan progress report
│   └── hooks.json              # Event → script mapping
├── docs/
│   └── TEAM-SETUP.md           # Team onboarding guide
├── PRIVACY.md                  # Privacy policy
├── CHANGELOG.md                # Version history
├── CLAUDE.md                   # Engineering principles
└── settings.json               # Permissions + allowed commands
```

---

## Privacy

Supergraph is **local-first** — no remote servers, no telemetry, no code uploaded anywhere.

All graph analysis runs locally. Codebase Memory stores its index in `~/.cache/codebase-memory-mcp`; teams may optionally share `.codebase-memory/graph.db.zst`. Serena also runs locally.

See [PRIVACY.md](./plugins/supergraph/PRIVACY.md) for the full policy.

---

## Changelog

See [CHANGELOG.md](./plugins/supergraph/CHANGELOG.md) for full version history.

**Current: v2.2.4** — Migrated graph intelligence to Codebase Memory MCP, added project/index lifecycle checks, and fixed Windows hooks for system/user-level Git Bash installations.

**v2.2.0** — Added 8 new skills (diagnose, handoff, triage, caveman, prd, architecture, prototype, zoom-out), CONTEXT.md shared vocabulary system, 4 smart automation hooks.

---

## License

MIT — see [LICENSE](./LICENSE) for details.

---

## Links

- **GitHub**: https://github.com/datit309/supergraph
- **Issues & PRs**: https://github.com/datit309/supergraph/issues
- **Privacy**: [PRIVACY.md](./plugins/supergraph/PRIVACY.md)
- **Team Setup**: [docs/TEAM-SETUP.md](./plugins/supergraph/docs/TEAM-SETUP.md)
- **Changelog**: [CHANGELOG.md](./plugins/supergraph/CHANGELOG.md)
