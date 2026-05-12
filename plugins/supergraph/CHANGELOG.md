# Changelog

## 1.0.1

### Features

- 8 skills: context, plan, tdd, execute, fix, integration, verify, review
- 4 agents: executor, plan-writer, code-reviewer, plan-reviewer
- MCP integration with code-review-graph
- Auto language detection: Node.js, Flutter, PHP
- Auto-fix loop: test + lint + graph review, max 3 iterations
- Blast radius analysis for change impact
- Hub node protection — requires user approval
- Community boundary detection
- Surprise score flagging
- Hook system for pre/post code write tracking

### Supported Languages

- Node.js / TypeScript (jest, vitest, mocha, eslint)
- Flutter / Dart (flutter test, flutter analyze)
- PHP (phpunit, pest, phpstan, phpcs)
