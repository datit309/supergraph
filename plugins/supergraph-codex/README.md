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

Goi skills voi `$` prefix trong conversation:

```bash
$sg-context     # Load codebase graph khi bat dau session
$sg-plan       # Tao plan voi blast radius analysis
$sg-tdd        # Implement voi RED -> GREEN -> REFACTOR
$sg-fix        # Auto-fix loop (test + lint + review)
$sg-integration # Validate cross-module behavior
$sg-review     # Graph-enhanced code review truoc merge
```

## Skills

| Skill             | Trigger              | Mo ta                              |
| ----------------- | -------------------- | ---------------------------------- |
| `$sg-context`     | Session start        | Load codebase graph               |
| `$sg-plan`        | Before coding        | Graph-informed task breakdown      |
| `$sg-tdd`         | Every implementation | RED -> GREEN -> REFACTOR           |
| `$sg-fix`         | After coding         | Auto test + lint + review loop     |
| `$sg-integration` | After fix            | Validate cross-module behavior     |
| `$sg-review`      | Before merge         | Graph-enhanced code review         |
| `$sg-execute`     | Executing plan       | Run saved plan with checkpoints    |

## Prerequisites

- OpenAI Codex CLI
- Python 3.8+ (cho code-review-graph)
- Git repository

## Code Review Graph MCP

Plugin su dung [code-review-graph](https://github.com/tirth8205/code-review-graph) MCP server cho graph analysis.

```bash
pip install code-review-graph
code-review-graph index .
```

## License

MIT