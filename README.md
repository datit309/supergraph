# Supergraph for Claude Code

Plugin cho Claude Code: mandatory AI workflows + intelligent codebase graph analysis.

Combines [superpowers](https://github.com/obra/superpowers) methodology with [code-review-graph](https://github.com/tirth8205/code-review-graph) AST analysis for production-grade software engineering.

## Highlights

- **Mandatory guarded workflows** — no code without plan, no merge without review
- **Codebase graph analysis** — blast radius, hub nodes, surprising connections
- **Parallel task execution** — independent tasks run concurrently, dependencies respected
- **Strict TDD enforcement** — RED → GREEN → REFACTOR with checkpoint commits
- **Multi-language support** — Node.js, Flutter, PHP auto-detection
- **Escalation paths built-in** — stuck tasks, fix loops, review cycles, rollback

## Quick Install

```bash
# From Git repository
/plugin marketplace add https://github.com/datit309/supergraph.git
/plugin install supergraph

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

| Skill           | File                          | Purpose                                  | When                                     |
| --------------- | ----------------------------- | ---------------------------------------- | ---------------------------------------- |
| **Scan**        | `skills/scan/SKILL.md`        | Load graph, detect project, save env     | Session start — **first thing**          |
| **Analyze**     | `skills/analyze/SKILL.md`     | Risk analysis, approach selection        | Ambiguous requirements, hub/bridge nodes |
| **Plan**        | `skills/plan/SKILL.md`        | Graph scan, blast radius, task breakdown | Before writing **any** code              |
| **Execute**     | `skills/execute/SKILL.md`     | Dispatch plan, orchestrate tasks         | Plan saved, ready to implement           |
| **TDD**         | `skills/tdd/SKILL.md`         | Per-task RED → GREEN → REFACTOR          | Implementing feature/fix                 |
| **Fix**         | `skills/fix/SKILL.md`         | Auto-fix: test + lint + format + graph   | After all coding, before verify          |
| **Integration** | `skills/integration/SKILL.md` | Integration + e2e tests                  | After unit tests pass                    |
| **Verify**      | `skills/verify/SKILL.md`      | Fresh evidence gate                      | Before claiming done/ready/commit        |
| **Review**      | `skills/review/SKILL.md`      | Graph review → verdict                   | Before merge/PR                          |

### Invocation

All skills use `/supergraph:` prefix to avoid conflicts with built-in commands:

```bash
/supergraph:scan
/supergraph:analyze
/supergraph:plan
/supergraph:tdd
/supergraph:fix
/supergraph:integration
/supergraph:verify
/supergraph:review
/supergraph:execute
```

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
2. **Plan** → Graph analysis, blast radius, task decomposition, TDD mapping
3. **Execute** → Parallel dispatch for independent tasks, sequential for dependencies
4. **TDD per task** → RED (fail) → GREEN (minimal) → REFACTOR (cleanup)
5. **Fix loop** → Test + lint + format + graph (max 3 iterations)
6. **Integration** → Integration/e2e tests if configured
7. **Verify** → Fresh evidence gate — no claims without proof
8. **Review** → Independent graph-aware code review → PASS / NEEDS_CHANGES / BLOCKED

See [FLOW.md](./FLOW.md) for the complete flowchart with rollback paths and escalation gates.

## Agents — Who Does What

| Agent                        | Role                       | Created By                | Executes                            |
| ---------------------------- | -------------------------- | ------------------------- | ----------------------------------- |
| **supergraph-planner**       | Plan only, never code      | `/supergraph:plan`        | `/supergraph:analyze` → plan file   |
| **supergraph-executor**      | Execute only, never plan   | `/supergraph:execute`     | Plan tasks via TDD + checkpoints    |
| **(subagent) plan-reviewer** | Review plans pre-execution | Auto-dispatched by plan   | Completeness + spec alignment check |
| **(subagent) code-reviewer** | Final code review          | Auto-dispatched by review | Diff review → verdict               |

Agents are self-contained — they receive only the relevant context, no session history.

## Codebase Graph Analysis

Powered by `code-review-graph` AST indexing, Supergraph maps your entire codebase as an interconnected graph:

| Analysis               | Tool                              | Use When                                     |
| ---------------------- | --------------------------------- | -------------------------------------------- |
| Blast radius           | `get_impact_radius_tool`          | What files break if I change X?              |
| Hub nodes              | `get_hub_nodes_tool`              | Which files are high-risk central nodes?     |
| Bridge nodes           | `get_bridge_nodes_tool`           | Where does coupling cross module boundaries? |
| Communities            | `list_communities_tool`           | How is the code clustered?                   |
| Test coverage          | `get_knowledge_gaps_tool`         | Which files lack tests?                      |
| Surprising connections | `get_surprising_connections_tool` | Unexpected dependencies lurking?             |
| Architecture overview  | `get_architecture_overview_tool`  | Module diagram of the codebase               |
| Affected flows         | `get_affected_flows_tool`         | Which user journeys break?                   |
| Change detection       | `detect_changes_tool`             | Risk-scored impact of recent changes         |

The graph is used to:

- **Warn before hub node edits** (require user approval)
- **Flag high blast radius** (>20 files → discuss with user)
- **Detect circular dependencies** (block merge)
- **Calculate surprise scores** (>0.7 → investigate)
- **Route cross-community changes** through review gates

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

## Stuck / Escalation Table

| Condition                      | Action                                     |
| ------------------------------ | ------------------------------------------ |
| TDD fails 3 times              | Mark task `stuck`, skip, continue next     |
| Fix loop fails 3 iterations    | STOP → report issues → never commit broken |
| Review returns `NEEDS_CHANGES` | Return to fix (max 2 review cycles)        |
| Review returns `BLOCKED`       | Escalate to human immediately              |
| Blast radius > 20 files        | STOP — discuss with user before proceeding |
| Hub node modification          | REQUIRE explicit user approval             |
| Surprise score > 0.7           | REQUIRE investigation & justification      |
| New circular dependency        | BLOCK — fix before merge                   |

## Auto Language Detection

At session start, the scan skill auto-detects project type:

- `pubspec.yaml` → Flutter/Dart
- `package.json` → Node.js (TypeScript/JavaScript)
- `composer.json` → PHP

The correct test/lint/build commands are loaded from `.supergraph-env` or project config.

## Project Structure

```
.
├── README.md                 # This file
├── FLOW.md                   # Complete workflow diagram + escalation paths
├── SKILL.md                  # Skill dispatch table + hard rules
├── SOUL.md                   # Engineering identity + defaults
├── AUDIT-supergraph-claude.md # Audit & changelog
│
├── plugins/supergraph/
│   ├── .claude-plugin/
│   │   └── plugin.json       # Plugin manifest (version, agents, skills)
│   ├── skills/
│   │   ├── analyze/          # Risk analysis & approach selection
│   │   ├── plan/             # Graph-informed plan creation
│   │   ├── execute/          # Plan dispatch & orchestration
│   │   ├── tdd/              # RED-GREEN-REFACTOR per task
│   │   ├── fix/              # Auto-fix loop
│   │   ├── integration/      # E2E tests
│   │   ├── verify/           # Verification gate
│   │   ├── review/           # Final graph-aware review
│   │   └── scan/             # Context loading & graph build
│   ├── agents/
│   │   ├── executor.md       # Executes plans, never creates them
│   │   ├── plan-writer.md    # Creates plans, never executes
│   │   └── code-reviewer.md  # Final review agent
│   ├── themes/
│   ├── hooks/
│   ├── .github/workflows/
│   ├── CLAUDE.md             # Engineering principles
│   ├── SKILL.md              # Meta-orchestrator skill
│   └── SOUL.md               # Identity & security mindset
│
├── docs/
│   └── (plans saved here by plan skill)
│
├── .serena/                  # Serena code intelligence
├── .claude/                  # Claude Code settings
├── .code-review-graph/       # Graph index + metadata
└── .githooks/                # Pre-commit hooks (lint + test)
```

**Skill files** are discovered by directory convention:

- Each skill directory contains a `SKILL.md` file
- The plugin manifest (`plugin.json`) maps skill names to these directories
- Agents are defined as markdown prompt templates in `agents/`

## Team Setup

Copy project scaffolding to your repo for team-wide consistency:

```bash
cp -r plugins/supergraph/.claude-plugin /path/to/your/repo/.claude-plugin
cp plugins/supergraph/.mcp.json /path/to/your/repo/.mcp.json
cp -r plugins/supergraph/.github /path/to/your/repo/.github
cp plugins/supergraph/.githooks/pre-commit /path/to/your/repo/.githooks/
chmod +x /path/to/your/repo/.githooks/pre-commit
cd /path/to/your/repo && git config core.hooksPath .githooks
echo ".claude/settings.local.json" >> .gitignore
```

See [docs/TEAM-SETUP.md](./docs/TEAM-SETUP.md) for CI/CD pipelines, pre-commit hooks, PR templates, and team onboarding.

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

The plugin exposes a suite of graph analysis tools:

```yaml
build_or_update_graph_tool: Build/refresh AST graph from codebase
list_graph_stats_tool: Graph health + index status
get_impact_radius_tool: Blast radius for file changes
get_hub_nodes_tool: High-centrality files (risk hotspots)
get_bridge_nodes_tool: Cross-module coupling chokepoints
list_communities_tool: Detected code clusters/modules
get_surprising_connections_tool: Unexpected coupling warnings
get_knowledge_gaps_tool: Untested files coverage gaps
get_review_context_tool: Token-optimized relevant context
get_architecture_overview_tool: Module dependency diagram
get_affected_flows_tool: Affected user journeys
detect_changes_tool: Risk-scored impact analysis
query_graph_tool: Symbol lookup (callers/callees/tests)
traverse_graph_tool: BFS/DFS path exploration
semantic_search_nodes_tool: Search by semantic meaning
```

All tools powered by `code-review-graph` — see its documentation for API details.

## Development

### Prerequisites

- Claude Code CLI with MCP support
- Python 3.10+ (for `code-review-graph`)
- Git

### Build & Test Plugin

```bash
cd plugins/supergraph
# Plugin is loaded automatically by Claude Code from .claude-plugin/
# To modify skills/agents: edit .md files directly; reload with /plugin reload
```

### View Available Skills

```bash
# List all loaded skills
/cli skill list

# Read a specific skill
/cli skill get supergraph:plan
```

### Rebuild Graph

```bash
# From any project directory using the plugin
/supergraph:scan   # forced graph rebuild via MCP tool
# or manually from shell
code-review-graph build
```

## Changelog

See [CHANGELOG.md](./plugins/supergraph/CHANGELOG.md) for version history and breaking changes.

## License

MIT — see [LICENSE](./LICENSE) for details.

## Repository

GitHub: https://github.com/datit309/supergraph

Issues, PRs, and feature requests welcome.
