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

## Usage

Gọi skills với `/sg-` prefix:

```bash
/sg-context     # Load codebase graph khi bắt đầu session
/sg-brainstorm  # Hiểu task với graph data trước khi code
/sg-plan        # Tạo plan với blast radius analysis
/sg-tdd         # Implement với RED → GREEN → REFACTOR
/sg-fix         # Auto-fix loop (test + lint + review)
/sg-review      # Graph-enhanced code review trước merge
/sg-finish      # Merge, PR, hoặc discard
```

## Skills

| Skill           | Trigger              | Mô tả                           |
| --------------- | -------------------- | ------------------------------- |
| `/sg-context`   | Session start        | Load codebase graph             |
| `/sg-brainstorm`| Non-trivial task     | Hiểu requirement với graph      |
| `/sg-plan`      | Before coding        | Graph-informed task breakdown   |
| `/sg-tdd`       | Every implementation | RED → GREEN → REFACTOR         |
| `/sg-review`    | Before merge         | Graph-enhanced code review      |
| `/sg-blast`     | Impact analysis      | Find affected files             |
| `/sg-fix`       | After coding         | Auto test + lint + review loop  |
| `/sg-refactor`  | Refactoring          | Safe incremental refactoring    |
| `/sg-inspect`   | Deep dive            | File/symbol/module analysis     |
| `/sg-execute`   | Executing plan       | Run saved plan with checkpoints |
| `/sg-finish`    | Completing work      | Merge, PR, or discard options   |

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