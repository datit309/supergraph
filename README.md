# Supergraph for AI Coding Agents

> [Tiếng Việt](./README-VI.md) · [Installation Guide](./docs/INSTALLATION.md) · [Workflow Examples](./docs/EXAMPLES.md) · [Team Setup](./plugins/supergraph/docs/TEAM-SETUP.md)

**Turn AI coding agents from code generators into disciplined engineering workflow systems.**

Supergraph enforces planning, TDD, verification, review, and architecture-aware decision making through mandatory workflows, graph intelligence, and LSP-powered code analysis across Claude Code, OpenAI Codex CLI, Google Antigravity, OpenCode, and DeepSeek Harness (DSH).

---

## What Supergraph Does

Every non-trivial change follows the strict engineering lifecycle:

`scan → analyze → plan → TDD → execute → fix → verify → review`

The graph layer is powered by [Codebase Memory MCP](https://github.com/DeusData/codebase-memory-mcp) (`>= 0.10.8,<0.11.0`). It indexes repository state locally into `.codebase-memory/graph.db.zst` (cache in `~/.cache/codebase-memory-mcp`) via `index_repository`, providing mathematical blast radius, call hierarchy, dependency cycles, and test gaps. [Serena](https://github.com/oraios/serena) provides LSP-level symbol navigation and diagnostics.

### Windows Hook Behavior
On Windows, `hooks/run-hook.cmd` dynamically resolves Git Bash across standard and user-level paths. If Git Bash is not found, hooks skipped with a warning, keeping platform execution non-blocking.

---

## Supported Platforms

| Platform | Configuration | Instructions File |
|---|---|---|
| **Claude Code** | Marketplace / Plugin | `CLAUDE.md` |
| **OpenAI Codex CLI** | Marketplace / Local installer | `AGENTS.md` |
| **Google Antigravity** | Local installer | `AGENTS.md` |
| **OpenCode** | Local installer (`/skills`) | `OPENCODE.md` |
| **DeepSeek Harness (DSH)** | Native Cordis Bundle (`cordis.patch.yml`) | `AGENTS.md` |

---

## Quick Install (One-Command)

macOS, Linux, or WSL (defaults to all platforms):
```bash
curl -fsSL https://raw.githubusercontent.com/datit309/supergraph/master/install.sh | sh
```

Windows PowerShell 5.1+:
```powershell
irm https://raw.githubusercontent.com/datit309/supergraph/master/install.ps1 | iex
```

*Security: Inspect installer scripts before piping remote code into a shell.*

Install for a specific platform:
```bash
curl -fsSL https://raw.githubusercontent.com/datit309/supergraph/master/install.sh | sh -s -- --platform [claude|codex|antigravity|opencode|dsh|all]
```

### Automatic update notifications
Supergraph checks for newer versions at SessionStart (at most once every 24h). Update commands:
```text
Claude Code: /plugin marketplace update supergraph
Codex: codex plugin marketplace upgrade supergraph
Antigravity: curl -fsSL https://raw.githubusercontent.com/datit309/supergraph/master/install.sh | sh -s -- --platform antigravity
OpenCode: curl -fsSL https://raw.githubusercontent.com/datit309/supergraph/master/install.sh | sh -s -- --platform opencode
DSH: dsh plugin --profile web update supergraph
```
Set `SUPERGRAPH_UPDATE_CHECK=false` to disable. Note: OpenCode does not currently expose a SessionStart hook.

👉 **For manual clone & detailed per-platform steps, see [docs/INSTALLATION.md](./docs/INSTALLATION.md).**

---

## MCP Setup

```bash
# 1. Codebase Memory MCP (Required)
pip install 'codebase-memory-mcp>=0.10.8,<0.11.0'
codebase-memory-mcp cli index_repository --repo-path "$(pwd)" --name supergraph --mode moderate

# 2. Serena MCP (Optional, LSP symbol navigation)
uv tool install -p 3.13 serena-agent

# 3. Supergraph Team MCP & Browser Agent (Built-in)
# Automatically bundled across all platforms with live dashboard (:3333).
```

---

## Quick Start

```bash
# 1. Start session — scan graph context
/supergraph:scan

# 2. Analyze problem & blast radius
/supergraph:analyze

# 3. Create implementation plan
/supergraph:plan

# 4. Execute with isolated git worktrees & TDD
/supergraph:execute

# 5. Auto-fix loop
/supergraph:fix

# 6. E2E Browser & API verification (Rust CDP agent-browser)
/supergraph:browser-agent

# 7. Verification evidence & review
/supergraph:verify
/supergraph:review
```

👉 **For comprehensive walkthroughs, see [docs/EXAMPLES.md](./docs/EXAMPLES.md).**

---

## Skills Catalog

| Skill | Purpose | When to use |
|---|---|---|
| `/supergraph:scan` | Scan project structure, build/verify graph | Start of every session |
| `/supergraph:explore` | Codebase exploration & architectural discovery | Complex research without code mutation |
| `/supergraph:analyze` | Graph risk analysis, blast radius, approaches | Ambiguous scope, hub/bridge nodes |
| `/supergraph:sdd` | Software Design Document with schemas | Formal architecture specs |
| `/supergraph:plan` | Implementation plan with embedded contracts | Before any non-trivial change |
| `/supergraph:tdd` | Strict Test-Driven Development (RED → GREEN) | Implementing any feature or bugfix |
| `/supergraph:execute` | Multi-worker Wave DAG execution (Worktrees) | Executing saved plans |
| `/supergraph:fix` | Plan-aware auto-fix loop (tests, lint, format) | After code changes complete |
| `/supergraph:integration`| Integration, contract, and DB test runs | After unit tests pass |
| `/supergraph:browser-agent`| ISTQB QA testing & human browser emulation | E2E web/API testing, anti-bot bypass |
| `/supergraph:vibesec` | Security audit (OWASP Top 10, IDOR, SQLi) | Security reviews & sensitive endpoints |
| `/supergraph:verify` | Fresh verification evidence gate | Before claiming done or committing |
| `/supergraph:review` | Independent code review & merge verdict | Before merge |
| `/supergraph:diagnose` | 6-phase scientific debugging loop | Elusive bugs with unknown cause |
| `/supergraph:serena` | LSP symbol navigation & safe refactoring | Complex cross-file refactors |
| `/supergraph:zoom-out` | Domain vocabulary module map | Lost in unfamiliar code |
| `/supergraph:architecture`| Self-contained HTML architecture report | Pre-refactor or onboarding |
| `/supergraph:handoff` | Session context compaction | Session end or switching contexts |
| `/supergraph:caveman` | Token compression mode (~75% reduction) | Long sessions & token efficiency |

---

## Specialized Subagent Suite

Supergraph deploys 7 specialized, single-responsibility subagents:

1. **`plan-writer`:** Analyzes code graph and crafts plans (never writes code).
2. **`plan-reviewer`:** Independently reviews plans for spec alignment and completeness.
3. **`executor`:** Executes tasks inside isolated git worktrees with strict TDD.
4. **`qa-tester`:** Generates ISTQB test matrices and runs autonomous E2E browser & API tests.
5. **`security-auditor`:** Audits diffs against OWASP Top 10, IDOR, injection, and secrets.
6. **`diagnostician`:** Isolates minimal repros and diagnoses root causes scientifically.
7. **`code-reviewer`:** Independent final reviewer assessing diffs against requirements.

---

## Team Setup & Multi-Agent Collaboration

Supergraph Team coordinates multi-agent DAG execution with zero file conflicts:
- **Worktree Isolation:** Concurrent tasks run in isolated worktrees (`.supergraph/worktrees/`).
- **Live Monitor Dashboard:** Real-time DAG visualization at `http://127.0.0.1:3333`.

👉 **For complete team onboarding and branch strategy, see [plugins/supergraph/docs/TEAM-SETUP.md](./plugins/supergraph/docs/TEAM-SETUP.md).**

---

## Hard Rules

1. NEVER code without an approved plan.
2. NEVER implement without a verified failing RED test.
3. NEVER modify hub nodes without user approval.
4. NEVER skip the auto-fix loop.
5. NEVER commit if tests fail or review has CRITICAL findings.
6. ALWAYS query graph tools (`search_graph`, `trace_path`) before assuming relationships.
7. ALWAYS verify browser/API features with `browser-agent` (Rust CDP, zero Playwright).

---

## Project Structure

```text
supergraph/
├── plugins/supergraph/
│   ├── skills/                 # 41 engineering skills
│   ├── agents/                 # 7 specialized subagents
│   ├── hooks/                  # Smart lifecycle hooks
│   └── docs/TEAM-SETUP.md      # Team collaboration guide
├── docs/
│   ├── INSTALLATION.md         # Detailed platform installation
│   └── EXAMPLES.md             # End-to-end workflow walkthroughs
├── AGENTS.md                   # Workflows for Codex, Antigravity, DSH
├── CLAUDE.md                   # Workflows for Claude Code
└── settings.json               # Auto-allow permissions
```

---

## License & Privacy

- **Local-First & Private:** Codebase graphs and browser profiles remain strictly on your local machine. No code is transmitted to external servers.
- **License:** MIT License. © 2026 datit309.
