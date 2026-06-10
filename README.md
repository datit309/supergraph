# Supergraph for Claude Code

Plugin cho Claude Code: mandatory AI workflows + intelligent codebase graph analysis + Serena LSP integration.

Combines [superpowers](https://github.com/obra/superpowers) methodology with [code-review-graph](https://github.com/tirth8205/code-review-graph) AST analysis and [Serena](https://github.com/oraios/serena) LSP-powered code intelligence for production-grade software engineering.

## Highlights

- **Mandatory guarded workflows** — no code without plan, no merge without review
- **Codebase graph analysis** — blast radius, hub nodes, surprising connections
- **Serena LSP integration** — symbol navigation, type diagnostics, safe rename/replace
- **Structured debugging** — 6-phase diagnose loop with deterministic feedback loop
- **Architecture review** — HTML + Mermaid report with recommendation strength badges
- **Requirements pipeline** — PRD generation + issue triage → ready-for-agent handoff
- **Context compaction** — handoff skill for multi-session continuity
- **Token-compression mode** — caveman skill for ~75% output reduction
- **CONTEXT.md vocabulary** — shared domain glossary across the skill chain
- **Parallel task execution** — independent tasks run concurrently, dependencies respected
- **Strict TDD enforcement** — RED → GREEN → REFACTOR with checkpoint commits
- **Multi-language support** — Node.js, Flutter, PHP, Python, Go, Rust auto-detection
- **Escalation paths built-in** — stuck tasks, fix loops, review cycles, rollback

## Quick Install

```bash
# From Git repository
/plugin marketplace add https://github.com/datit309/supergraph.git
/plugin install supergraph

# Update plugin
/plugin marketplace update supergraph

# Or from local directory
git clone https://github.com/datit309/supergraph.git
/plugin marketplace add ./supergraph
/plugin install supergraph
```

## Graph Setup

```bash
pip install code-review-graph
code-review-graph install
code-review-graph build
```

## Skills — What They Do & When to Run

All skills use `/supergraph:` prefix to avoid conflicts with built-in commands.

### Core Workflow

| Skill | File | Purpose | When |
|---|---|---|---|
| **Scan** | `skills/scan/SKILL.md` | Load graph, detect project, save env | Session start — **first thing** |
| **Analyze** | `skills/analyze/SKILL.md` | Risk analysis + structured grill + approach selection | Ambiguous requirements, hub/bridge nodes |
| **Plan** | `skills/plan/SKILL.md` | Graph scan, blast radius, task breakdown | Before writing **any** code |
| **Execute** | `skills/execute/SKILL.md` | Dispatch plan, orchestrate tasks | Plan saved, ready to implement |
| **TDD** | `skills/tdd/SKILL.md` | Per-task RED → GREEN → REFACTOR | Implementing feature/fix |
| **Fix** | `skills/fix/SKILL.md` | Auto-fix: test + lint + format + graph | After all coding, before verify |
| **Integration** | `skills/integration/SKILL.md` | Integration + e2e tests | After unit tests pass |
| **Verify** | `skills/verify/SKILL.md` | Fresh evidence gate | Before claiming done/ready/commit |
| **Review** | `skills/review/SKILL.md` | Graph review → verdict | Before merge/PR |

### Debugging & Investigation

| Skill | File | Purpose | When |
|---|---|---|---|
| **Diagnose** | `skills/diagnose/SKILL.md` | 6-phase debug: feedback loop → hypothesize → instrument → fix | Bug exists, cause unknown |
| **Zoom-out** | `skills/zoom-out/SKILL.md` | One-shot domain-vocabulary module map | Lost in unfamiliar code, re-orienting |
| **Architecture** | `skills/architecture/SKILL.md` | HTML + Mermaid architecture review report | Pre-refactor, onboarding, architectural planning |

### Planning & Requirements

| Skill | File | Purpose | When |
|---|---|---|---|
| **PRD** | `skills/prd/SKILL.md` | Convert conversation → structured PRD + GitHub Issue | Requirements came from discussion |
| **Triage** | `skills/triage/SKILL.md` | Issue state machine → ready-for-agent handoff | Processing backlog, preparing work for automation |
| **Prototype** | `skills/prototype/SKILL.md` | Throwaway Logic or UI branch to validate approach | Approach uncertain before planning |

### Session & Productivity

| Skill | File | Purpose | When |
|---|---|---|---|
| **Handoff** | `skills/handoff/SKILL.md` | Compact session state to $TMPDIR for next session | Context window exhausted, switching sessions |
| **Caveman** | `skills/caveman/SKILL.md` | ~75% token compression mode | Long session, token budget, verbose output |

### Domain-Specific

| Skill | File | Purpose | When |
|---|---|---|---|
| **Serena** | `skills/serena/SKILL.md` | LSP symbol nav, diagnostics, safe refactor | Complex refactors, cross-file analysis |
| **Database Migrations** | `skills/database-migrations/SKILL.md` | Schema changes, rollbacks, zero-downtime | Any DB migration work |
| **Flutter Dart Code Review** | `skills/flutter-dart-code-review/SKILL.md` | 15-section Flutter/Dart checklist | Flutter/Dart code review |
| **Frontend Design** | `skills/frontend-design/SKILL.md` | Production-grade UI, no generic AI aesthetics | Web UI components and layouts |
| **Webapp Testing** | `skills/webapp-testing/SKILL.md` | Playwright-based web testing | E2E web application testing |

## Workflow — Session to Merge

```
┌─────────────────────────────────────────────────────────────┐
│ SESSION START                                               │
│   → /supergraph:scan                                        │
│   → Build graph, detect language, save .supergraph-env      │
└──────────────────────────┬──────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────┐
│ PLANNING PHASE                                              │
│   → /supergraph:plan (or /supergraph:analyze + plan)        │
│   → Graph analysis, blast radius, task breakdown            │
│   → Save to docs/supergraph/plans/YYYY-MM-DD-*.md          │
└──────────────────────────┬──────────────────────────────────┘
                           │
            ┌──────────────┴──────────────┐
            ▼                             ▼
    ┌───────────────┐           ┌──────────────────────┐
    │ SMALL CHANGE  │           │ LARGE CHANGE         │
    │ 1-2 files,    │           │ Multi-file,          │
    │ <10 lines     │           │ complex, risky       │
    │               │           │                      │
    │ /supergraph:  │           │ /supergraph:analyze  │
    │ tdd → fix →   │           │ → plan → execute     │
    │ verify →      │           │ → (per-task TDD)     │
    │ review        │           │ → fix → verify →     │
    │               │           │   review             │
    └───────────────┘           └──────────────────────┘
```

### Detailed Flow

1. **Scan** → Build graph, detect project language/framework
2. **Analyze** (optional) → Risk assessment, approach selection for ambiguous tasks
3. **Plan** → Graph analysis, blast radius, task decomposition, TDD mapping
4. **Execute** → Parallel dispatch for independent tasks, sequential for dependencies
5. **TDD per task** → RED (fail) → GREEN (minimal) → REFACTOR (cleanup)
6. **Fix loop** → Test + lint + format + graph (max 3 iterations)
7. **Integration** → Integration/e2e tests if configured
8. **Verify** → Fresh evidence gate — no claims without proof
9. **Review** → Independent graph-aware code review → PASS / NEEDS_CHANGES / BLOCKED

## Agents — Who Does What

| Agent | Role | Created By | Executes |
|---|---|---|---|
| **supergraph:plan-writer** | Plan only, never code | `/supergraph:plan` | Graph analysis → plan file |
| **supergraph:plan-reviewer** | Review plans pre-execution | Auto-dispatched by plan | Completeness + spec alignment |
| **supergraph:executor** | Execute only, never plan | `/supergraph:execute` | Plan tasks via TDD + checkpoints |
| **supergraph:code-reviewer** | Final code review | Auto-dispatched by review | Diff review → verdict |

Agents are self-contained — they receive only relevant context, no session history.

## Codebase Graph Analysis

Powered by `code-review-graph` AST indexing, Supergraph maps your entire codebase as an interconnected graph:

| Analysis | Tool | Use When |
|---|---|---|
| Blast radius | `get_impact_radius_tool` | What files break if I change X? |
| Hub nodes | `get_hub_nodes_tool` | Which files are high-risk central nodes? |
| Bridge nodes | `get_bridge_nodes_tool` | Where does coupling cross module boundaries? |
| Communities | `list_communities_tool` | How is the code clustered? |
| Test coverage | `get_knowledge_gaps_tool` | Which files lack tests? |
| Surprising connections | `get_surprising_connections_tool` | Unexpected dependencies lurking? |
| Architecture overview | `get_architecture_overview_tool` | Module diagram of the codebase |
| Affected flows | `get_affected_flows_tool` | Which user journeys break? |
| Change detection | `detect_changes_tool` | Risk-scored impact of recent changes |

The graph is used to:

- **Warn before hub node edits** (require user approval)
- **Flag high blast radius** (>20 files → discuss with user)
- **Detect circular dependencies** (block merge)
- **Calculate surprise scores** (>0.7 → investigate)
- **Route cross-community changes** through review gates

## CONTEXT.md — Shared Domain Vocabulary

`CONTEXT.md` is a project-level glossary that grows as the skill chain runs. Skills read it before acting and write to it when new domain concepts crystallize.

**Create once per project:**
```bash
# Root of your project repo
touch CONTEXT.md
```

**Format:**
```markdown
# Project Vocabulary

## <term>
[Definition in domain language — not implementation details]

## <invariant>
[A hidden constraint or rule the codebase enforces]
```

**How skills use it:**
- `analyze` — reads before framing problem; writes new terms after approach is locked
- `plan` — reads step 0; uses domain terms in task descriptions instead of raw class/file names
- `review` — writes when review surfaces hidden domain invariants
- `architecture` — reads and writes during architecture review grilling
- `prd` — reads for existing terms; writes new terms from requirements
- `zoom-out` — reads to use domain vocabulary in module map; flags missing terms

**Result:** progressive improvement across sessions — the skill chain gets smarter as the project evolves.

## Serena LSP Integration

Serena provides IDE-level code intelligence on top of graph analysis:

| Tool | Purpose |
|---|---|
| `find_referencing_symbols` | All callers/usages of a symbol |
| `find_implementations` | All implementations of interface/abstract |
| `get_diagnostics_for_file` | IDE-level type errors for a file |
| `rename_symbol` | Safe codebase-wide symbol rename |
| `replace_symbol_body` | Targeted function body replacement |
| `get_symbols_overview` | Project structure map |

Use `/supergraph:serena` before:
- Complex refactors (rename across codebase, API signature changes)
- When blast radius is unclear and graph tools lack symbol-level depth
- During fix: triage type errors before running test suite
- After architectural changes: verify no orphaned references remain

## Smart Automation — Hooks

Skills are invoked manually. Hooks inject reminders automatically based on observable signals — no noise, only fires when there's a clear signal.

| Hook | Trigger | Signal | Action |
|---|---|---|---|
| `SessionStart` | Every session | CONTEXT.md exists | Inject domain vocabulary into context |
| `SessionStart` | Every session | Handoff file in `$TMPDIR` < 48h old | Remind to read handoff before starting |
| `SessionStart` | Every session | `SUPERGRAPH_CAVEMAN=true` in `.supergraph-env` | Activate token compression mode |
| `SessionStart` | Every session | No active plan file | Suggest `/supergraph:zoom-out` to orient |
| `UserPromptSubmit` | Every message | "caveman", "compress", "token diet"... | Activate caveman mode (~75% reduction) |
| `UserPromptSubmit` | Every message | "normal mode", "verbose"... | Deactivate caveman mode |
| `UserPromptSubmit` | Every message | "triage", "backlog"... | Suggest `/supergraph:triage` |
| `PostToolUse Bash` | After Bash runs | `exit_code ≠ 0` + test failure pattern | Suggest `/supergraph:diagnose` |
| `PreCompact` | Before context compact | Always | Urgent `/supergraph:handoff` reminder + plan status |
| `PreToolUse Write/Edit` | Before writing source | No approved plan | Warn and block |
| `PostToolUse Write/Edit` | After writing source | Source file changed | Auto-update code-review-graph |
| `Stop` | Claude stops | Active plan exists | Report task progress + uncommitted changes |

**Activate caveman permanently** (persists across sessions):
```bash
echo "SUPERGRAPH_CAVEMAN=true" >> .supergraph-env
```

## Hard Rules — Non-Negotiable

1. **Never code without a plan** — skip only for trivial changes (<10 lines, 1 file)
2. **Never implement without a failing test** — TDD is mandatory
3. **Never read entire codebase** — use graph blast radius, not grep
4. **Never modify hub nodes without approval** — stop and ask
5. **Never skip the auto-fix loop** — run `/supergraph:fix` after coding
6. **Never commit if tests fail or review is CRITICAL**
7. **Always use graph MCP tools** before assuming relationships
8. **Always detect language** and use correct test/lint commands
9. **Always read the skill file** before executing each phase
10. **Always save plans** to `docs/supergraph/plans/` for long-running work
11. **Use Serena tools** when available — prefer `replace_symbol_body`/`rename_symbol` over raw text edits

## Stuck / Escalation Table

| Condition | Action |
|---|---|
| TDD fails 3 times | Mark task `stuck`, skip, continue next |
| Fix loop fails 3 iterations | STOP → report issues → never commit broken |
| Review returns `NEEDS_CHANGES` | Return to fix (max 2 review cycles) |
| Review returns `BLOCKED` | Escalate to human immediately |
| Blast radius > 20 files | STOP — discuss with user before proceeding |
| Hub node modification | REQUIRE explicit user approval |
| Surprise score > 0.7 | REQUIRE investigation & justification |
| New circular dependency | BLOCK — fix before merge |

## Auto Language Detection

At session start, the scan skill auto-detects project type:

| Config file | Type | Test | Lint | Format |
|---|---|---|---|---|
| `pubspec.yaml` | Flutter/Dart | flutter test | flutter analyze | dart format |
| `package.json` | Node.js / TypeScript | jest, vitest, mocha | eslint | prettier |
| `composer.json` | PHP | phpunit, pest | phpstan | php-cs-fixer |
| `pyproject.toml` / `setup.py` | Python | pytest | ruff | ruff format |
| `go.mod` | Go | go test | golangci-lint | gofmt |
| `Cargo.toml` | Rust | cargo test | cargo clippy | cargo fmt |

## Project Structure

```
.
├── README.md                       # This file
├── SKILL.md                        # Skill dispatch table + hard rules
├── SOUL.md                         # Engineering identity + defaults
│
├── plugins/supergraph/
│   ├── .claude-plugin/
│   │   └── plugin.json             # Plugin manifest (v2.1.0)
│   ├── skills/
│   │   ├── scan/                   # Context loading & graph build
│   │   ├── analyze/                # Risk analysis + grill + approach selection
│   │   ├── plan/                   # Graph-informed plan creation
│   │   ├── execute/                # Plan dispatch & orchestration
│   │   ├── tdd/                    # RED-GREEN-REFACTOR per task
│   │   ├── fix/                    # Auto-fix loop
│   │   ├── integration/            # E2E / integration tests
│   │   ├── verify/                 # Verification gate
│   │   ├── review/                 # Final graph-aware review
│   │   ├── diagnose/               # 6-phase structured debugging
│   │   ├── zoom-out/               # One-shot module map
│   │   ├── architecture/           # HTML + Mermaid architecture review
│   │   ├── prd/                    # PRD generation → GitHub Issues
│   │   ├── triage/                 # Issue state machine
│   │   ├── prototype/              # Throwaway Logic/UI validation
│   │   ├── handoff/                # Session compaction for next session
│   │   ├── caveman/                # Token-compression mode
│   │   ├── serena/                 # Serena LSP integration
│   │   ├── database-migrations/    # DB migration patterns
│   │   ├── flutter-dart-code-review/ # Flutter/Dart checklist
│   │   ├── frontend-design/        # Production-grade UI
│   │   └── webapp-testing/         # Playwright web testing
│   ├── agents/
│   │   ├── plan-writer.md          # Creates plans, never executes
│   │   ├── plan-reviewer.md        # Reviews plans pre-execution
│   │   ├── executor.md             # Executes plans, never creates
│   │   └── code-reviewer.md        # Final review agent
│   ├── hooks/
│   │   ├── session-start           # CONTEXT.md load, handoff reminder, caveman flag, zoom-out hint
│   │   ├── user-prompt-submit      # Caveman activation/deactivation, triage hint
│   │   ├── post-tool-use-bash      # Test failure detection → diagnose suggestion
│   │   ├── pre-compact             # Handoff reminder before context compaction
│   │   ├── pre-tool-use            # Plan existence + approval guard
│   │   ├── post-tool-use           # Auto graph update after file writes
│   │   ├── bash-guard              # Block destructive commands
│   │   ├── stop                    # Plan progress report
│   │   └── hooks.json              # Hook event → script mapping
│   ├── themes/                     # Claude Code theme
│   ├── .github/workflows/          # CI/CD graph review workflow
│   ├── .githooks/                  # pre-commit lint + test
│   ├── docs/TEAM-SETUP.md          # Team onboarding guide
│   ├── CLAUDE.md                   # Engineering principles
│   └── settings.json               # Permissions + allowed commands
│
└── docs/
    └── supergraph/plans/           # Plan files saved here
```

## Team Setup

Copy project scaffolding to your repo for team-wide consistency:

```bash
cp -r plugins/supergraph/.claude-plugin /path/to/your/repo/.claude-plugin
cp -r plugins/supergraph/.github /path/to/your/repo/.github
cp plugins/supergraph/.githooks/pre-commit /path/to/your/repo/.githooks/
chmod +x /path/to/your/repo/.githooks/pre-commit
cd /path/to/your/repo && git config core.hooksPath .githooks
echo ".claude/settings.local.json" >> .gitignore
```

See [docs/TEAM-SETUP.md](./plugins/supergraph/docs/TEAM-SETUP.md) for CI/CD pipelines, pre-commit hooks, PR templates, and team onboarding.

## Stack Defaults

When no stack is specified in user requests:

- **Backend**: Node.js + NestJS (TypeScript), REST + WebSocket
- **Frontend**: Next.js (App Router, TypeScript, Tailwind CSS)
- **Mobile**: Flutter (Dart)
- **Database**: PostgreSQL (primary), MongoDB (document store), Redis (cache/queue)
- **ORM**: TypeORM (PostgreSQL + MongoDB), Mongoose fallback
- **Auth**: JWT + Refresh Token rotation, bcrypt hashing
- **Infra**: Docker, Nginx reverse proxy, SSL/TLS via Let's Encrypt
- **VCS**: Git + GitHub/Bitbucket

Exact versions are auto-detected from project config files.

## Security Baseline

Security is not a feature — it's the baseline. The plugin enforces:

- Input validation at every boundary (API, DB, UI)
- Least-privilege permissions (DB users, IAM roles, API keys)
- Never secrets in code (`.env` only, no logging)
- Parameterized queries always (no string concatenation)
- OWASP Top 10 awareness on every endpoint
- HTTPS everywhere + HSTS headers mandatory
- Rate limiting + brute-force protection on auth endpoints
- Dependency hygiene (vulnerable package detection)
- JWT best practices (short expiry, httpOnly refresh cookies)
- Strict CORS (explicit whitelist, no `*` in production)

## MCP Tools Reference

### code-review-graph

```yaml
build_or_update_graph_tool:      Build/refresh AST graph from codebase
get_minimal_context_tool:        Minimal context for session start
list_graph_stats_tool:           Graph health + index status
get_impact_radius_tool:          Blast radius for file changes
get_hub_nodes_tool:              High-centrality files (risk hotspots)
get_bridge_nodes_tool:           Cross-module coupling chokepoints
list_communities_tool:           Detected code clusters/modules
get_surprising_connections_tool: Unexpected coupling warnings
get_knowledge_gaps_tool:         Untested files coverage gaps
get_review_context_tool:         Token-optimized relevant context
get_architecture_overview_tool:  Module dependency diagram
get_affected_flows_tool:         Affected user journeys
detect_changes_tool:             Risk-scored impact analysis
query_graph_tool:                Symbol lookup (callers/callees/tests)
traverse_graph_tool:             BFS/DFS path exploration
semantic_search_nodes_tool:      Search by semantic meaning
```

### Serena (LSP-powered)

```yaml
find_referencing_symbols:  All callers/usages of a symbol
find_implementations:      All implementations of interface/abstract
get_diagnostics_for_file:  IDE-level type errors for a file
rename_symbol:             Safe codebase-wide symbol rename
replace_symbol_body:       Targeted function body replacement
get_symbols_overview:      Project structure map
```

## Development

### Prerequisites

- Claude Code CLI with MCP support
- Python 3.10+ (for `code-review-graph`)
- Git

### Rebuild Graph

```bash
# Via plugin
/supergraph:scan

# Or manually from shell
code-review-graph build
```

## Changelog

See [CHANGELOG.md](./plugins/supergraph/CHANGELOG.md) for version history and breaking changes.

## License

MIT — see [LICENSE](./LICENSE) for details.

## Repository

GitHub: https://github.com/datit309/supergraph

Issues, PRs, and feature requests welcome.
