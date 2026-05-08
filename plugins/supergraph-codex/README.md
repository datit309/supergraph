# Supergraph for OpenAI Codex

Plugin cho OpenAI Codex: mandatory AI workflows + intelligent codebase graph analysis.

Combines [superpowers](https://github.com/obra/superpowers) methodology
with [code-review-graph](https://github.com/tirth8205/code-review-graph) AST analysis.

## Install

### Option 1: Git Repository (Recommended)

```bash
# From GitHub
codex plugin marketplace add datit309/supergraph

# From specific branch
codex plugin marketplace add datit309/supergraph --ref main
```

### Option 2: Local Directory

```bash
# From any Git URL (sparse checkout)
codex plugin marketplace add https://github.com/datit309/supergraph.git --sparse .agents/plugins

# From local directory
codex plugin marketplace add ./supergraph-codex
```

## Usage

Gọi skills với `$` prefix trong conversation:

```bash
$sg-context     # Load codebase graph khi bắt đầu session
$sg-brainstorm  # Hiểu task với graph data trước khi code
$sg-plan        # Tạo plan với blast radius analysis
$sg-tdd         # Implement với RED → GREEN → REFACTOR
$sg-fix         # Auto-fix loop (test + lint + review)
$sg-review      # Graph-enhanced code review trước merge
$sg-finish      # Merge, PR, hoặc discard
```

## Skills

| Skill           | Trigger              | Mô tả                           |
| --------------- | -------------------- | ------------------------------- |
| `$sg-context`   | Session start        | Load codebase graph             |
| `$sg-brainstorm`| Non-trivial task     | Hiểu requirement với graph      |
| `$sg-plan`      | Before coding        | Graph-informed task breakdown   |
| `$sg-tdd`       | Every implementation | RED → GREEN → REFACTOR         |
| `$sg-review`    | Before merge         | Graph-enhanced code review      |
| `$sg-blast`     | Impact analysis      | Find affected files             |
| `$sg-fix`       | After coding         | Auto test + lint + review loop  |
| `$sg-refactor`  | Refactoring          | Safe incremental refactoring    |
| `$sg-inspect`   | Deep dive            | File/symbol/module analysis     |
| `$sg-execute`   | Executing plan       | Run saved plan with checkpoints |
| `$sg-finish`    | Completing work      | Merge, PR, or discard options   |

## Prerequisites

- OpenAI Codex CLI
- Python 3.8+ (cho code-review-graph)
- Git repository

## Code Review Graph MCP

Plugin sử dụng [code-review-graph](https://github.com/tirth8205/code-review-graph) MCP server cho graph analysis.

```bash
pip install code-review-graph
code-review-graph index .
```

## License

MIT