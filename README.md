# supergraph

Claude Code plugin: mandatory AI workflows + intelligent codebase graph analysis.

Combines [superpowers](https://github.com/obra/superpowers) methodology
with [code-review-graph](https://github.com/tirth8205/code-review-graph) AST analysis.

## Install

### Option 1: From Local Directory

    # Clone plugin
    git clone https://github.com/datit309/supergraph.git

    # Add plugin to marketplace
    /plugin marketplace add ./supergraph

    # Install plugin
    /plugin install supergraph

## Prerequisites

    pip install code-review-graph
    code-review-graph index .

## What It Does

    Without supergraph:
      AI reads 27,700 files → writes code → no tests → sends PR
      Tokens: 443,200 | Quality: ?

    With supergraph:
      AI reads 15 files (blast radius) → plans → TDD → graph review → auto-fix → merge
      Tokens: 4,260 | Quality: production-ready

## Skills (Auto-triggered)

| Skill      | Trigger              | What It Does                    |
| ---------- | -------------------- | ------------------------------- |
| context    | Session start        | Load codebase graph             |
| brainstorm | Non-trivial task     | Understand with graph data      |
| plan       | Before coding        | Graph-informed task breakdown   |
| execute    | Executing plan       | Run saved plan with checkpoints |
| finish     | Completing work      | Merge, PR, or discard options   |
| tdd        | Every implementation | RED → GREEN → REFACTOR          |
| review     | Before merge         | Graph-enhanced code review      |
| blast      | Impact analysis      | Find affected files             |
| fix        | After coding         | Auto test + lint + review loop  |
| refactor   | Refactoring          | Safe incremental refactoring    |
| inspect    | Deep dive            | File/symbol/module analysis     |

## Agents

| Agent         | Purpose                           |
| ------------- | --------------------------------- |
| code-reviewer | Specialized graph-enhanced review |
| auto-fixer    | Iterative test + lint + fix loop  |

## Language Support

| Language             | Test                   | Lint            |
| -------------------- | ---------------------- | --------------- |
| Node.js / TypeScript | npm test, jest, vitest | eslint          |
| Flutter / Dart       | flutter test           | flutter analyze |
| PHP                  | phpunit, pest          | phpstan, phpcs  |

## How It Works

1. **Session starts** → context skill loads graph
2. **Task arrives** → brainstorm skill explores with graph data
3. **Before coding** → plan skill uses blast_radius for scope
4. **Implementing** → tdd skill enforces RED-GREEN-REFACTOR
5. **After coding** → fix skill runs test + lint + review loop (max 3x)
6. **Before merge** → review skill does full graph analysis
7. **Refactoring** → refactor skill ensures safe incremental changes

## Requirements

- Claude Code CLI
- Python 3.8+
- Git repository
- code-review-graph (`pip install code-review-graph`)

## License

MIT
