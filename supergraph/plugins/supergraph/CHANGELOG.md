# Changelog

## 1.0.0

### Features

- 9 skills: context, brainstorm, plan, tdd, review, blast, fix, refactor, inspect
- 2 agents: code-reviewer, auto-fixer
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
