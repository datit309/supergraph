# Supergraph

Mandatory AI workflows + intelligent codebase graph analysis.

Combines [superpowers](https://github.com/obra/superpowers) methodology
with [code-review-graph](https://github.com/tirth8205/code-review-graph) AST analysis.

## Two Platforms

| Plugin | Platform | Prefix | Install Command |
|--------|----------|--------|-----------------|
| `supergraph-claude` | Claude Code | `/sg-` | `/plugin install supergraph-claude` |
| `supergraph-codex` | OpenAI Codex | `$sg-` | `codex plugin marketplace add datit309/supergraph` |

## Install (Claude Code)

```bash
# Add plugin marketplace
/plugin marketplace add https://github.com/datit309/supergraph.git

# Install plugin
/plugin install supergraph-claude
```

## Install (OpenAI Codex)

```bash
# From GitHub
codex plugin marketplace add datit309/supergraph

# From specific branch
codex plugin marketplace add datit309/supergraph --ref main
```

## Prerequisites

```bash
pip install code-review-graph
code-review-graph index .
```

## What It Does

    Without supergraph:
      AI reads 27,700 files → writes code → no tests → sends PR
      Tokens: 443,200 | Quality: ?

    With supergraph:
      AI reads 15 files (blast radius) → plans → TDD → graph review → auto-fix → merge
      Tokens: 4,260 | Quality: production-ready

## Skills

| Skill           | Trigger              | What It Does                    |
| --------------- | -------------------- | ------------------------------- |
| `sg-context`    | Session start        | Load codebase graph             |
| `sg-brainstorm` | Non-trivial task     | Understand with graph data      |
| `sg-plan`       | Before coding        | Graph-informed task breakdown   |
| `sg-execute`    | Executing plan       | Run saved plan with checkpoints |
| `sg-finish`     | Completing work      | Merge, PR, or discard options   |
| `sg-tdd`        | Every implementation | RED → GREEN → REFACTOR          |
| `sg-review`     | Before merge         | Graph-enhanced code review      |
| `sg-blast`      | Impact analysis      | Find affected files             |
| `sg-fix`        | After coding         | Auto test + lint + review loop  |
| `sg-refactor`   | Refactoring          | Safe incremental refactoring    |
| `sg-inspect`    | Deep dive            | File/symbol/module analysis     |

## How It Works

1. **Session starts** → `sg-context` loads graph
2. **Task arrives** → `sg-brainstorm` explores with graph data
3. **Before coding** → `sg-plan` uses blast_radius for scope
4. **Implementing** → `sg-tdd` enforces RED-GREEN-REFACTOR
5. **After coding** → `sg-fix` runs test + lint + review loop (max 3x)
6. **Before merge** → `sg-review` does full graph analysis
7. **Refactoring** → `sg-refactor` ensures safe incremental changes

## Agents

| Agent         | Purpose                           |
| ------------- | --------------------------------- |
| code-reviewer | Specialized graph-enhanced review |
| auto-fixer    | Iterative test + lint + fix loop  |

## Quick Usage (Claude Code)

```bash
/sg-brainstorm        # Understand the task
/sg-plan              # Create plan with blast radius
/sg-tdd              # Implement with TDD
/sg-fix              # Auto-fix issues
/sg-review           # Final review
/sg-finish           # Merge/PR/discard
```

## Quick Usage (OpenAI Codex)

```bash
$sg-brainstorm        # Understand the task
$sg-plan              # Create plan with blast radius
$sg-tdd              # Implement with TDD
$sg-fix              # Auto-fix issues
$sg-review           # Final review
$sg-finish           # Merge/PR/discard
```

## Requirements

- Claude Code CLI hoặc OpenAI Codex CLI
- Python 3.8+
- Git repository
- code-review-graph (`pip install code-review-graph`)

## License

MIT