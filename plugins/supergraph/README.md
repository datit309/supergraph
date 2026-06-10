# Supergraph for Claude Code

Plugin cho Claude Code: mandatory AI workflows + intelligent codebase graph analysis + Serena LSP integration.

Combines [superpowers](https://github.com/obra/superpowers) methodology
with [code-review-graph](https://github.com/tirth8205/code-review-graph) AST analysis
and [Serena](https://github.com/oraios/serena) LSP-powered code intelligence.

## Install

### Option 1: Git Repository (Recommended)

```bash
# Add plugin marketplace from Git repo
/plugin marketplace add https://github.com/datit309/supergraph.git

# Install plugin
/plugin install supergraph
```

### Option 2: Local Directory

```bash
# Clone repo
git clone https://github.com/datit309/supergraph.git

# Add plugin to marketplace
/plugin marketplace add ./supergraph

# Install plugin
/plugin install supergraph
```

## Quick Start

```bash
pip install code-review-graph && code-review-graph install && code-review-graph build
```

## Workflow

```
Session start     → /supergraph:scan         (load graph, detect project)
Ambiguous scope   → /supergraph:analyze      (risk analysis, approach selection)
Task received     → /supergraph:plan         (graph-informed plan, user approval)
Implementation    → /supergraph:tdd          (RED → GREEN → REFACTOR)
Post-code         → /supergraph:fix          (auto-fix loop: test → lint → graph)
Integration       → /supergraph:integration  (e2e/integration tests)
Before claim      → /supergraph:verify       (fresh evidence gate)
Pre-merge         → /supergraph:review       (graph + code review → verdict)
```

**Quick path** (small changes, 1-2 files): skip plan → `/supergraph:tdd` → `/supergraph:fix` → `/supergraph:review`

## Skills

### Core Workflow

| Skill | When to use |
|---|---|
| `/supergraph:scan` | Start of every session — loads graph context |
| `/supergraph:analyze` | Ambiguous scope, touching hub/bridge nodes |
| `/supergraph:plan` | Before writing any non-trivial code |
| `/supergraph:tdd` | Implementing any feature or fix |
| `/supergraph:execute` | Dispatching saved plan files |
| `/supergraph:fix` | After all coding — auto-fix loop |
| `/supergraph:integration` | After unit tests pass |
| `/supergraph:verify` | Before claiming done/ready or committing |
| `/supergraph:review` | Before merging or when review is needed |

### Debugging & Investigation

| Skill | When to use |
|---|---|
| `/supergraph:diagnose` | Bug exists, cause unknown — structured 6-phase debug loop |
| `/supergraph:zoom-out` | Lost in unfamiliar code — get a domain-vocabulary module map |
| `/supergraph:architecture` | Proactive architecture review with HTML + Mermaid report |

### Planning & Requirements

| Skill | When to use |
|---|---|
| `/supergraph:prd` | Requirements came from conversation — convert to structured PRD |
| `/supergraph:triage` | Process backlog — classify issues into ready-for-agent / needs-info / wontfix |
| `/supergraph:prototype` | Approach is uncertain — throwaway code to validate before planning |

### Session & Productivity

| Skill | When to use |
|---|---|
| `/supergraph:handoff` | Context window exhausted or switching sessions — compact state for next session |
| `/supergraph:caveman` | Long session, token budget, verbose responses — ~75% output compression |

### Domain-Specific

| Skill | When to use |
|---|---|
| `/supergraph:serena` | Complex refactors, cross-file symbol analysis |
| `/supergraph:database-migrations` | Schema changes, rollbacks, zero-downtime deploys |
| `/supergraph:flutter-dart-code-review` | Flutter/Dart code review checklist |
| `/supergraph:frontend-design` | Production-grade UI components and layouts |
| `/supergraph:webapp-testing` | Playwright-based web application testing |

## Smart Automation — Hooks

Skills are invoked manually, but hooks inject smart reminders automatically based on observable signals.

| Hook | Trigger | What it does |
|---|---|---|
| `SessionStart` | Every session start | Loads CONTEXT.md vocabulary; reminds about recent handoff file; activates caveman if flagged; suggests zoom-out when no plan exists |
| `PostToolUse Bash` | After every Bash command | Detects test failure patterns → injects `/supergraph:diagnose` suggestion |
| `PreCompact` | Before context compaction | Injects urgent `/supergraph:handoff` reminder with active plan task counts |
| `UserPromptSubmit` | Every user message | Detects caveman phrases → activates compression; detects triage keywords → suggests `/supergraph:triage` |
| `PreToolUse Write/Edit` | Before writing source files | Checks plan exists and is approved |
| `PostToolUse Write/Edit` | After writing source files | Triggers `code-review-graph update` |
| `Stop` | When Claude stops | Reports plan progress; warns about uncommitted changes |

**Caveman via env flag** (persistent across sessions):
```bash
echo "SUPERGRAPH_CAVEMAN=true" >> .supergraph-env
```

## Agents

| Agent | Role |
|---|---|
| `supergraph:plan-writer` | Create graph-informed implementation plans — never writes code |
| `supergraph:plan-reviewer` | Independently review plans before execution |
| `supergraph:executor` | Execute saved plans with TDD and checkpoints |
| `supergraph:code-reviewer` | Independent graph-enhanced code review before merge |

## MCP Tools

### code-review-graph

| Tool | Purpose |
|---|---|
| `build_or_update_graph_tool` | Build/refresh AST graph |
| `get_minimal_context_tool` | Minimal context for session start |
| `list_graph_stats_tool` | Graph health overview |
| `get_impact_radius_tool` | Blast radius for a file/symbol |
| `get_hub_nodes_tool` | Most-connected (riskiest) nodes |
| `get_bridge_nodes_tool` | Cross-module chokepoints |
| `list_communities_tool` | Module cluster boundaries |
| `get_surprising_connections_tool` | Unexpected coupling |
| `get_knowledge_gaps_tool` | Untested hotspots |
| `get_review_context_tool` | Token-optimized review context |
| `get_architecture_overview_tool` | Architecture map |
| `get_affected_flows_tool` | Flows affected by a change |
| `detect_changes_tool` | Risk-scored change impact |
| `query_graph_tool` | Callers / callees / tests for a symbol |
| `traverse_graph_tool` | BFS/DFS graph exploration |
| `semantic_search_nodes_tool` | Search nodes by meaning |

### Serena (LSP-powered)

| Tool | Purpose |
|---|---|
| `find_referencing_symbols` | All callers/usages of a symbol |
| `find_implementations` | All implementations of interface/abstract |
| `get_diagnostics_for_file` | IDE-level type errors for a file |
| `rename_symbol` | Safe codebase-wide symbol rename |
| `replace_symbol_body` | Targeted function body replacement |
| `get_symbols_overview` | Project structure map |

## Supported Languages

| Language | Test | Lint | Format |
|---|---|---|---|
| Node.js / TypeScript | jest, vitest, mocha | eslint | prettier |
| Flutter / Dart | flutter test | flutter analyze | dart format |
| PHP | phpunit, pest | phpstan | php-cs-fixer |
| Python | pytest | ruff | ruff format |
| Go | go test | golangci-lint | gofmt |
| Rust | cargo test | cargo clippy | cargo fmt |

## Team Use

See [docs/TEAM-SETUP.md](docs/TEAM-SETUP.md) for onboarding, CI/CD, pre-commit hooks, and PR templates.

**Quick team setup:**

```bash
cp -r supergraph/plugins/supergraph/.claude-plugin /path/to/repo/.claude-plugin
cp -r supergraph/plugins/supergraph/.github /path/to/repo/.github
cp supergraph/plugins/supergraph/.githooks/pre-commit /path/to/repo/.githooks/
chmod +x /path/to/repo/.githooks/pre-commit
cd /path/to/repo && git config core.hooksPath .githooks
echo ".claude/settings.local.json" >> .gitignore
```

## Rules

- Never write code without a plan (skip only for small 1-2 file changes)
- Always TDD: RED → GREEN → REFACTOR
- Environment Context mandatory in plan files — saved to `docs/supergraph/plans/`
- Checkpoint after each task: `git add [exact files] && git commit`
- Max 3 retries per auto-fix iteration — stop and ask if blocked
- CRITICAL issues block merge

## License

MIT
