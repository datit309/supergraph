# Changelog

## 1.0.0

### Features

- 11 skills: context, brainstorm, plan, tdd, review, blast, fix, refactor, inspect, execute, finish
- 4 agents: planner, executor, code-reviewer, auto-fixer
- MCP integration with code-review-graph
- Auto language detection: Node.js, Flutter, PHP, Python, Go, Rust
- Auto-fix loop: test + lint + graph review, max 3 iterations
- Blast radius analysis for change impact
- Hub node protection — requires user approval
- Community boundary detection
- Surprise score flagging
- Hook system for pre/post code write tracking
- Team coordination via plan files
- CI/CD integration with GitHub Actions

### Skills

| Skill | Trigger | Purpose |
|-------|---------|---------|
| `sg-context` | Session start | Load codebase graph |
| `sg-brainstorm` | Non-trivial task | Understand requirements with graph data |
| `sg-plan` | Before coding | Graph-informed task breakdown |
| `sg-tdd` | Every implementation | RED → GREEN → REFACTOR |
| `sg-review` | Before merge | Graph-enhanced code review |
| `sg-blast` | Impact analysis | Find affected files |
| `sg-fix` | After coding | Auto test + lint + review loop |
| `sg-refactor` | Refactoring | Safe incremental refactoring |
| `sg-inspect` | Deep dive | File/symbol/module analysis |
| `sg-execute` | Executing plan | Run saved plan with checkpoints |
| `sg-finish` | Completing work | Merge, PR, or discard options |

### Agents

| Agent | Purpose |
|-------|---------|
| `supergraph-planner` | Create plans, never code |
| `supergraph-executor` | Execute saved plans with TDD |
| `supergraph-auto-fixer` | Automated fix loop |
| `supergraph-code-reviewer` | Graph-enhanced code review |

### Supported Languages

- Node.js / TypeScript (jest, vitest, mocha, eslint)
- Flutter / Dart (flutter test, flutter analyze)
- PHP (phpunit, pest, phpstan, phpcs)
- Python (pytest, ruff)
- Go (go test, golangci-lint)
- Rust (cargo test, clippy)