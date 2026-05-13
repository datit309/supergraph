# Supergraph for Claude Code

Plugin cho Claude Code: mandatory AI workflows + intelligent codebase graph analysis.

Combines [superpowers](https://github.com/obra/superpowers) methodology
with [code-review-graph](https://github.com/tirth8205/code-review-graph) AST analysis.

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
Task received     → /supergraph:plan         (scan + analyze + save plan)
Implementation    → /supergraph:tdd          (RED-GREEN-REFACTOR)
Post-code         → /supergraph:fix          (auto-fix loop)
Before claim      → /supergraph:verify       (fresh evidence gate)
Pre-merge         → /supergraph:review       (graph review → verdict)
```

**Quick path** (small changes, 1-2 files): skip plan → `/supergraph:tdd` → `/supergraph:fix` → `/supergraph:review`

**Agents:**

- `plan-writer` — create plans, never code
- `plan-reviewer` — review plans before execution
- `supergraph-executor` — execute saved plans with TDD

## MCP Tools

| Tool                              | Purpose                 |
| --------------------------------- | ----------------------- |
| `build_or_update_graph_tool`      | Build/refresh graph     |
| `list_graph_stats_tool`           | Graph health            |
| `get_impact_radius_tool`          | Blast radius            |
| `get_hub_nodes_tool`              | Most-connected nodes    |
| `get_bridge_nodes_tool`           | Chokepoints             |
| `list_communities_tool`           | Code clusters           |
| `get_surprising_connections_tool` | Unexpected coupling     |
| `get_knowledge_gaps_tool`         | Untested hotspots       |
| `get_review_context_tool`         | Token-optimized context |
| `get_architecture_overview_tool`  | Architecture map        |
| `get_affected_flows_tool`         | Flows affected          |
| `detect_changes_tool`             | Risk-scored impact      |
| `query_graph_tool`                | Callers/callees/tests   |
| `traverse_graph_tool`             | BFS/DFS exploration     |
| `semantic_search_nodes_tool`      | Search by meaning       |

## Team Use

See [docs/TEAM-SETUP.md](docs/TEAM-SETUP.md) for onboarding, CI/CD, pre-commit hooks, and PR templates.

**Quick team setup:**

```bash
cp -r supergraph/plugins/supergraph/.claude-plugin /path/to/repo/.claude-plugin
cp supergraph/plugins/supergraph/.mcp.json /path/to/repo/.mcp.json
cp -r supergraph/plugins/supergraph/.github /path/to/repo/.github
cp supergraph/plugins/supergraph/.githooks/pre-commit /path/to/repo/.githooks/
chmod +x /path/to/repo/.githooks/pre-commit
cd /path/to/repo && git config core.hooksPath .githooks
echo ".claude/settings.local.json" >> .gitignore
```

## Rules

- Never write code without a plan (skip only for small changes)
- Always TDD: RED → GREEN → REFACTOR
- Environment Context mandatory in plan files
- Checkpoint after each task — `git add [exact files] && git commit`
- Max 3 retries per step — stop if blocked
- CRITICAL issues block merge

## License

MIT
