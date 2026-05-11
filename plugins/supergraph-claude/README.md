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

## Skills

| Skill   | Command               | Purpose                                    |
| ------- | --------------------- | ------------------------------------------ |
| Context | `/supergraph:context` | Load graph context at session start        |
| Plan    | `/supergraph:plan`    | Scan codebase + graph analysis + save plan |
| TDD     | `/supergraph:tdd`     | RED-GREEN-REFACTOR implementation          |
| Fix     | `/supergraph:fix`     | Auto-fix loop (test + lint + graph)        |
| Review  | `/supergraph:review`  | Pre-merge graph-enhanced review            |

## Agents

| Agent                 | Purpose                          |
| --------------------- | -------------------------------- |
| `supergraph-planner`  | Create plans only, never execute |
| `supergraph-executor` | Execute saved plans with TDD     |

## Hooks

- **PreToolUse**: Blocks code writes if no plan file exists
- **PostToolUse**: Auto-updates graph on file changes, blocks destructive commands
- **Stop**: Shows plan progress and uncommitted changes reminder

## Prerequisites

- Claude Code CLI
- Python 3.8+ (cho code-review-graph)
- Git repository

## Code Review Graph MCP

Plugin sử dụng [code-review-graph](https://github.com/tirth8205/code-review-graph) MCP server cho graph analysis.

```bash
pip install code-review-graph
code-review-graph build
```

## License

MIT
